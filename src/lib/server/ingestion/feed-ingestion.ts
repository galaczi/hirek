import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	articleCategories,
	articleCategoryOverrides,
	articles,
	categories,
	sourceFeeds,
	sources
} from '$lib/server/db/schema';
import type { ArticleSearchDocument } from '$lib/server/search/types';
import { configureArticleIndex, indexArticles } from '$lib/server/search/meili';
import { inferCategorySlugs } from '$lib/server/categorization/rules';
import { getCategorySlugsForUrl } from '$lib/server/categorization/url-rules';
import { publishLiveArticles, type LiveArticleEvent } from '$lib/server/live/articles';
import { parseFeed } from './rss';

type UpsertedArticle = {
	id: number;
	title: string;
	excerpt: string | null;
	publishedAt: Date | string;
	urlHost: string;
	clickScore: number;
	inserted: boolean;
};

type AppliedCategory = {
	slug: string;
	name: string;
};

export async function ingestFeedById(feedId: number) {
	const [feed] = await db
		.select({
			id: sourceFeeds.id,
			feedUrl: sourceFeeds.feedUrl,
			categoryId: sourceFeeds.categoryId,
			sourceId: sources.id,
			sourceSlug: sources.slug,
			sourceName: sources.name,
			categorySlug: categories.slug
		})
		.from(sourceFeeds)
		.innerJoin(sources, eq(sources.id, sourceFeeds.sourceId))
		.leftJoin(categories, eq(categories.id, sourceFeeds.categoryId))
		.where(
			and(
				eq(sourceFeeds.id, feedId),
				eq(sourceFeeds.status, 'active'),
				eq(sources.approvalStatus, 'approved')
			)
		)
		.limit(1);

	if (!feed) throw new Error(`Active approved feed ${feedId} not found`);

	const response = await fetch(feed.feedUrl, {
		headers: { 'user-agent': 'hirek.hu ingestion bot (+https://hirek.hu)' }
	});
	if (!response.ok) throw new Error(`${feed.feedUrl} returned HTTP ${response.status}`);

	const xml = await response.text();
	const items = parseFeed(xml).slice(0, 80);
	const documents: ArticleSearchDocument[] = [];
	const liveArticles: LiveArticleEvent[] = [];

	for (const item of items) {
		const canonicalUrl = canonicalizeUrl(item.url, feed.feedUrl);
		if (!canonicalUrl) continue;

		const urlHost = new URL(canonicalUrl).host.replace(/^www\./, '');
		const [article] = await db
			.insert(articles)
			.values({
				sourceId: feed.sourceId,
				title: item.title,
				excerpt: item.excerpt,
				canonicalUrl,
				urlHost,
				publishedAt: item.publishedAt,
				active: true,
				updatedAt: sql`now()`
			})
			.onConflictDoUpdate({
				target: articles.canonicalUrl,
				set: {
					title: item.title,
					excerpt: item.excerpt,
					publishedAt: item.publishedAt,
					active: true,
					updatedAt: sql`now()`
				}
			})
			.returning({
				id: articles.id,
				title: articles.title,
				excerpt: articles.excerpt,
				publishedAt: articles.publishedAt,
				urlHost: articles.urlHost,
				clickScore: articles.clickScore,
				inserted: sql<boolean>`xmax = 0`
			});

		const appliedCategories = await applyArticleCategories(article, feed, canonicalUrl);
		const categorySlugs = appliedCategories.map((category) => category.slug);

		documents.push(toSearchDocument(article, {
			sourceName: feed.sourceName,
			sourceSlug: feed.sourceSlug,
			categorySlugs
		}));

		if (article.inserted) {
			liveArticles.push(toLiveArticle(article, {
				sourceName: feed.sourceName,
				sourceSlug: feed.sourceSlug,
				categories: appliedCategories
			}));
		}
	}

	await db
		.update(sourceFeeds)
		.set({ lastFetchedAt: sql`now()`, lastError: null, updatedAt: sql`now()` })
		.where(eq(sourceFeeds.id, feed.id));

	await configureArticleIndex();
	await indexArticles(documents);
	await publishLiveArticles(liveArticles);

	return {
		feedId: feed.id,
		source: feed.sourceName,
		parsed: items.length,
		upserted: documents.length,
		inserted: liveArticles.length
	};
}

async function applyArticleCategories(
	article: UpsertedArticle,
	feed: { sourceId: number; categorySlug: string | null },
	canonicalUrl: string
) {
	const overrideRows = await db
		.select({ id: categories.id, slug: categories.slug })
		.from(articleCategoryOverrides)
		.innerJoin(categories, eq(categories.id, articleCategoryOverrides.categoryId))
		.where(eq(articleCategoryOverrides.articleId, article.id))
		.limit(1);

	const inferredSlugs =
		overrideRows.length > 0
			? overrideRows.map((category) => category.slug)
			: await inferSlugsForArticle(article, feed, canonicalUrl);

	const categoryRows = await db
		.select({ id: categories.id, slug: categories.slug, name: categories.name })
		.from(categories)
		.where(inArray(categories.slug, inferredSlugs));

	await db.delete(articleCategories).where(eq(articleCategories.articleId, article.id));

	if (categoryRows.length > 0) {
		await db.insert(articleCategories).values(
			categoryRows.map((category) => ({
				articleId: article.id,
				categoryId: category.id
			}))
		);
	}

	return categoryRows.map((category) => ({ slug: category.slug, name: category.name }));
}

async function inferSlugsForArticle(
	article: UpsertedArticle,
	feed: { sourceId: number; categorySlug: string | null },
	canonicalUrl: string
) {
	const urlRuleSlugs = await getCategorySlugsForUrl(feed.sourceId, canonicalUrl);
	if (urlRuleSlugs.length > 0) return urlRuleSlugs;

	return inferCategorySlugs({
		title: article.title,
		excerpt: article.excerpt,
		url: canonicalUrl,
		fallbackSlug: feed.categorySlug
	});
}

function toSearchDocument(
	article: UpsertedArticle,
	source: { sourceName: string; sourceSlug: string; categorySlugs: string[] }
): ArticleSearchDocument {
	return {
		id: article.id,
		title: article.title,
		excerpt: article.excerpt,
		sourceName: source.sourceName,
		sourceSlug: source.sourceSlug,
		categorySlugs: source.categorySlugs,
		publishedAt: toIsoString(article.publishedAt),
		urlHost: article.urlHost,
		clickScore: article.clickScore
	};
}

function toLiveArticle(
	article: UpsertedArticle,
	source: { sourceName: string; sourceSlug: string; categories: AppliedCategory[] }
): LiveArticleEvent {
	const primaryCategory = source.categories.at(0);

	return {
		id: article.id,
		title: article.title,
		excerpt: article.excerpt,
		category: primaryCategory?.slug ?? 'uncategorized',
		categoryName: primaryCategory?.name ?? 'Egyéb',
		categorySlugs: source.categories.map((category) => category.slug),
		source: source.sourceSlug,
		sourceName: source.sourceName,
		publishedAt: toIsoString(article.publishedAt),
		clicks: article.clickScore
	};
}

function canonicalizeUrl(value: string, baseUrl: string) {
	try {
		const url = new URL(value, baseUrl);
		for (const key of [...url.searchParams.keys()]) {
			if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key);
		}
		url.hash = '';
		return url.toString();
	} catch {
		return null;
	}
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

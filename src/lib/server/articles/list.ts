import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	articleCategories,
	articles,
	categories,
	clickEvents,
	sourceFeeds,
	sources
} from '$lib/server/db/schema';
import type { Article } from '$lib/home/data';

export type ArticleListFilters = {
	category?: string;
	source?: string;
	order?: 'fresh' | 'top';
	limit?: number;
};

export async function getArticleList(filters: ArticleListFilters = {}) {
	const conditions = [eq(articles.active, true)];
	if (filters.source) conditions.push(eq(sources.slug, filters.source));
	if (filters.category) {
		conditions.push(
			inArray(
				articles.id,
				db
					.select({ articleId: articleCategories.articleId })
					.from(articleCategories)
					.innerJoin(categories, eq(categories.id, articleCategories.categoryId))
					.where(eq(categories.slug, filters.category))
			)
		);
	}

	const limit = Math.min(Math.max(filters.limit ?? 80, 1), 100);
	const rows = await db
		.select({
			id: articles.id,
			title: articles.title,
			sourceSlug: sources.slug,
			sourceName: sources.name,
			categorySlug: sql<string | null>`(array_remove(array_agg(DISTINCT ${categories.slug}), NULL))[1]`,
			categoryName: sql<string | null>`(array_remove(array_agg(DISTINCT ${categories.name}), NULL))[1]`,
			categorySlugs: sql<string[]>`array_remove(array_agg(DISTINCT ${categories.slug}), NULL)`,
			publishedAt: articles.publishedAt,
			clickScore: articles.clickScore
		})
		.from(articles)
		.innerJoin(sources, eq(sources.id, articles.sourceId))
		.leftJoin(articleCategories, eq(articleCategories.articleId, articles.id))
		.leftJoin(categories, eq(categories.id, articleCategories.categoryId))
		.where(and(...conditions))
		.groupBy(
			articles.id,
			articles.title,
			articles.publishedAt,
			articles.clickScore,
			sources.id,
			sources.slug,
			sources.name
		)
		.orderBy(
			...(filters.order === 'top'
				? [desc(articles.clickScore), desc(articles.publishedAt)]
				: [desc(articles.publishedAt), desc(articles.clickScore)])
		)
		.limit(limit);

	return rows.map(toArticle);
}

export async function getCategoryBySlug(slug: string) {
	const [row] = await db
		.select({ slug: categories.slug, name: categories.name })
		.from(categories)
		.where(eq(categories.slug, slug))
		.limit(1);

	return row ?? null;
}

export async function getSourceBySlug(slug: string) {
	const [source] = await db
		.select({
			id: sources.id,
			slug: sources.slug,
			name: sources.name,
			domain: sources.domain,
			status: sources.status,
			lastFetchedAt: sql<Date | string | null>`max(${sourceFeeds.lastFetchedAt})`,
			articleCount: sql<number>`(
				SELECT count(*)::int
				FROM ${articles}
				WHERE ${articles.sourceId} = ${sources.id}
					AND ${articles.active} = true
			)`,
			clickCount: sql<number>`(
				SELECT count(*)::int
				FROM ${clickEvents}
				WHERE ${clickEvents.sourceId} = ${sources.id}
			)`
		})
		.from(sources)
		.leftJoin(sourceFeeds, eq(sourceFeeds.sourceId, sources.id))
		.where(and(eq(sources.slug, slug), ne(sources.status, 'disabled')))
		.groupBy(sources.id, sources.slug, sources.name, sources.domain, sources.status)
		.limit(1);

	if (!source) return null;

	return {
		id: source.id,
		slug: source.slug,
		name: source.name,
		domain: source.domain,
		status: source.status,
		lastFetchedAt: source.lastFetchedAt ? toIsoString(source.lastFetchedAt) : null,
		articleCount: Number(source.articleCount),
		clickCount: Number(source.clickCount)
	};
}

function toArticle(row: {
	id: number;
	title: string;
	sourceSlug: string;
	sourceName: string;
	categorySlug: string | null;
	categoryName: string | null;
	categorySlugs: string[] | null;
	publishedAt: Date | string;
	clickScore: number;
}): Article {
	return {
		id: row.id,
		title: row.title,
		category: row.categorySlug ?? 'uncategorized',
		categoryName: row.categoryName ?? 'Egyéb',
		categorySlugs: row.categorySlugs ?? [],
		source: row.sourceSlug,
		sourceName: row.sourceName,
		publishedAt: toIsoString(row.publishedAt),
		clicks: row.clickScore
	};
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

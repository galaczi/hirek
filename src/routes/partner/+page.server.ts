import { and, count, desc, eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { requirePartnerAccess } from '$lib/server/admin/auth';
import { db } from '$lib/server/db';
import {
	articleCategories,
	articleCategoryOverrides,
	articles,
	categories,
	clickEvents,
	sourceCategoryRules,
	sources
} from '$lib/server/db/schema';
import { getArticleSearchDocuments } from '$lib/server/articles/search-documents';
import { indexArticles } from '$lib/server/search/meili';
import { upsertSourceCategoryRule } from '$lib/server/categorization/url-rules';

export const load: PageServerLoad = async (event) => {
	const access = requirePartnerAccess(event);
	const scopedSourceId = access.sourceId;
	const sourceFilter = scopedSourceId ? eq(sources.id, scopedSourceId) : undefined;
	const articleFilter = scopedSourceId ? eq(articles.sourceId, scopedSourceId) : undefined;
	const clickFilter = scopedSourceId ? eq(clickEvents.sourceId, scopedSourceId) : undefined;

	const [sourceStats, topArticles, recentClicks, categoryRows, ruleRows] = await Promise.all([
		db
			.select({
				sourceId: sources.id,
				sourceName: sources.name,
				sourceDomain: sources.domain,
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
			.where(sourceFilter)
			.orderBy(sources.name),
		db
			.select({
				id: articles.id,
				title: articles.title,
				sourceName: sources.name,
				clickScore: articles.clickScore,
				publishedAt: articles.publishedAt,
				clickCount: count(clickEvents.id)
			})
			.from(articles)
			.innerJoin(sources, eq(sources.id, articles.sourceId))
			.leftJoin(clickEvents, eq(clickEvents.articleId, articles.id))
			.where(articleFilter ? and(eq(articles.active, true), articleFilter) : eq(articles.active, true))
			.groupBy(articles.id, sources.id)
			.orderBy(desc(count(clickEvents.id)), desc(articles.clickScore), desc(articles.publishedAt))
			.limit(20),
		db
			.select({
				id: clickEvents.id,
				sourceName: sources.name,
				articleTitle: articles.title,
				referrer: clickEvents.referrer,
				createdAt: clickEvents.createdAt
			})
			.from(clickEvents)
			.innerJoin(sources, eq(sources.id, clickEvents.sourceId))
			.innerJoin(articles, eq(articles.id, clickEvents.articleId))
			.where(clickFilter)
			.orderBy(desc(clickEvents.createdAt))
			.limit(30),
		db.select({ slug: categories.slug, name: categories.name }).from(categories).orderBy(categories.name),
		scopedSourceId
			? db
					.select({
						id: sourceCategoryRules.id,
						urlPattern: sourceCategoryRules.urlPattern,
						categoryName: categories.name
					})
					.from(sourceCategoryRules)
					.innerJoin(categories, eq(categories.id, sourceCategoryRules.categoryId))
					.where(eq(sourceCategoryRules.sourceId, scopedSourceId))
					.orderBy(sourceCategoryRules.urlPattern)
			: Promise.resolve([])
	]);

	return {
		sourceStats,
		topArticles: topArticles.map((row) => ({
			id: row.id,
			title: row.title,
			sourceName: row.sourceName,
			clickScore: row.clickScore,
			clickCount: Number(row.clickCount),
			publishedAt: toIsoString(row.publishedAt)
		})),
		recentClicks: recentClicks.map((row) => ({
			id: row.id,
			sourceName: row.sourceName,
			articleTitle: row.articleTitle,
			referrer: row.referrer,
			createdAt: toIsoString(row.createdAt)
		})),
		categories: categoryRows,
		partnerSourceId: scopedSourceId,
		isAdmin: access.isAdmin,
		sourceRules: ruleRows
	};
};

export const actions: Actions = {
	overrideCategory: async (event) => {
		const access = requirePartnerAccess(event);
		const form = await event.request.formData();
		const articleId = Number(form.get('articleId'));
		const categorySlug = String(form.get('categorySlug') ?? '');

		if (!Number.isInteger(articleId) || !categorySlug) {
			return { ok: false, action: 'overrideCategory', error: 'Invalid category override.' };
		}

		const [article] = await db
			.select({ id: articles.id, sourceId: articles.sourceId })
			.from(articles)
			.where(eq(articles.id, articleId))
			.limit(1);
		const [category] = await db
			.select({ id: categories.id })
			.from(categories)
			.where(eq(categories.slug, categorySlug))
			.limit(1);

		if (!article || !category) {
			return { ok: false, action: 'overrideCategory', error: 'Article or category not found.' };
		}
		if (!access.isAdmin && article.sourceId !== access.sourceId) {
			return { ok: false, action: 'overrideCategory', error: 'This article belongs to another source.' };
		}

		await db
			.insert(articleCategoryOverrides)
			.values({
				articleId: article.id,
				sourceId: article.sourceId,
				categoryId: category.id,
				updatedAt: sql`now()`
			})
			.onConflictDoUpdate({
				target: articleCategoryOverrides.articleId,
				set: { categoryId: category.id, updatedAt: sql`now()` }
			});

		await db.delete(articleCategories).where(eq(articleCategories.articleId, article.id));
		await db.insert(articleCategories).values({ articleId: article.id, categoryId: category.id });
		await indexArticles(await getArticleSearchDocuments([article.id]));

		return { ok: true, action: 'overrideCategory', articleId: article.id, categorySlug };
	},
	addUrlRule: async (event) => {
		const { sourceId } = requirePartnerAccess(event);
		const form = await event.request.formData();
		const categorySlug = String(form.get('categorySlug') ?? '');
		const urlPattern = String(form.get('urlPattern') ?? '');

		if (!sourceId || !categorySlug || !urlPattern.trim()) {
			return { ok: false, action: 'addUrlRule', error: 'Source, category and URL pattern are required.' };
		}

		const [category] = await db
			.select({ id: categories.id })
			.from(categories)
			.where(eq(categories.slug, categorySlug))
			.limit(1);

		if (!category) return { ok: false, action: 'addUrlRule', error: 'Category not found.' };

		await upsertSourceCategoryRule({ sourceId, categoryId: category.id, urlPattern });
		return { ok: true, action: 'addUrlRule' };
	},
	deleteUrlRule: async (event) => {
		const { sourceId } = requirePartnerAccess(event);
		const form = await event.request.formData();
		const ruleId = Number(form.get('ruleId'));

		if (!sourceId || !Number.isInteger(ruleId)) {
			return { ok: false, action: 'deleteUrlRule', error: 'Invalid rule.' };
		}

		await db
			.delete(sourceCategoryRules)
			.where(and(eq(sourceCategoryRules.id, ruleId), eq(sourceCategoryRules.sourceId, sourceId)));

		return { ok: true, action: 'deleteUrlRule' };
	}
};

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

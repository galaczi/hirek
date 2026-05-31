import { and, eq, ne, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { articles, clickEvents, sourceFeeds, sources, categories } from '$lib/server/db/schema';
import { getMarketplaceArticles } from '$lib/server/articles/marketplace';
import { retentionCutoff } from '$lib/server/articles/stats';

export type ArticleListFilters = {
	category?: string;
	source?: string;
	order?: 'fresh' | 'top';
	limit?: number;
};

export async function getArticleList(filters: ArticleListFilters = {}) {
	return getMarketplaceArticles({
		surface: filters.order === 'top' ? 'top' : 'home',
		category: filters.category,
		source: filters.source,
		limit: filters.limit
	});
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
					AND ${articles.publishedAt} >= ${retentionCutoff().toISOString()}::timestamptz
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

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

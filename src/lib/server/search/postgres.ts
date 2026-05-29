import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { articleCategories, articles, categories, sources } from '$lib/server/db/schema';
import type { SearchFilters, SearchResponse, SearchResult } from './types';

export async function searchWithPostgres(filters: SearchFilters): Promise<SearchResponse> {
	const q = filters.q.trim();
	const where: SQL[] = [eq(articles.active, true)];

	if (filters.source) where.push(eq(sources.slug, filters.source));
	if (filters.category) where.push(eq(categories.slug, filters.category));

	const since = getTimeBoundary(filters.time);
	if (since) where.push(sql`${articles.publishedAt} >= ${since.toISOString()}::timestamptz`);

	if (q) {
		where.push(sql`(
			to_tsvector('simple', ${articles.title} || ' ' || coalesce(${articles.excerpt}, '')) @@ websearch_to_tsquery('simple', ${q})
			OR ${articles.title} % ${q}
			OR coalesce(${articles.excerpt}, '') % ${q}
			OR ${sources.name} % ${q}
		)`);
	}

	const rankScoreExpr = q
		? sql<number>`(
			ts_rank_cd(
				to_tsvector('simple', ${articles.title} || ' ' || coalesce(${articles.excerpt}, '')),
				websearch_to_tsquery('simple', ${q})
			) + greatest(similarity(${articles.title}, ${q}), similarity(coalesce(${articles.excerpt}, ''), ${q})) * 0.2
		)`
		: sql<number>`0`;
	const rows = await db
		.select({
			id: articles.id,
			title: articles.title,
			excerpt: articles.excerpt,
			sourceName: sources.name,
			sourceSlug: sources.slug,
			categorySlugs: sql<string[]>`array_remove(array_agg(DISTINCT ${categories.slug}), NULL)`,
			publishedAt: articles.publishedAt,
			urlHost: articles.urlHost,
			clickScore: articles.clickScore,
			totalCount: sql<number>`count(*) OVER()::int`
		})
		.from(articles)
		.innerJoin(sources, eq(sources.id, articles.sourceId))
		.leftJoin(articleCategories, eq(articleCategories.articleId, articles.id))
		.leftJoin(categories, eq(categories.id, articleCategories.categoryId))
		.where(and(...where))
		.groupBy(
			articles.id,
			articles.title,
			articles.excerpt,
			articles.publishedAt,
			articles.urlHost,
			articles.clickScore,
			sources.id,
			sources.name,
			sources.slug
		)
		.orderBy(desc(rankScoreExpr), desc(articles.publishedAt), desc(articles.clickScore))
		.limit(filters.limit)
		.offset(filters.offset);

	const results = rows.map<SearchResult>((row) => ({
		id: row.id,
		title: row.title,
		excerpt: row.excerpt,
		sourceName: row.sourceName,
		sourceSlug: row.sourceSlug,
		categorySlugs: row.categorySlugs ?? [],
		publishedAt: toIsoString(row.publishedAt),
		urlHost: row.urlHost,
		clickScore: row.clickScore
	}));

	return {
		results,
		total: Number(rows.at(0)?.totalCount ?? 0),
		engine: 'postgres'
	};
}

function getTimeBoundary(time: SearchFilters['time']) {
	if (!time) return null;

	const hours = {
		'4h': 4,
		'12h': 12,
		'24h': 24,
		'7d': 24 * 7
	}[time];

	return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

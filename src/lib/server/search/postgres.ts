import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import type { SearchFilters, SearchResponse, SearchResult } from './types';

type SearchRow = {
	id: number;
	title: string;
	excerpt: string | null;
	source_name: string;
	source_slug: string;
	category_slugs: string[];
	published_at: Date | string;
	url_host: string;
	click_score: number;
	total_count: string | number;
};

export async function searchWithPostgres(filters: SearchFilters): Promise<SearchResponse> {
	const q = filters.q.trim();
	const where = [sql`a.active = true`];

	if (filters.source) where.push(sql`s.slug = ${filters.source}`);
	if (filters.category) where.push(sql`c.slug = ${filters.category}`);

	const since = getTimeBoundary(filters.time);
	if (since) where.push(sql`a.published_at >= ${since.toISOString()}::timestamptz`);

	if (q) {
		where.push(sql`(
			to_tsvector('simple', a.title || ' ' || coalesce(a.excerpt, '')) @@ websearch_to_tsquery('simple', ${q})
			OR a.title % ${q}
			OR coalesce(a.excerpt, '') % ${q}
			OR s.name % ${q}
		)`);
	}

	const rows = await db.execute<SearchRow>(sql`
		WITH matched_articles AS (
			SELECT
				a.id,
				a.title,
				a.excerpt,
				s.name AS source_name,
				s.slug AS source_slug,
				array_remove(array_agg(DISTINCT c.slug), NULL) AS category_slugs,
				a.published_at,
				a.url_host,
				a.click_score,
				${
					q
						? sql`(
							ts_rank_cd(
								to_tsvector('simple', a.title || ' ' || coalesce(a.excerpt, '')),
								websearch_to_tsquery('simple', ${q})
							) + greatest(similarity(a.title, ${q}), similarity(coalesce(a.excerpt, ''), ${q})) * 0.2
						)`
						: sql`0`
				} AS rank_score
			FROM articles a
			INNER JOIN sources s ON s.id = a.source_id
			LEFT JOIN article_categories ac ON ac.article_id = a.id
			LEFT JOIN categories c ON c.id = ac.category_id
			WHERE ${sql.join(where, sql` AND `)}
			GROUP BY a.id, s.id
		)
		SELECT *, count(*) OVER() AS total_count
		FROM matched_articles
		ORDER BY rank_score DESC, published_at DESC, click_score DESC
		LIMIT ${filters.limit}
		OFFSET ${filters.offset}
	`);

	const results = rows.map<SearchResult>((row) => ({
		id: row.id,
		title: row.title,
		excerpt: row.excerpt,
		sourceName: row.source_name,
		sourceSlug: row.source_slug,
		categorySlugs: row.category_slugs ?? [],
		publishedAt: toIsoString(row.published_at),
		urlHost: row.url_host,
		clickScore: row.click_score
	}));

	return {
		results,
		total: Number(rows.at(0)?.total_count ?? 0),
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

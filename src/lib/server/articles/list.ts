import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import type { Article } from '$lib/home/data';

type ArticleRow = {
	id: number;
	title: string;
	source_slug: string;
	source_name: string;
	category_slug: string | null;
	category_name: string | null;
	category_slugs: string[];
	published_at: Date | string;
	click_score: number;
};

export type ArticleListFilters = {
	category?: string;
	source?: string;
	order?: 'fresh' | 'top';
	limit?: number;
};

export async function getArticleList(filters: ArticleListFilters = {}) {
	const where = [sql`a.active = true`];
	if (filters.source) where.push(sql`s.slug = ${filters.source}`);
	if (filters.category) {
		where.push(sql`EXISTS (
			SELECT 1
			FROM article_categories ac_filter
			INNER JOIN categories c_filter ON c_filter.id = ac_filter.category_id
			WHERE ac_filter.article_id = a.id
				AND c_filter.slug = ${filters.category}
		)`);
	}

	const order =
		filters.order === 'top'
			? sql`a.click_score DESC, a.published_at DESC`
			: sql`a.published_at DESC, a.click_score DESC`;
	const limit = Math.min(Math.max(filters.limit ?? 80, 1), 100);

	const rows = await db.execute<ArticleRow>(sql`
		SELECT
			a.id,
			a.title,
			s.slug AS source_slug,
			s.name AS source_name,
			(array_remove(array_agg(DISTINCT c.slug), NULL))[1] AS category_slug,
			(array_remove(array_agg(DISTINCT c.name), NULL))[1] AS category_name,
			array_remove(array_agg(DISTINCT c.slug), NULL) AS category_slugs,
			a.published_at,
			a.click_score
		FROM articles a
		INNER JOIN sources s ON s.id = a.source_id
		LEFT JOIN article_categories ac ON ac.article_id = a.id
		LEFT JOIN categories c ON c.id = ac.category_id
		WHERE ${sql.join(where, sql` AND `)}
		GROUP BY a.id, s.id
		ORDER BY ${order}
		LIMIT ${limit}
	`);

	return rows.map(toArticle);
}

export async function getCategoryBySlug(slug: string) {
	const rows = await db.execute<{ slug: string; name: string }>(sql`
		SELECT slug, name
		FROM categories
		WHERE slug = ${slug}
		LIMIT 1
	`);

	return rows[0] ?? null;
}

export async function getSourceBySlug(slug: string) {
	const rows = await db.execute<{
		id: number;
		slug: string;
		name: string;
		domain: string;
		status: string;
		last_fetched_at: Date | string | null;
		article_count: string | number;
		click_count: string | number;
	}>(sql`
		SELECT
			s.id,
			s.slug,
			s.name,
			s.domain,
			s.status,
			max(sf.last_fetched_at) AS last_fetched_at,
			(SELECT count(*) FROM articles a WHERE a.source_id = s.id AND a.active = true) AS article_count,
			(SELECT count(*) FROM click_events ce WHERE ce.source_id = s.id) AS click_count
		FROM sources s
		LEFT JOIN source_feeds sf ON sf.source_id = s.id
		WHERE s.slug = ${slug}
			AND s.status != 'disabled'
		GROUP BY s.id
		LIMIT 1
	`);

	const source = rows[0];
	if (!source) return null;

	return {
		id: source.id,
		slug: source.slug,
		name: source.name,
		domain: source.domain,
		status: source.status,
		lastFetchedAt: source.last_fetched_at ? toIsoString(source.last_fetched_at) : null,
		articleCount: Number(source.article_count),
		clickCount: Number(source.click_count)
	};
}

function toArticle(row: ArticleRow): Article {
	return {
		id: row.id,
		title: row.title,
		category: row.category_slug ?? 'uncategorized',
		categoryName: row.category_name ?? 'Egyéb',
		categorySlugs: row.category_slugs ?? [],
		source: row.source_slug,
		sourceName: row.source_name,
		publishedAt: toIsoString(row.published_at),
		clicks: row.click_score
	};
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

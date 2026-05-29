import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import type { ArticleSearchDocument } from '$lib/server/search/types';

type ArticleDocumentRow = {
	id: number;
	title: string;
	excerpt: string | null;
	source_name: string;
	source_slug: string;
	category_slugs: string[];
	published_at: Date | string;
	url_host: string;
	click_score: number;
};

export async function getArticleSearchDocuments(articleIds: number[]) {
	if (articleIds.length === 0) return [];

	const rows = await db.execute<ArticleDocumentRow>(sql`
		SELECT
			a.id,
			a.title,
			a.excerpt,
			s.name AS source_name,
			s.slug AS source_slug,
			array_remove(array_agg(DISTINCT c.slug), NULL) AS category_slugs,
			a.published_at,
			a.url_host,
			a.click_score
		FROM articles a
		INNER JOIN sources s ON s.id = a.source_id
		LEFT JOIN article_categories ac ON ac.article_id = a.id
		LEFT JOIN categories c ON c.id = ac.category_id
		WHERE a.id = ANY(${articleIds})
			AND a.active = true
		GROUP BY a.id, s.id
	`);

	return rows.map<ArticleSearchDocument>((row) => ({
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
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

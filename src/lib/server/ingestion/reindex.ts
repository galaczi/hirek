import { desc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { articleCategories, articles, categories, sources } from '$lib/server/db/schema';
import { configureArticleIndex, indexArticles } from '$lib/server/search/meili';
import type { ArticleSearchDocument } from '$lib/server/search/types';

export async function reindexArticles() {
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
			clickScore: articles.clickScore
		})
		.from(articles)
		.innerJoin(sources, eq(sources.id, articles.sourceId))
		.leftJoin(articleCategories, eq(articleCategories.articleId, articles.id))
		.leftJoin(categories, eq(categories.id, articleCategories.categoryId))
		.where(eq(articles.active, true))
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
		.orderBy(desc(articles.publishedAt));

	const documents: ArticleSearchDocument[] = rows.map((row) => ({
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

	await configureArticleIndex();
	await indexArticles(documents);

	return { indexed: documents.length };
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

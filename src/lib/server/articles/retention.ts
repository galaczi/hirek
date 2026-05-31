import { lt, sql } from 'drizzle-orm';
import { deleteArticlesFromIndex } from '$lib/server/search/meili';
import { db } from '$lib/server/db';
import { articles, clickEvents, sourceSurfaceRollingStats } from '$lib/server/db/schema';
import { retentionCutoff } from './stats';

export async function pruneExpiredArticleInventory() {
	const cutoff = retentionCutoff();
	const expiredArticles = await db
		.select({ id: articles.id })
		.from(articles)
		.where(lt(articles.publishedAt, cutoff));
	const expiredArticleIds = expiredArticles.map((article) => article.id);

	await db.delete(clickEvents).where(lt(clickEvents.createdAt, cutoff));
	await db.delete(sourceSurfaceRollingStats).where(sql`${sourceSurfaceRollingStats.day} < current_date - 90`);
	await db.delete(articles).where(lt(articles.publishedAt, cutoff));

	if (expiredArticleIds.length > 0) {
		try {
			await deleteArticlesFromIndex(expiredArticleIds);
		} catch (error) {
			console.error('Failed to prune expired articles from search index:', error);
		}
	}

	return {
		deletedArticles: expiredArticleIds.length
	};
}

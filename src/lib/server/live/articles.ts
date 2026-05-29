import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import type { Article } from '$lib/home/data';

const CHANNEL = 'hirek_live_articles';

export type LiveArticleEvent = Article;

export async function publishLiveArticles(articles: LiveArticleEvent[]) {
	if (articles.length === 0) return;

	for (const article of articles) {
		await db.execute(sql`SELECT pg_notify(${CHANNEL}, ${JSON.stringify(article)})`);
	}
}

export async function createLiveArticleListener(onArticle: (article: LiveArticleEvent) => void) {
	if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

	const client = postgres(env.DATABASE_URL, { max: 1 });
	await client.listen(CHANNEL, (payload) => {
		try {
			onArticle(JSON.parse(payload) as LiveArticleEvent);
		} catch {
			// Ignore malformed notifications; they should never be emitted by this app.
		}
	});

	return {
		close: () => client.end()
	};
}

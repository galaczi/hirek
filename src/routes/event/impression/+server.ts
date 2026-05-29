import { error, json, type RequestHandler } from '@sveltejs/kit';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { classifyRequest } from '$lib/server/articles/click-tracking';
import { db } from '$lib/server/db';
import { articleCategories, articles, impressionEvents } from '$lib/server/db/schema';
import { normalizeImpressionPayload } from '$lib/server/validation/input';

type ImpressionPayload = {
	articleIds?: unknown;
	pagePath?: unknown;
};

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const payload = (await request.json().catch(() => null)) as ImpressionPayload | null;
	const normalized = normalizeImpressionPayload({
		articleIds: payload?.articleIds,
		pagePath: payload?.pagePath,
		referrer: request.headers.get('referer'),
		userAgent: request.headers.get('user-agent')
	});
	if (!normalized.ok) error(400, 'No article ids provided.');
	const { articleIds, pagePath, referrer, userAgent } = normalized.data;
	const rows = await db
		.select({
			id: articles.id,
			sourceId: articles.sourceId,
			categoryId: sql<number | null>`(array_remove(array_agg(${articleCategories.categoryId}), NULL))[1]`
		})
		.from(articles)
		.leftJoin(articleCategories, eq(articleCategories.articleId, articles.id))
		.where(and(eq(articles.active, true), inArray(articles.id, articleIds)))
		.groupBy(articles.id, articles.sourceId);

	if (rows.length === 0) return json({ ok: true, inserted: 0 });

	const traffic = classifyRequest({
		ipAddress: getClientAddress(),
		userAgent
	});

	await db.insert(impressionEvents).values(
		rows.map((row) => ({
			articleId: row.id,
			sourceId: row.sourceId,
			categoryId: row.categoryId,
			pagePath,
			referrer,
			userAgent,
			ipHash: traffic.ipHash,
			isBot: traffic.isBot,
			botName: traffic.botName
		}))
	);

	return json({ ok: true, inserted: rows.length });
};

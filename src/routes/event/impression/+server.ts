import { error, json, type RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { classifyRequest } from '$lib/server/articles/click-tracking';
import { db } from '$lib/server/db';
import { impressionEvents } from '$lib/server/db/schema';
import { normalizeImpressionPayload } from '$lib/server/validation/input';

type ImpressionPayload = {
	articleIds?: unknown;
	pagePath?: unknown;
};

type ImpressionArticleRow = {
	id: number;
	source_id: number;
	category_id: number | null;
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
	const articleIdSql = sql.join(
		articleIds.map((id) => sql`${id}`),
		sql`, `
	);

	const rows = await db.execute<ImpressionArticleRow>(sql`
		SELECT
			a.id,
			a.source_id,
			(array_remove(array_agg(ac.category_id), NULL))[1] AS category_id
		FROM articles a
		LEFT JOIN article_categories ac ON ac.article_id = a.id
		WHERE a.active = true
			AND a.id IN (${articleIdSql})
		GROUP BY a.id
	`);

	if (rows.length === 0) return json({ ok: true, inserted: 0 });

	const traffic = classifyRequest({
		ipAddress: getClientAddress(),
		userAgent
	});

	await db.insert(impressionEvents).values(
		rows.map((row) => ({
			articleId: row.id,
			sourceId: row.source_id,
			categoryId: row.category_id,
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

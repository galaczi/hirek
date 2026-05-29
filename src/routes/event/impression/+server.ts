import { error, json, type RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { classifyRequest } from '$lib/server/articles/click-tracking';
import { db } from '$lib/server/db';
import { impressionEvents } from '$lib/server/db/schema';

type ImpressionPayload = {
	articleIds?: unknown;
	pagePath?: unknown;
};

type ImpressionArticleRow = {
	id: number;
	source_id: number;
	category_id: number | null;
};

const MAX_BATCH_SIZE = 100;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const payload = (await request.json().catch(() => null)) as ImpressionPayload | null;
	const articleIds = normalizeArticleIds(payload?.articleIds);
	if (articleIds.length === 0) error(400, 'No article ids provided.');
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
		userAgent: request.headers.get('user-agent')
	});
	const pagePath = normalizePagePath(payload?.pagePath);

	await db.insert(impressionEvents).values(
		rows.map((row) => ({
			articleId: row.id,
			sourceId: row.source_id,
			categoryId: row.category_id,
			pagePath,
			referrer: request.headers.get('referer'),
			userAgent: request.headers.get('user-agent'),
			ipHash: traffic.ipHash,
			isBot: traffic.isBot,
			botName: traffic.botName
		}))
	);

	return json({ ok: true, inserted: rows.length });
};

function normalizeArticleIds(value: unknown) {
	if (!Array.isArray(value)) return [];
	const ids = value
		.map((item) => Number(item))
		.filter((id) => Number.isInteger(id) && id > 0)
		.slice(0, MAX_BATCH_SIZE);
	return Array.from(new Set(ids));
}

function normalizePagePath(value: unknown) {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed || trimmed.length > 500) return null;
	return trimmed;
}

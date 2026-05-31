import { error, json, type RequestHandler } from '@sveltejs/kit';
import { and, eq, gte, inArray } from 'drizzle-orm';
import { classifyRequest } from '$lib/server/articles/click-tracking';
import { incrementSourceSurfaceStats, retentionCutoff } from '$lib/server/articles/stats';
import { db } from '$lib/server/db';
import { articles } from '$lib/server/db/schema';
import { classifyPublicSurface } from '$lib/source-acquisition';
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
	const { articleIds, pagePath, userAgent } = normalized.data;
	const surface = classifyPublicSurface(pagePath ?? '/');
	const traffic = classifyRequest({
		ipAddress: getClientAddress(),
		userAgent
	});
	if (traffic.isBot) return json({ ok: true, inserted: 0 });

	const rows = await db
		.select({
			id: articles.id,
			sourceId: articles.sourceId
		})
		.from(articles)
		.where(
			and(
				eq(articles.active, true),
				gte(articles.publishedAt, retentionCutoff()),
				inArray(articles.id, articleIds)
			)
		);

	if (rows.length === 0) return json({ ok: true, inserted: 0 });

	const counts = new Map<number, number>();
	for (const row of rows) counts.set(row.sourceId, (counts.get(row.sourceId) ?? 0) + 1);
	await incrementSourceSurfaceStats(
		Array.from(counts, ([sourceId, impressions]) => ({ sourceId, surface, impressions }))
	);

	return json({ ok: true, inserted: rows.length });
};

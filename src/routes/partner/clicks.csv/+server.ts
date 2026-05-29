import { desc, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { requirePartnerAccess } from '$lib/server/admin/auth';
import { db } from '$lib/server/db';
import { articles, categories, clickEvents, sources } from '$lib/server/db/schema';

export const GET: RequestHandler = async (event) => {
	const access = requirePartnerAccess(event);
	const where = access.sourceId ? eq(clickEvents.sourceId, access.sourceId) : undefined;

	const rows = await db
		.select({
			clickedAt: clickEvents.createdAt,
			sourceName: sources.name,
			articleId: articles.id,
			articleTitle: articles.title,
			categoryName: categories.name,
			referrer: clickEvents.referrer,
			utmCampaign: clickEvents.utmCampaign,
			utmContent: clickEvents.utmContent,
			isBot: clickEvents.isBot,
			botName: clickEvents.botName,
			isUnique: clickEvents.isUnique
		})
		.from(clickEvents)
		.innerJoin(sources, eq(sources.id, clickEvents.sourceId))
		.innerJoin(articles, eq(articles.id, clickEvents.articleId))
		.leftJoin(categories, eq(categories.id, clickEvents.categoryId))
		.where(where)
		.orderBy(desc(clickEvents.createdAt))
		.limit(5000);

	const csv = [
		[
			'clicked_at',
			'source',
			'article_id',
			'article_title',
			'category',
			'referrer',
			'utm_campaign',
			'utm_content',
			'is_bot',
			'bot_name',
			'is_unique'
		],
		...rows.map((row) => [
			toIsoString(row.clickedAt),
			row.sourceName,
			String(row.articleId),
			row.articleTitle,
			row.categoryName ?? '',
			row.referrer ?? '',
			row.utmCampaign,
			row.utmContent ?? '',
			String(row.isBot),
			row.botName ?? '',
			String(row.isUnique)
		])
	]
		.map((row) => row.map(csvCell).join(','))
		.join('\n');

	return new Response(`${csv}\n`, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': 'attachment; filename="hirek-clicks.csv"'
		}
	});
};

function csvCell(value: string) {
	return `"${value.replaceAll('"', '""')}"`;
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

import { and, desc, eq, gte } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePartnerAccess } from '$lib/server/admin/auth';
import { db } from '$lib/server/db';
import { articles, categories, clickEvents, sources } from '$lib/server/db/schema';
import { requireApprovedSourceForConfig } from '$lib/server/sources/approval';

const REPORT_RANGES = [7, 30, 90];

export const GET: RequestHandler = async (event) => {
	const access = requirePartnerAccess(event);
	const reportDays = parseReportDays(event.url);
	const reportSince = getReportSince(reportDays);

	if (!access.sourceId) {
		error(400, 'Admin exporthoz válassz partnerforrást.');
	}
	await requireApprovedSourceForConfig(access.sourceId);

	const where = and(eq(clickEvents.sourceId, access.sourceId), gte(clickEvents.createdAt, reportSince));

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

function parseReportDays(url: URL) {
	const requested = Number(url.searchParams.get('range') ?? '30');
	return REPORT_RANGES.includes(requested) ? requested : 30;
}

function getReportSince(days: number) {
	const since = new Date();
	since.setHours(0, 0, 0, 0);
	since.setDate(since.getDate() - (days - 1));
	return since;
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

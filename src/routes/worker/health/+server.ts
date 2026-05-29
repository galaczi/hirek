import { json, type RequestHandler } from '@sveltejs/kit';
import { asc, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { sourceFeeds, sources } from '$lib/server/db/schema';
import { getIngestionQueueOverview } from '$lib/server/ingestion';

export const GET: RequestHandler = async () => {
	try {
		const [feedHealthRows, sourceHealthRows, feedStatuses, sourceStatuses, queue] =
			await Promise.all([
				db.select({
					activeFeeds: sql<number>`count(*) FILTER (WHERE ${sourceFeeds.status} = 'active')::int`,
					totalFeeds: sql<number>`count(*)::int`,
					latestFetchAt: sql<Date | string | null>`max(${sourceFeeds.lastFetchedAt})`,
					feedsWithErrors: sql<number>`count(*) FILTER (WHERE ${sourceFeeds.lastError} IS NOT NULL)::int`
				}).from(sourceFeeds),
				db.select({
					ingesting: sql<number>`count(*) FILTER (WHERE ${sources.status} = 'ingesting')::int`,
					needsRss: sql<number>`count(*) FILTER (WHERE ${sources.status} = 'needs_rss')::int`,
					needsAdapter: sql<number>`count(*) FILTER (WHERE ${sources.status} = 'needs_adapter')::int`,
					blocked: sql<number>`count(*) FILTER (WHERE ${sources.status} = 'blocked')::int`,
					disabled: sql<number>`count(*) FILTER (WHERE ${sources.status} = 'disabled')::int`,
					totalSources: sql<number>`count(*)::int`
				}).from(sources),
				db
					.select({
						status: sourceFeeds.status,
						count: sql<number>`count(*)::int`
					})
					.from(sourceFeeds)
					.groupBy(sourceFeeds.status)
					.orderBy(asc(sourceFeeds.status)),
				db
					.select({
						status: sources.status,
						count: sql<number>`count(*)::int`
					})
					.from(sources)
					.groupBy(sources.status)
					.orderBy(asc(sources.status)),
				getIngestionQueueOverview()
			]);

		const feedHealth = feedHealthRows[0];
		const sourceHealth = sourceHealthRows[0];
		const latestFetchAt = feedHealth?.latestFetchAt
			? toIsoString(feedHealth.latestFetchAt)
			: null;
		const queuedJobs = queue.jobStats.find((stat) => stat.status === 'queued')?.count ?? 0;
		const archivedJobs = queue.jobStats.find((stat) => stat.status === 'archived')?.count ?? 0;

		return json(
			{
				ok: true,
				checkedAt: new Date().toISOString(),
				queue: {
					queued: queuedJobs,
					archived: archivedJobs,
					recentJobs: queue.recentJobs
				},
				feeds: {
					active: Number(feedHealth?.activeFeeds ?? 0),
					total: Number(feedHealth?.totalFeeds ?? 0),
					withErrors: Number(feedHealth?.feedsWithErrors ?? 0),
					latestFetchAt,
					byStatus: toCountMap(feedStatuses)
				},
				sources: {
					total: Number(sourceHealth?.totalSources ?? 0),
					ingesting: Number(sourceHealth?.ingesting ?? 0),
					needsRss: Number(sourceHealth?.needsRss ?? 0),
					needsAdapter: Number(sourceHealth?.needsAdapter ?? 0),
					blocked: Number(sourceHealth?.blocked ?? 0),
					disabled: Number(sourceHealth?.disabled ?? 0),
					byStatus: toCountMap(sourceStatuses)
				}
			},
			{ headers: { 'cache-control': 'no-store' } }
		);
	} catch (error) {
		return json(
			{
				ok: false,
				checkedAt: new Date().toISOString(),
				error: error instanceof Error ? error.message : String(error)
			},
			{ status: 503, headers: { 'cache-control': 'no-store' } }
		);
	}
};

function toCountMap(rows: Array<{ status: string; count: string | number }>) {
	return Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

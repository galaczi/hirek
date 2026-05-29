import { json, type RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { getIngestionQueueOverview } from '$lib/server/ingestion';

type StatusCountRow = {
	status: string;
	count: string | number;
};

type FeedHealthRow = {
	active_feeds: string | number;
	total_feeds: string | number;
	latest_fetch_at: Date | string | null;
	feeds_with_errors: string | number;
};

type SourceHealthRow = {
	ingesting: string | number;
	needs_rss: string | number;
	needs_adapter: string | number;
	blocked: string | number;
	disabled: string | number;
	total_sources: string | number;
};

export const GET: RequestHandler = async () => {
	try {
		const [feedHealthRows, sourceHealthRows, feedStatuses, sourceStatuses, queue] =
			await Promise.all([
				db.execute<FeedHealthRow>(sql`
					SELECT
						count(*) FILTER (WHERE status = 'active') AS active_feeds,
						count(*) AS total_feeds,
						max(last_fetched_at) AS latest_fetch_at,
						count(*) FILTER (WHERE last_error IS NOT NULL) AS feeds_with_errors
					FROM source_feeds
				`),
				db.execute<SourceHealthRow>(sql`
					SELECT
						count(*) FILTER (WHERE status = 'ingesting') AS ingesting,
						count(*) FILTER (WHERE status = 'needs_rss') AS needs_rss,
						count(*) FILTER (WHERE status = 'needs_adapter') AS needs_adapter,
						count(*) FILTER (WHERE status = 'blocked') AS blocked,
						count(*) FILTER (WHERE status = 'disabled') AS disabled,
						count(*) AS total_sources
					FROM sources
				`),
				db.execute<StatusCountRow>(sql`
					SELECT status, count(*) AS count
					FROM source_feeds
					GROUP BY status
					ORDER BY status
				`),
				db.execute<StatusCountRow>(sql`
					SELECT status, count(*) AS count
					FROM sources
					GROUP BY status
					ORDER BY status
				`),
				getIngestionQueueOverview()
			]);

		const feedHealth = feedHealthRows[0];
		const sourceHealth = sourceHealthRows[0];
		const latestFetchAt = feedHealth?.latest_fetch_at
			? toIsoString(feedHealth.latest_fetch_at)
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
					active: Number(feedHealth?.active_feeds ?? 0),
					total: Number(feedHealth?.total_feeds ?? 0),
					withErrors: Number(feedHealth?.feeds_with_errors ?? 0),
					latestFetchAt,
					byStatus: toCountMap(feedStatuses)
				},
				sources: {
					total: Number(sourceHealth?.total_sources ?? 0),
					ingesting: Number(sourceHealth?.ingesting ?? 0),
					needsRss: Number(sourceHealth?.needs_rss ?? 0),
					needsAdapter: Number(sourceHealth?.needs_adapter ?? 0),
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

function toCountMap(rows: StatusCountRow[]) {
	return Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

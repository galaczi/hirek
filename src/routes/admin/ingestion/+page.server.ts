import { asc, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/admin/auth';
import { db } from '$lib/server/db';
import { sourceFeeds } from '$lib/server/db/schema';
import {
	enqueueActiveFeedJobs,
	enqueueIngestionJob,
	getIngestionQueueOverview,
	discoverMissingSourceFeeds,
	runQueuedIngestionJobs,
	seedSourceRegistry
} from '$lib/server/ingestion';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);

	const [feedStats, queueOverview] = await Promise.all([
		db
			.select({
				status: sourceFeeds.status,
				count: sql<number>`count(*)::int`
			})
			.from(sourceFeeds)
			.groupBy(sourceFeeds.status)
			.orderBy(asc(sourceFeeds.status)),
		getIngestionQueueOverview()
	]);

	return {
		feedStats: feedStats.map((row) => ({ status: row.status, count: Number(row.count) })),
		jobStats: queueOverview.jobStats,
		recentJobs: queueOverview.recentJobs
	};
};

export const actions: Actions = {
	seed: async (event) => {
		requireAdmin(event);
		return { ok: true, action: 'seed', result: await seedSourceRegistry() };
	},
	discover: async (event) => {
		requireAdmin(event);
		const id = await enqueueIngestionJob('discover-hirkereso');
		return { ok: true, action: 'discover', jobId: id };
	},
	discoverFeeds: async (event) => {
		requireAdmin(event);
		return { ok: true, action: 'discoverFeeds', result: await discoverMissingSourceFeeds(20) };
	},
	discoverAllFeeds: async (event) => {
		requireAdmin(event);
		const id = await enqueueIngestionJob('discover-source-feeds', { limit: 1000 });
		return { ok: true, action: 'discoverAllFeeds', jobId: id };
	},
	enqueueFeeds: async (event) => {
		requireAdmin(event);
		const count = await enqueueActiveFeedJobs(100);
		return { ok: true, action: 'enqueueFeeds', count };
	},
	run: async (event) => {
		requireAdmin(event);
		const results = await runQueuedIngestionJobs(10);
		return { ok: true, action: 'run', results };
	},
	reindex: async (event) => {
		requireAdmin(event);
		const id = await enqueueIngestionJob('reindex-meili');
		return { ok: true, action: 'reindex', jobId: id };
	}
};

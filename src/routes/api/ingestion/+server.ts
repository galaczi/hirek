import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin/auth';
import {
	enqueueActiveFeedJobs,
	enqueueIngestionJob,
	runQueuedIngestionJobs,
	seedSourceRegistry
} from '$lib/server/ingestion';

type IngestionAction = 'seed' | 'discover' | 'enqueueFeeds' | 'run' | 'reindex';

export const POST: RequestHandler = async (event) => {
	requireAdmin(event);

	const body = await event.request.json().catch(() => ({}));
	const action = body.action as IngestionAction | undefined;

	if (action === 'seed') return json({ ok: true, action, result: await seedSourceRegistry() });
	if (action === 'discover') {
		return json({ ok: true, action, jobId: await enqueueIngestionJob('discover-hirkereso') });
	}
	if (action === 'enqueueFeeds') {
		return json({ ok: true, action, count: await enqueueActiveFeedJobs(Number(body.limit) || 100) });
	}
	if (action === 'run') {
		return json({ ok: true, action, results: await runQueuedIngestionJobs(Number(body.limit) || 10) });
	}
	if (action === 'reindex') {
		return json({ ok: true, action, jobId: await enqueueIngestionJob('reindex-meili') });
	}

	return json({ ok: false, error: 'Unknown action' }, { status: 400 });
};

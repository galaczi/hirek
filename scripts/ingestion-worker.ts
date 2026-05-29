import { readFileSync } from 'node:fs';

type IngestionModule = typeof import('$lib/server/ingestion');

const DEFAULT_FEED_LIMIT = 100;
const DEFAULT_JOB_LIMIT = 10;
const DEFAULT_POLL_INTERVAL_MS = 60_000;
const DEFAULT_IDLE_SLEEP_MS = 5_000;
const BUSY_SLEEP_MS = 500;

loadDotenv();

const once = process.argv.includes('--once');
const feedLimit = readPositiveInteger('INGESTION_WORKER_FEED_LIMIT', DEFAULT_FEED_LIMIT);
const jobLimit = readPositiveInteger('INGESTION_WORKER_JOB_LIMIT', DEFAULT_JOB_LIMIT);
const pollIntervalMs = readPositiveInteger('INGESTION_WORKER_POLL_MS', DEFAULT_POLL_INTERVAL_MS);
const idleSleepMs = readPositiveInteger('INGESTION_WORKER_IDLE_MS', DEFAULT_IDLE_SLEEP_MS);
const ingestion = (await import('$lib/server/ingestion')) as IngestionModule;

let stopping = false;
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

if (once) {
	await enqueueAndDrain();
} else {
	await runForever();
}

async function runForever() {
	let nextEnqueueAt = 0;
	console.log(
		`Ingestion worker started. feedIntervalMs=${pollIntervalMs} feedLimit=${feedLimit} jobLimit=${jobLimit}`
	);

	while (!stopping) {
		const now = Date.now();
		if (now >= nextEnqueueAt) {
			await enqueueFeeds();
			nextEnqueueAt = now + pollIntervalMs;
		}

		const processed = await drainOnce();
		await sleep(processed > 0 ? BUSY_SLEEP_MS : idleSleepMs);
	}

	console.log('Ingestion worker stopped.');
}

async function enqueueAndDrain() {
	await enqueueFeeds();
	while (!stopping) {
		const processed = await drainOnce();
		if (processed === 0) break;
	}
}

async function enqueueFeeds() {
	try {
		const count = await ingestion.enqueueActiveFeedJobs(feedLimit);
		console.log(`Enqueued ${count} active feed job(s).`);
	} catch (error) {
		console.error('Failed to enqueue active feed jobs:', formatError(error));
	}
}

async function drainOnce() {
	try {
		const results = await ingestion.runQueuedIngestionJobs(jobLimit);
		for (const result of results) {
			console.log(JSON.stringify(result));
		}
		return results.length;
	} catch (error) {
		console.error('Failed to run queued ingestion jobs:', formatError(error));
		return 0;
	}
}

function stop() {
	stopping = true;
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function readPositiveInteger(name: string, fallback: number) {
	const value = Number(process.env[name]);
	return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function formatError(error: unknown) {
	return error instanceof Error ? error.stack ?? error.message : String(error);
}

function loadDotenv() {
	try {
		const content = readFileSync('.env', 'utf8');
		for (const line of content.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const equals = trimmed.indexOf('=');
			if (equals === -1) continue;
			const key = trimmed.slice(0, equals);
			const value = trimmed.slice(equals + 1).replace(/^["']|["']$/g, '');
			process.env[key] ??= value;
		}
	} catch {
		// Production and Docker can provide real environment variables instead.
	}
}

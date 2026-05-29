import { asc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { sourceFeeds } from '$lib/server/db/schema';
import { discoverHirkeresoSources, discoverMissingSourceFeeds } from './source-discovery';
import { ingestFeedById } from './feed-ingestion';
import { reindexArticles } from './reindex';

const QUEUE_NAME = 'ingestion';
const VISIBILITY_TIMEOUT_SECONDS = 90;
const RETRY_DELAY_SECONDS = 300;
const MAX_ATTEMPTS = 3;

export type IngestionJobType =
	| 'discover-hirkereso'
	| 'discover-source-feeds'
	| 'ingest-feed'
	| 'reindex-meili';

type QueueMessage = {
	type: IngestionJobType;
	payload: Record<string, unknown>;
};

type PgmqMessageRow = {
	msg_id: number;
	read_ct: number;
	message: QueueMessage;
	enqueued_at?: Date | string;
	vt?: Date | string;
};

export async function enqueueIngestionJob(type: IngestionJobType, payload: unknown = {}) {
	const message = { type, payload: normalizePayload(payload) };
	const rows = await db.execute<{ msg_id: number }>(sql`
		SELECT pgmq.send(
			queue_name => ${QUEUE_NAME},
			msg => ${JSON.stringify(message)}::jsonb
		) AS msg_id
	`);

	return rows[0].msg_id;
}

export async function enqueueActiveFeedJobs(limit = 100) {
	const feeds = await db
		.select({ id: sourceFeeds.id })
		.from(sourceFeeds)
		.where(eq(sourceFeeds.status, 'active'))
		.orderBy(asc(sourceFeeds.lastFetchedAt), asc(sourceFeeds.id))
		.limit(limit);

	for (const feed of feeds) {
		await enqueueIngestionJob('ingest-feed', { feedId: feed.id });
	}

	return feeds.length;
}

export async function runQueuedIngestionJobs(limit = 10) {
	const jobs = await db.execute<PgmqMessageRow>(sql`
		SELECT msg_id, read_ct, message
		FROM pgmq.read(${QUEUE_NAME}, ${VISIBILITY_TIMEOUT_SECONDS}, ${limit})
	`);

	const results = [];
	for (const job of jobs) {
		const message = normalizeMessage(job.message);

		try {
			const result = await runJob(message.type, message.payload);
			await archiveJob(job.msg_id);
			results.push({ id: job.msg_id, type: message.type, status: 'done', result });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			const attempts = getAttemptCount(message.payload, job.read_ct);
			await archiveJob(job.msg_id);

			if (attempts >= MAX_ATTEMPTS) {
				await recordFeedFailure(message, errorMessage, true);
				results.push({ id: job.msg_id, type: message.type, status: 'failed', error: errorMessage });
			} else {
				await recordFeedFailure(message, errorMessage, false);
				await retryJob(message, attempts + 1);
				results.push({ id: job.msg_id, type: message.type, status: 'error', error: errorMessage });
			}
		}
	}

	return results;
}

export async function getIngestionQueueOverview() {
	const [queuedRows, archivedRows, recentRows] = await Promise.all([
		db.execute<{ count: string | number }>(sql`SELECT count(*) AS count FROM pgmq.q_ingestion`),
		db.execute<{ count: string | number }>(sql`SELECT count(*) AS count FROM pgmq.a_ingestion`),
		db.execute<PgmqMessageRow>(sql`
			SELECT msg_id, read_ct, enqueued_at, vt, message
			FROM pgmq.q_ingestion
			ORDER BY enqueued_at DESC
			LIMIT 20
		`)
	]);

	return {
		jobStats: [
			{ status: 'queued', count: Number(queuedRows[0]?.count ?? 0) },
			{ status: 'archived', count: Number(archivedRows[0]?.count ?? 0) }
		],
		recentJobs: recentRows.map((row) => ({
			id: row.msg_id,
			type: normalizeMessage(row.message).type,
			status: 'queued',
			attempts: row.read_ct,
			lastError: null,
			createdAt: toIsoString(row.enqueued_at ?? new Date()),
			updatedAt: toIsoString(row.vt ?? row.enqueued_at ?? new Date())
		}))
	};
}

async function archiveJob(msgId: number) {
	await db.execute(sql`SELECT pgmq.archive(queue_name => ${QUEUE_NAME}, msg_id => ${msgId})`);
}

async function recordFeedFailure(message: QueueMessage, errorMessage: string, finalAttempt: boolean) {
	if (message.type !== 'ingest-feed') return;
	const feedId = Number(message.payload.feedId);
	if (!Number.isInteger(feedId)) return;

	await db
		.update(sourceFeeds)
		.set({
			status: finalAttempt ? 'error' : 'active',
			lastError: errorMessage,
			updatedAt: new Date()
		})
		.where(eq(sourceFeeds.id, feedId));
}

async function retryJob(message: QueueMessage, attempts: number) {
	const retryMessage = {
		...message,
		payload: {
			...message.payload,
			_attempts: attempts
		}
	};

	await db.execute(sql`
		SELECT pgmq.send(
			${QUEUE_NAME},
			${JSON.stringify(retryMessage)}::jsonb,
			${RETRY_DELAY_SECONDS}::integer
		)
	`);
}

async function runJob(type: IngestionJobType, payload: Record<string, unknown>) {
	if (type === 'discover-hirkereso') return discoverHirkeresoSources();
	if (type === 'discover-source-feeds') return discoverMissingSourceFeeds(Number(payload.limit) || 20);
	if (type === 'reindex-meili') return reindexArticles();
	if (type === 'ingest-feed') {
		const feedId = Number(payload.feedId);
		if (!Number.isInteger(feedId)) throw new Error('ingest-feed job requires feedId');
		return ingestFeedById(feedId);
	}

	throw new Error(`Unknown ingestion job type: ${type}`);
}

function normalizeMessage(value: unknown): QueueMessage {
	if (typeof value === 'string') {
		try {
			return normalizeMessage(JSON.parse(value));
		} catch {
			throw new Error('Invalid queue message JSON');
		}
	}

	if (!value || typeof value !== 'object') throw new Error('Invalid queue message');
	const candidate = value as Partial<QueueMessage>;
	if (!candidate.type) throw new Error('Queue message missing type');

	return {
		type: candidate.type,
		payload: normalizePayload(candidate.payload ?? {})
	};
}

function normalizePayload(value: unknown): Record<string, unknown> {
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function getAttemptCount(payload: Record<string, unknown>, readCount: number) {
	const payloadAttempts = Number(payload._attempts);
	return Number.isInteger(payloadAttempts) && payloadAttempts > 0 ? payloadAttempts : readCount;
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

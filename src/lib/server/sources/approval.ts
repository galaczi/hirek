import { sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sourceFeeds, sources } from '$lib/server/db/schema';

export const SOURCE_APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const;

export type SourceApprovalStatus = (typeof SOURCE_APPROVAL_STATUSES)[number];

export function isApprovedSource(approvalStatus: string | null | undefined) {
	return approvalStatus === 'approved';
}

export function getApprovedSourceStatus(currentStatus: string, activeFeedCount: number) {
	if (activeFeedCount > 0) return currentStatus === 'pending' ? 'ingesting' : currentStatus;
	return currentStatus === 'pending' ? 'needs_rss' : currentStatus;
}

export async function getSourceApprovalContext(sourceId: number) {
	const rows = await db.execute<{
		id: number;
		approval_status: string;
		status: string;
		active_feed_count: string | number;
	}>(sql`
		SELECT
			s.id,
			s.approval_status,
			s.status,
			count(sf.id) FILTER (WHERE sf.status = 'active') AS active_feed_count
		FROM sources s
		LEFT JOIN source_feeds sf ON sf.source_id = s.id
		WHERE s.id = ${sourceId}
		GROUP BY s.id
		LIMIT 1
	`);

	const row = rows[0];
	if (!row) error(404, 'Forrás nem található');

	return {
		id: row.id,
		approvalStatus: row.approval_status,
		status: row.status,
		activeFeedCount: Number(row.active_feed_count)
	};
}

export async function requireApprovedSourceForConfig(sourceId: number) {
	const source = await getSourceApprovalContext(sourceId);
	if (!isApprovedSource(source.approvalStatus)) {
		error(409, 'A forrás jóváhagyása szükséges ehhez a művelethez');
	}
	return source;
}

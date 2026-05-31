import { eq, sql } from 'drizzle-orm';
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
	const [row] = await db
	.select({
			id: sources.id,
			approvalStatus: sources.approvalStatus,
			status: sources.status,
			partnerPackage: sources.partnerPackage,
			partnerStatus: sources.partnerStatus,
			exchangeStatus: sources.exchangeStatus,
			trafficTarget: sources.trafficTarget,
			trustScore: sources.trustScore,
			exchangeCreditBalance: sources.exchangeCreditBalance,
			activeFeedCount: sql<number>`count(${sourceFeeds.id}) FILTER (WHERE ${sourceFeeds.status} = 'active')::int`
		})
		.from(sources)
		.leftJoin(sourceFeeds, eq(sourceFeeds.sourceId, sources.id))
		.where(eq(sources.id, sourceId))
		.groupBy(
			sources.id,
			sources.approvalStatus,
			sources.status,
			sources.partnerPackage,
			sources.partnerStatus,
			sources.exchangeStatus,
			sources.trafficTarget,
			sources.trustScore,
			sources.exchangeCreditBalance
		)
		.limit(1);

	if (!row) error(404, 'Forrás nem található');

	return {
		id: row.id,
		approvalStatus: row.approvalStatus,
		status: row.status,
		partnerPackage: row.partnerPackage,
		partnerStatus: row.partnerStatus,
		exchangeStatus: row.exchangeStatus,
		trafficTarget: Number(row.trafficTarget),
		trustScore: Number(row.trustScore),
		exchangeCreditBalance: Number(row.exchangeCreditBalance),
		activeFeedCount: Number(row.activeFeedCount)
	};
}

export async function requireApprovedSourceForConfig(sourceId: number) {
	const source = await getSourceApprovalContext(sourceId);
	if (!isApprovedSource(source.approvalStatus)) {
		error(409, 'A forrás jóváhagyása szükséges ehhez a művelethez');
	}
	return source;
}

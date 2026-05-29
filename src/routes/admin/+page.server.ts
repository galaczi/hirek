import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { asc, eq, sql } from 'drizzle-orm';
import { requireAdmin } from '$lib/server/admin/auth';
import { db } from '$lib/server/db';
import { articles, clickEvents, sourceFeeds, sources } from '$lib/server/db/schema';
import { seedSources } from '$lib/server/ingestion/seed-data';

const SOURCE_STATUSES = new Set([
	'ingesting',
	'needs_rss',
	'needs_adapter',
	'blocked',
	'pending',
	'disabled'
]);
const PARTNER_PACKAGES = new Set(['free', 'partner', 'growth']);
const PARTNER_STATUSES = new Set(['none', 'trial', 'active', 'paused', 'cancelled']);

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);

	const expectedSourceSlugs = seedSources.map((source) => source.slug);
	const expectedSourceSql = sql.join(
		expectedSourceSlugs.map((slug) => sql`${slug}`),
		sql`, `
	);
	const lastErrorExpr = sql<string | null>`(array_remove(array_agg(${sourceFeeds.lastError} ORDER BY ${sourceFeeds.updatedAt} DESC), NULL))[1]`;

	const [sourceStats, feedStats, totals, launchGateRows, sourceRegistry] = await Promise.all([
		db
			.select({
				status: sources.status,
				count: sql<number>`count(*)::int`
			})
			.from(sources)
			.groupBy(sources.status)
			.orderBy(asc(sources.status)),
		db
			.select({
				status: sourceFeeds.status,
				count: sql<number>`count(*)::int`
			})
			.from(sourceFeeds)
			.groupBy(sourceFeeds.status)
			.orderBy(asc(sourceFeeds.status)),
		(async () => {
			const [sourceRows, articleRows, clickRows, partnerRows] = await Promise.all([
				db.select({ count: sql<number>`count(*)::int` }).from(sources),
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(articles)
					.where(eq(articles.active, true)),
				db.select({ count: sql<number>`count(*)::int` }).from(clickEvents),
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(sources)
					.where(sql`${sources.partnerStatus} != 'none'`)
			]);

			return {
				sources: Number(sourceRows[0]?.count ?? 0),
				articles: Number(articleRows[0]?.count ?? 0),
				clicks: Number(clickRows[0]?.count ?? 0),
				partners: Number(partnerRows[0]?.count ?? 0)
			};
		})(),
		db
			.select({
				registeredSources: sql<number>`count(DISTINCT ${sources.id}) FILTER (WHERE ${sources.slug} IN (${expectedSourceSql}))::int`,
				liveSources: sql<number>`count(DISTINCT ${sources.id}) FILTER (WHERE ${sources.slug} IN (${expectedSourceSql}) AND ${sources.status} = 'ingesting')::int`,
				activeFeedSources: sql<number>`count(DISTINCT ${sources.id}) FILTER (WHERE ${sources.slug} IN (${expectedSourceSql}) AND ${sourceFeeds.status} = 'active')::int`,
				blockedWithReason: sql<number>`count(DISTINCT ${sources.id}) FILTER (
					WHERE ${sources.slug} IN (${expectedSourceSql})
						AND ${sources.status} = 'blocked'
						AND nullif(trim(coalesce(${sources.statusNote}, '')), '') IS NOT NULL
				)::int`,
				needsWork: sql<number>`count(DISTINCT ${sources.id}) FILTER (
					WHERE ${sources.slug} IN (${expectedSourceSql})
						AND (
							${sources.status} IN ('needs_rss', 'needs_adapter', 'pending', 'disabled')
							OR (${sources.status} = 'blocked' AND nullif(trim(coalesce(${sources.statusNote}, '')), '') IS NULL)
						)
				)::int`
			})
			.from(sources)
			.leftJoin(sourceFeeds, eq(sourceFeeds.sourceId, sources.id)),
		db
			.select({
				id: sources.id,
				slug: sources.slug,
				name: sources.name,
				domain: sources.domain,
				approvalStatus: sources.approvalStatus,
				status: sources.status,
				statusNote: sources.statusNote,
				partnerPackage: sources.partnerPackage,
				partnerStatus: sources.partnerStatus,
				trafficTarget: sources.trafficTarget,
				feedCount: sql<number>`count(${sourceFeeds.id})::int`,
				activeFeedCount: sql<number>`count(${sourceFeeds.id}) FILTER (WHERE ${sourceFeeds.status} = 'active')::int`,
				lastFetchedAt: sql<Date | string | null>`max(${sourceFeeds.lastFetchedAt})`,
				lastError: lastErrorExpr,
				articleCount: sql<number>`(
					SELECT count(*)::int
					FROM ${articles}
					WHERE ${articles.sourceId} = ${sources.id}
						AND ${articles.active} = true
				)`,
				clickCount: sql<number>`(
					SELECT count(*)::int
					FROM ${clickEvents}
					WHERE ${clickEvents.sourceId} = ${sources.id}
				)`
			})
			.from(sources)
			.leftJoin(sourceFeeds, eq(sourceFeeds.sourceId, sources.id))
			.groupBy(
				sources.id,
				sources.slug,
				sources.name,
				sources.domain,
				sources.approvalStatus,
				sources.status,
				sources.statusNote,
				sources.partnerPackage,
				sources.partnerStatus,
				sources.trafficTarget
			)
			.orderBy(
				sql`CASE ${sources.status}
					WHEN 'blocked' THEN 1
					WHEN 'needs_adapter' THEN 2
					WHEN 'needs_rss' THEN 3
					WHEN 'pending' THEN 4
					WHEN 'ingesting' THEN 5
					ELSE 6
				END`,
				asc(sources.name)
			)
	]);

	return {
		sourceStats: sourceStats.map((row) => ({ status: row.status, count: Number(row.count) })),
		feedStats: feedStats.map((row) => ({ status: row.status, count: Number(row.count) })),
		launchGate: {
			expectedSources: seedSources.length,
			registeredSources: Number(launchGateRows[0]?.registeredSources ?? 0),
			liveSources: Number(launchGateRows[0]?.liveSources ?? 0),
			activeFeedSources: Number(launchGateRows[0]?.activeFeedSources ?? 0),
			blockedWithReason: Number(launchGateRows[0]?.blockedWithReason ?? 0),
			needsWork: Number(launchGateRows[0]?.needsWork ?? 0)
		},
		totals,
		sourceRegistry: sourceRegistry.map((row) => ({
			id: row.id,
			slug: row.slug,
			name: row.name,
			domain: row.domain,
			approvalStatus: row.approvalStatus,
			status: row.status,
			statusNote: row.statusNote,
			partnerPackage: row.partnerPackage,
			partnerStatus: row.partnerStatus,
			trafficTarget: Number(row.trafficTarget),
			feedCount: Number(row.feedCount),
			activeFeedCount: Number(row.activeFeedCount),
			lastFetchedAt: row.lastFetchedAt ? toIsoString(row.lastFetchedAt) : null,
			lastError: row.lastError,
			articleCount: Number(row.articleCount),
			clickCount: Number(row.clickCount)
		}))
	};
};

export const actions: Actions = {
	updateSource: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const sourceId = Number(form.get('sourceId'));
		const status = String(form.get('status') ?? '');
		const partnerPackage = String(form.get('partnerPackage') ?? '');
		const partnerStatus = String(form.get('partnerStatus') ?? '');
		const trafficTarget = Math.max(0, Math.floor(Number(form.get('trafficTarget') ?? 0) || 0));
		const statusNote = String(form.get('statusNote') ?? '').trim() || null;

		if (!Number.isInteger(sourceId)) return fail(400, { error: 'Invalid source.' });
		if (!SOURCE_STATUSES.has(status)) return fail(400, { error: 'Invalid source status.' });
		if (!PARTNER_PACKAGES.has(partnerPackage)) return fail(400, { error: 'Invalid partner package.' });
		if (!PARTNER_STATUSES.has(partnerStatus)) return fail(400, { error: 'Invalid partner status.' });

		await db
			.update(sources)
			.set({
				status,
				statusNote,
				partnerPackage,
				partnerStatus,
				trafficTarget,
				updatedAt: new Date()
			})
			.where(eq(sources.id, sourceId));

		return { ok: true, action: 'updateSource', sourceId };
	}
};

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

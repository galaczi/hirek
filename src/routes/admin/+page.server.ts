import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { eq, sql } from 'drizzle-orm';
import { requireAdmin } from '$lib/server/admin/auth';
import { db } from '$lib/server/db';
import { sources } from '$lib/server/db/schema';
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

type SourceRegistryRow = {
	id: number;
	slug: string;
	name: string;
	domain: string;
	approval_status: string;
	status: string;
	status_note: string | null;
	partner_package: string;
	partner_status: string;
	traffic_target: number;
	feed_count: string | number;
	active_feed_count: string | number;
	last_fetched_at: Date | string | null;
	last_error: string | null;
	article_count: string | number;
	click_count: string | number;
};

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);

	const expectedSourceSlugs = seedSources.map((source) => source.slug);
	const expectedSourceSql = sql.join(
		expectedSourceSlugs.map((slug) => sql`${slug}`),
		sql`, `
	);

	const [sourceStats, feedStats, totals, launchGateRows, sourceRegistry] = await Promise.all([
		db.execute<{ status: string; count: string | number }>(sql`
			SELECT status, count(*) AS count
			FROM sources
			GROUP BY status
			ORDER BY status ASC
		`),
		db.execute<{ status: string; count: string | number }>(sql`
			SELECT status, count(*) AS count
			FROM source_feeds
			GROUP BY status
			ORDER BY status ASC
		`),
		db.execute<{
			sources: string | number;
			articles: string | number;
			clicks: string | number;
			partners: string | number;
		}>(sql`
			SELECT
				(SELECT count(*) FROM sources) AS sources,
				(SELECT count(*) FROM articles WHERE active = true) AS articles,
				(SELECT count(*) FROM click_events) AS clicks,
				(SELECT count(*) FROM sources WHERE partner_status != 'none') AS partners
		`),
		db.execute<{
			registered_sources: string | number;
			live_sources: string | number;
			active_feed_sources: string | number;
			blocked_with_reason: string | number;
			needs_work: string | number;
		}>(sql`
			SELECT
				count(DISTINCT s.id) FILTER (WHERE s.slug IN (${expectedSourceSql})) AS registered_sources,
				count(DISTINCT s.id) FILTER (WHERE s.slug IN (${expectedSourceSql}) AND s.status = 'ingesting') AS live_sources,
				count(DISTINCT s.id) FILTER (
					WHERE s.slug IN (${expectedSourceSql})
						AND sf.status = 'active'
				) AS active_feed_sources,
				count(DISTINCT s.id) FILTER (
					WHERE s.slug IN (${expectedSourceSql})
						AND s.status = 'blocked'
						AND nullif(trim(coalesce(s.status_note, '')), '') IS NOT NULL
				) AS blocked_with_reason,
				count(DISTINCT s.id) FILTER (
					WHERE s.slug IN (${expectedSourceSql})
						AND (
							s.status IN ('needs_rss', 'needs_adapter', 'pending', 'disabled')
							OR (s.status = 'blocked' AND nullif(trim(coalesce(s.status_note, '')), '') IS NULL)
						)
				) AS needs_work
			FROM sources s
			LEFT JOIN source_feeds sf ON sf.source_id = s.id
		`),
		db.execute<SourceRegistryRow>(sql`
			SELECT
				s.id,
				s.slug,
				s.name,
				s.domain,
				s.approval_status,
				s.status,
				s.status_note,
				s.partner_package,
				s.partner_status,
				s.traffic_target,
				count(sf.id) AS feed_count,
				count(sf.id) FILTER (WHERE sf.status = 'active') AS active_feed_count,
				max(sf.last_fetched_at) AS last_fetched_at,
				(array_remove(array_agg(sf.last_error ORDER BY sf.updated_at DESC), NULL))[1] AS last_error,
				(SELECT count(*) FROM articles a WHERE a.source_id = s.id AND a.active = true) AS article_count,
				(SELECT count(*) FROM click_events ce WHERE ce.source_id = s.id) AS click_count
			FROM sources s
			LEFT JOIN source_feeds sf ON sf.source_id = s.id
			GROUP BY s.id
			ORDER BY
				CASE s.status
					WHEN 'blocked' THEN 1
					WHEN 'needs_adapter' THEN 2
					WHEN 'needs_rss' THEN 3
					WHEN 'pending' THEN 4
					WHEN 'ingesting' THEN 5
					ELSE 6
				END,
				s.name ASC
		`)
	]);

	return {
		sourceStats: sourceStats.map((row) => ({ status: row.status, count: Number(row.count) })),
		feedStats: feedStats.map((row) => ({ status: row.status, count: Number(row.count) })),
		launchGate: {
			expectedSources: seedSources.length,
			registeredSources: Number(launchGateRows[0]?.registered_sources ?? 0),
			liveSources: Number(launchGateRows[0]?.live_sources ?? 0),
			activeFeedSources: Number(launchGateRows[0]?.active_feed_sources ?? 0),
			blockedWithReason: Number(launchGateRows[0]?.blocked_with_reason ?? 0),
			needsWork: Number(launchGateRows[0]?.needs_work ?? 0)
		},
		totals: {
			sources: Number(totals[0]?.sources ?? 0),
			articles: Number(totals[0]?.articles ?? 0),
			clicks: Number(totals[0]?.clicks ?? 0),
			partners: Number(totals[0]?.partners ?? 0)
		},
		sourceRegistry: sourceRegistry.map((row) => ({
			id: row.id,
			slug: row.slug,
			name: row.name,
			domain: row.domain,
			approvalStatus: row.approval_status,
			status: row.status,
			statusNote: row.status_note,
			partnerPackage: row.partner_package,
			partnerStatus: row.partner_status,
			trafficTarget: Number(row.traffic_target),
			feedCount: Number(row.feed_count),
			activeFeedCount: Number(row.active_feed_count),
			lastFetchedAt: row.last_fetched_at ? toIsoString(row.last_fetched_at) : null,
			lastError: row.last_error,
			articleCount: Number(row.article_count),
			clickCount: Number(row.click_count)
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

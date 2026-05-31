import { and, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { sourceSurfaceRollingStats } from '$lib/server/db/schema';
import type { PublicSurface } from '$lib/source-acquisition';

export const RETENTION_DAYS = 90;

export type SourceSurfaceStatsIncrement = {
	sourceId: number;
	surface: PublicSurface;
	impressions?: number;
	clicks?: number;
	uniqueClicks?: number;
	spendAmount?: number;
};

export async function incrementSourceSurfaceStats(increments: SourceSurfaceStatsIncrement[]) {
	const normalized = increments
		.map((increment) => ({
			...increment,
			impressions: Math.max(0, Math.floor(increment.impressions ?? 0)),
			clicks: Math.max(0, Math.floor(increment.clicks ?? 0)),
			uniqueClicks: Math.max(0, Math.floor(increment.uniqueClicks ?? 0)),
			spendAmount: Math.max(0, Math.floor(increment.spendAmount ?? 0))
		}))
		.filter(
			(increment) =>
				increment.impressions > 0 ||
				increment.clicks > 0 ||
				increment.uniqueClicks > 0 ||
				increment.spendAmount > 0
		);

	for (const increment of normalized) {
		await db.execute(sql`
			INSERT INTO source_surface_rolling_stats (
				source_id,
				surface,
				day,
				impressions,
				clicks,
				unique_clicks,
				spend_amount,
				updated_at
			)
			VALUES (
				${increment.sourceId},
				${increment.surface},
				current_date,
				${increment.impressions},
				${increment.clicks},
				${increment.uniqueClicks},
				${increment.spendAmount},
				now()
			)
			ON CONFLICT (source_id, surface, day) DO UPDATE SET
				impressions = source_surface_rolling_stats.impressions + EXCLUDED.impressions,
				clicks = source_surface_rolling_stats.clicks + EXCLUDED.clicks,
				unique_clicks = source_surface_rolling_stats.unique_clicks + EXCLUDED.unique_clicks,
				spend_amount = source_surface_rolling_stats.spend_amount + EXCLUDED.spend_amount,
				updated_at = now()
		`);
	}
}

export async function getSourceSpendToday(sourceId: number) {
	const [row] = await db
		.select({
			total: sql<number>`coalesce(sum(${sourceSurfaceRollingStats.spendAmount}), 0)::int`
		})
		.from(sourceSurfaceRollingStats)
		.where(
			and(
				eq(sourceSurfaceRollingStats.sourceId, sourceId),
				sql`${sourceSurfaceRollingStats.day} = current_date`
			)
		)
		.limit(1);

	return Number(row?.total ?? 0);
}

export function retentionCutoff() {
	return new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

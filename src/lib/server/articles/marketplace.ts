import { and, desc, eq, gte, inArray, sql, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	articleCategories,
	articles,
	categories,
	sources,
	sourceSurfaceRollingStats
} from '$lib/server/db/schema';
import type { Article } from '$lib/home/data';
import { RETENTION_DAYS, retentionCutoff } from '$lib/server/articles/stats';
import type { AcquisitionMode, PublicSurface } from '$lib/source-acquisition';

export type RankedArticle = Article & {
	deliveryMode: AcquisitionMode;
	surfaceKey: PublicSurface;
	overallScore: number;
	boostRankValue: number;
};

export type MarketplaceArticleFilters = {
	surface: PublicSurface;
	category?: string;
	source?: string;
	since?: Date | null;
	limit?: number;
};

type ArticleRow = {
	id: number;
	title: string;
	excerpt: string | null;
	sourceSlug: string;
	sourceName: string;
	categorySlug: string | null;
	categoryName: string | null;
	categorySlugs: string[] | null;
	publishedAt: Date | string;
	clickScore: number;
	deliveryMode: AcquisitionMode;
	overallScore: number;
	boostRankValue: number;
};

export async function getMarketplaceArticles(filters: MarketplaceArticleFilters) {
	const limit = Math.min(Math.max(filters.limit ?? 80, 1), 120);
	const conditions = getEligibilityConditions(filters);

	const rows =
		filters.surface === 'source' || filters.surface === 'source_category'
			? await getChronologicalSourceArticles(conditions, limit)
			: await getScoredDiscoveryArticles(filters.surface, conditions, limit);

	return rows.map((row) => toRankedArticle(row, filters.surface));
}

function getEligibilityConditions(filters: MarketplaceArticleFilters) {
	const conditions: SQL[] = [eq(articles.active, true), gte(articles.publishedAt, retentionCutoff())];
	if (filters.source) conditions.push(eq(sources.slug, filters.source));
	if (filters.category) {
		conditions.push(
			inArray(
				articles.id,
				db
					.select({ articleId: articleCategories.articleId })
					.from(articleCategories)
					.innerJoin(categories, eq(categories.id, articleCategories.categoryId))
					.where(eq(categories.slug, filters.category))
			)
		);
	}
	if (filters.since) conditions.push(gte(articles.publishedAt, filters.since));
	return conditions;
}

async function getChronologicalSourceArticles(conditions: SQL[], limit: number) {
	return db
		.select({
			id: articles.id,
			title: articles.title,
			excerpt: articles.excerpt,
			sourceSlug: sources.slug,
			sourceName: sources.name,
			categorySlug: sql<string | null>`(array_remove(array_agg(DISTINCT ${categories.slug}), NULL))[1]`,
			categoryName: sql<string | null>`(array_remove(array_agg(DISTINCT ${categories.name}), NULL))[1]`,
			categorySlugs: sql<string[]>`array_remove(array_agg(DISTINCT ${categories.slug}), NULL)`,
			publishedAt: articles.publishedAt,
			clickScore: articles.clickScore,
			deliveryMode: sql<AcquisitionMode>`'organic'`,
			overallScore: sql<number>`0`,
			boostRankValue: sql<number>`0`
		})
		.from(articles)
		.innerJoin(sources, eq(sources.id, articles.sourceId))
		.leftJoin(articleCategories, eq(articleCategories.articleId, articles.id))
		.leftJoin(categories, eq(categories.id, articleCategories.categoryId))
		.where(and(...conditions))
		.groupBy(
			articles.id,
			articles.title,
			articles.excerpt,
			articles.publishedAt,
			articles.clickScore,
			sources.id,
			sources.slug,
			sources.name
		)
		.orderBy(desc(articles.publishedAt), desc(articles.clickScore))
		.limit(limit);
}

async function getScoredDiscoveryArticles(surface: PublicSurface, conditions: SQL[], limit: number) {
	const stats = db
		.select({
			sourceId: sourceSurfaceRollingStats.sourceId,
			impressions: sql<number>`coalesce(sum(${sourceSurfaceRollingStats.impressions}), 0)::int`.as('impressions'),
			uniqueClicks: sql<number>`coalesce(sum(${sourceSurfaceRollingStats.uniqueClicks}), 0)::int`.as('unique_clicks'),
			dailySpend: sql<number>`coalesce(sum(${sourceSurfaceRollingStats.spendAmount}) FILTER (WHERE ${sourceSurfaceRollingStats.day} = current_date), 0)::int`.as('daily_spend')
		})
		.from(sourceSurfaceRollingStats)
		.where(
			and(
				eq(sourceSurfaceRollingStats.surface, surface),
				sql`${sourceSurfaceRollingStats.day} >= current_date - cast(${RETENTION_DAYS} as integer)`
			)
		)
		.groupBy(sourceSurfaceRollingStats.sourceId)
		.as('stats');
	const expectedCtr = sql<number>`((coalesce(${stats.uniqueClicks}, 0) + 1)::double precision / (coalesce(${stats.impressions}, 0) + 25))`;
	const trustFactor = sql<number>`greatest(0, least(1, ${sources.trustScore} / 10.0))`;
	const boostEligible = sql<boolean>`(
		${sources.approvalStatus} = 'approved'
		AND ${sources.boostStatus} = 'active'
		AND ${surface} = any(string_to_array(${sources.boostRouteTargets}, ','))
		AND ${sources.maxCpc} > 0
		AND (${sources.dailySpendCap} <= 0 OR coalesce(${stats.dailySpend}, 0) < ${sources.dailySpendCap})
	)`;
	const exchangeEligible = sql<boolean>`(${sources.exchangeStatus} = 'active' AND ${sources.exchangeCreditBalance} >= ${sources.maxCpc})`;
	const paidEligible = sql<boolean>`(${sources.walletBalance} >= ${sources.maxCpc})`;
	const boostBid = sql<number>`CASE WHEN ${boostEligible} AND (${exchangeEligible} OR ${paidEligible}) THEN ${sources.maxCpc} ELSE 0 END`;
	const boostRankValue = sql<number>`(${boostBid} * ${expectedCtr} * ${trustFactor})`;
	const visibilityScore = sql<number>`(
		${sources.trustScore} * 8
		+ greatest(0, 72 - extract(epoch FROM (now() - ${articles.publishedAt})) / 3600) * 0.9
		+ ln(1 + greatest(0, ${articles.clickScore})) * 6
		+ ${boostRankValue}
	)`;
	const deliveryMode = sql<AcquisitionMode>`CASE
		WHEN ${boostEligible} AND ${exchangeEligible} THEN 'exchange'
		WHEN ${boostEligible} AND ${paidEligible} THEN 'paid'
		ELSE 'organic'
	END`;

	return db
		.select({
			id: articles.id,
			title: articles.title,
			excerpt: articles.excerpt,
			sourceSlug: sources.slug,
			sourceName: sources.name,
			categorySlug: sql<string | null>`(array_remove(array_agg(DISTINCT ${categories.slug}), NULL))[1]`,
			categoryName: sql<string | null>`(array_remove(array_agg(DISTINCT ${categories.name}), NULL))[1]`,
			categorySlugs: sql<string[]>`array_remove(array_agg(DISTINCT ${categories.slug}), NULL)`,
			publishedAt: articles.publishedAt,
			clickScore: articles.clickScore,
			deliveryMode,
			overallScore: visibilityScore,
			boostRankValue
		})
		.from(articles)
		.innerJoin(sources, eq(sources.id, articles.sourceId))
		.leftJoin(articleCategories, eq(articleCategories.articleId, articles.id))
		.leftJoin(categories, eq(categories.id, articleCategories.categoryId))
		.leftJoin(stats, eq(stats.sourceId, sources.id))
		.where(and(...conditions))
		.groupBy(
			articles.id,
			articles.title,
			articles.excerpt,
			articles.publishedAt,
			articles.clickScore,
			sources.id,
			sources.slug,
			sources.name,
			sources.approvalStatus,
			sources.boostStatus,
			sources.boostRouteTargets,
			sources.exchangeStatus,
			sources.trustScore,
			sources.walletBalance,
			sources.exchangeCreditBalance,
			sources.maxCpc,
			sources.dailySpendCap,
			stats.impressions,
			stats.uniqueClicks,
			stats.dailySpend
		)
		.orderBy(desc(visibilityScore), desc(articles.publishedAt))
		.limit(limit);
}

function toRankedArticle(row: ArticleRow, surface: PublicSurface) {
	return {
		id: row.id,
		title: row.title,
		excerpt: row.excerpt,
		category: row.categorySlug ?? 'uncategorized',
		categoryName: row.categoryName ?? 'Egyéb',
		categorySlugs: row.categorySlugs ?? [],
		source: row.sourceSlug,
		sourceName: row.sourceName,
		publishedAt: toIsoString(row.publishedAt),
		clicks: row.clickScore,
		deliveryMode: row.deliveryMode,
		surfaceKey: surface,
		overallScore: Number(row.overallScore),
		boostRankValue: Number(row.boostRankValue)
	} satisfies RankedArticle;
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

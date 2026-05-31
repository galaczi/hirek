import { and, desc, eq, gte, sql, type SQL } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { requirePartnerAccess } from '$lib/server/admin/auth';
import { createWalletTopUp } from '$lib/server/billing/wallet';
import {
	acquisitionModeLabels,
	publicSurfaceLabels,
	serializeSurfaceTargets
} from '$lib/source-acquisition';
import { getTrafficTargetProgress } from '$lib/source-commercial';
import { db } from '$lib/server/db';
import {
	articleCategories,
	articleCategoryOverrides,
	articles,
	categories,
	clickEvents,
	sourceBillingInvoices,
	sourceBillingLedger,
	sourceFeeds,
	sourceCategoryRules,
	sources
} from '$lib/server/db/schema';
import { getArticleSearchDocuments } from '$lib/server/articles/search-documents';
import { indexArticles } from '$lib/server/search/meili';
import { upsertSourceCategoryRule } from '$lib/server/categorization/url-rules';
import { getSourceApprovalContext, isApprovedSource } from '$lib/server/sources/approval';
import {
	normalizeUrlPattern,
	validateUrlPatternInput,
	validateUtmSettingsInput,
	validateWalletTopUpInput,
	validateSourceAcquisitionInput,
	type ValidationFailure
} from '$lib/server/validation/input';

type ClicksOverTimeRow = {
	day: string;
	click_count: string | number;
	unique_click_count: string | number;
};

type TopCategoryRow = {
	slug: string;
	name: string;
	click_count: string | number;
	unique_click_count: string | number;
};

type TrafficSourceRow = {
	label: string;
	click_count: string | number;
	unique_click_count: string | number;
};

type RoutePerformanceRow = {
	surface: string | null;
	acquisition_mode: string;
	click_count: string | number;
	spend_amount: string | number;
};

type AvailableSourceRow = {
	id: number;
	slug: string;
	name: string;
	domain: string;
	approval_status: string;
	partner_package: string;
	partner_status: string;
	exchange_status: string;
	status: string;
	article_count: string | number;
	click_count: string | number;
	unique_click_count: string | number;
	traffic_target: string | number;
	last_fetched_at: string | Date | null;
};

const REPORT_RANGES = [7, 30, 90];

export const load: PageServerLoad = async (event) => {
	const access = requirePartnerAccess(event);
	const scopedSourceId = access.sourceId;
	const reportDays = parseReportDays(event.url);
	const reportSince = getReportSince(reportDays);
	const reportSinceIso = reportSince.toISOString();
	const topCategoryClickCountExpr = sql<number>`count(${clickEvents.id})::int`;
	const topCategoryUniqueClickCountExpr = sql<number>`count(${clickEvents.id}) FILTER (WHERE ${clickEvents.isUnique} = true)::int`;
	const trafficLabelExpr = getTrafficSourceCase();

	if (access.isAdmin && !scopedSourceId) {
		const [availableSourceRows, categoryRows] = await Promise.all([
				db
					.select({
						id: sources.id,
						slug: sources.slug,
						name: sources.name,
						domain: sources.domain,
						approvalStatus: sources.approvalStatus,
						partnerPackage: sources.partnerPackage,
						partnerStatus: sources.partnerStatus,
						exchangeStatus: sources.exchangeStatus,
						trustScore: sources.trustScore,
						boostStatus: sources.boostStatus,
						boostRouteTargets: sources.boostRouteTargets,
						walletBalance: sources.walletBalance,
						exchangeCreditBalance: sources.exchangeCreditBalance,
						maxCpc: sources.maxCpc,
						dailySpendCap: sources.dailySpendCap,
						status: sources.status,
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
								AND ${clickEvents.createdAt} >= ${reportSince}
						)`,
						uniqueClickCount: sql<number>`(
							SELECT count(*)::int
							FROM ${clickEvents}
							WHERE ${clickEvents.sourceId} = ${sources.id}
								AND ${clickEvents.isUnique} = true
								AND ${clickEvents.createdAt} >= ${reportSince}
						)`,
						trafficTarget: sources.trafficTarget,
						lastFetchedAt: sql<Date | string | null>`(
							SELECT max(${sourceFeeds.lastFetchedAt})
							FROM ${sourceFeeds}
							WHERE ${sourceFeeds.sourceId} = ${sources.id}
						)`
					})
					.from(sources)
					.orderBy(sources.name),
			db.select({ slug: categories.slug, name: categories.name }).from(categories).orderBy(categories.name)
		]);

		return {
			sourceStats: [],
			topArticles: [],
			recentClicks: [],
			categories: categoryRows,
			partnerSourceId: null,
			isAdmin: true,
			reportDays,
			reportRanges: REPORT_RANGES,
			availableSources: availableSourceRows.map((row) => ({
				id: row.id,
				slug: row.slug,
				name: row.name,
				domain: row.domain,
				approvalStatus: row.approvalStatus,
				partnerPackage: row.partnerPackage,
				partnerStatus: row.partnerStatus,
				exchangeStatus: row.exchangeStatus,
				trustScore: Number(row.trustScore),
				boostStatus: row.boostStatus,
				boostRouteTargets: row.boostRouteTargets,
				walletBalance: Number(row.walletBalance),
				exchangeCreditBalance: Number(row.exchangeCreditBalance),
				maxCpc: Number(row.maxCpc),
				dailySpendCap: Number(row.dailySpendCap),
				status: row.status,
				articleCount: Number(row.articleCount),
				clickCount: Number(row.clickCount),
				uniqueClickCount: Number(row.uniqueClickCount),
				trafficTarget: Number(row.trafficTarget),
				lastFetchedAt: row.lastFetchedAt ? toIsoString(row.lastFetchedAt) : null
			})),
			sourceState: null,
			commercialSummary: null,
			sourceRules: [],
			feedHealth: [],
			sourceSettings: null,
			clicksOverTime: [],
			topCategories: [],
			trafficSources: [],
			routePerformance: [],
			recentLedger: [],
			recentInvoices: []
			};
		}

	const [sourceStateRow] = scopedSourceId
		? await db
				.select({
					sourceId: sources.id,
					sourceName: sources.name,
					sourceDomain: sources.domain,
					approvalStatus: sources.approvalStatus,
					partnerPackage: sources.partnerPackage,
					partnerStatus: sources.partnerStatus,
					exchangeStatus: sources.exchangeStatus,
					trafficTarget: sources.trafficTarget,
					trustScore: sources.trustScore,
					boostStatus: sources.boostStatus,
					boostRouteTargets: sources.boostRouteTargets,
					walletBalance: sources.walletBalance,
					exchangeCreditBalance: sources.exchangeCreditBalance,
					maxCpc: sources.maxCpc,
					dailySpendCap: sources.dailySpendCap,
					lifetimeBillableClicks: sources.lifetimeBillableClicks,
					lifetimeWalletSpend: sources.lifetimeWalletSpend,
					lifetimeExchangeSpend: sources.lifetimeExchangeSpend,
					status: sources.status,
					statusNote: sources.statusNote
				})
				.from(sources)
				.where(eq(sources.id, scopedSourceId))
				.limit(1)
		: [];

	if (!sourceStateRow) {
		return {
			sourceStats: [],
			topArticles: [],
			recentClicks: [],
			categories: [],
			partnerSourceId: scopedSourceId,
			isAdmin: access.isAdmin,
			reportDays,
			reportRanges: REPORT_RANGES,
			availableSources: [],
			commercialSummary: null,
			sourceRules: [],
			feedHealth: [],
			sourceSettings: null,
			clicksOverTime: [],
			topCategories: [],
			trafficSources: [],
			routePerformance: [],
			recentLedger: [],
			recentInvoices: [],
			sourceState: null
		};
	}

	const sourceState = {
		...sourceStateRow,
		trafficTarget: Number(sourceStateRow.trafficTarget),
		trustScore: Number(sourceStateRow.trustScore),
		walletBalance: Number(sourceStateRow.walletBalance),
		exchangeCreditBalance: Number(sourceStateRow.exchangeCreditBalance),
		maxCpc: Number(sourceStateRow.maxCpc),
		dailySpendCap: Number(sourceStateRow.dailySpendCap),
		lifetimeBillableClicks: Number(sourceStateRow.lifetimeBillableClicks),
		lifetimeWalletSpend: Number(sourceStateRow.lifetimeWalletSpend),
		lifetimeExchangeSpend: Number(sourceStateRow.lifetimeExchangeSpend),
		isApproved: isApprovedSource(sourceStateRow.approvalStatus)
	};
	const pendingCommercialSummary = buildCommercialSummary(sourceState, 0);

	if (!sourceState.isApproved) {
		return {
			sourceStats: [],
			topArticles: [],
			recentClicks: [],
			categories: [],
			partnerSourceId: scopedSourceId,
			isAdmin: access.isAdmin,
			reportDays,
			reportRanges: REPORT_RANGES,
			availableSources: [],
			commercialSummary: pendingCommercialSummary,
			sourceRules: [],
			feedHealth: [],
			sourceSettings: null,
			clicksOverTime: [],
			topCategories: [],
			trafficSources: [],
			routePerformance: [],
			recentLedger: [],
			recentInvoices: [],
			sourceState
		};
	}

	const sourceFilter = scopedSourceId ? eq(sources.id, scopedSourceId) : undefined;
	const articleFilter = scopedSourceId ? eq(articles.sourceId, scopedSourceId) : undefined;
	const clickFilter = scopedSourceId
		? and(eq(clickEvents.sourceId, scopedSourceId), gte(clickEvents.createdAt, reportSince))
		: gte(clickEvents.createdAt, reportSince);

	const clickWhere = buildClickWhere(scopedSourceId, reportSinceIso);
	const [sourceStats, topArticles, recentClicks, categoryRows, ruleRows, feedRows, sourceSettingsRows, clicksOverTimeRows, topCategoryRows, trafficSourceRows, routePerformanceRows, recentLedgerRows, recentInvoiceRows] =
		await Promise.all([
		db
			.select({
				sourceId: sources.id,
				sourceName: sources.name,
				sourceDomain: sources.domain,
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
						AND ${clickEvents.createdAt} >= ${reportSince}
				)`,
				uniqueClickCount: sql<number>`(
					SELECT count(*)::int
					FROM ${clickEvents}
					WHERE ${clickEvents.sourceId} = ${sources.id}
						AND ${clickEvents.isUnique} = true
						AND ${clickEvents.createdAt} >= ${reportSince}
				)`
			})
			.from(sources)
			.where(sourceFilter)
			.orderBy(sources.name),
		db
			.select({
				id: articles.id,
				title: articles.title,
				sourceName: sources.name,
				clickScore: articles.clickScore,
				publishedAt: articles.publishedAt,
				clickCount: sql<number>`count(${clickEvents.id})`,
				uniqueClickCount: sql<number>`count(${clickEvents.id}) FILTER (WHERE ${clickEvents.isUnique} = true)`
			})
			.from(articles)
			.innerJoin(sources, eq(sources.id, articles.sourceId))
			.leftJoin(clickEvents, and(eq(clickEvents.articleId, articles.id), gte(clickEvents.createdAt, reportSince)))
			.where(articleFilter ? and(eq(articles.active, true), articleFilter) : eq(articles.active, true))
			.groupBy(articles.id, sources.id)
			.orderBy(
				desc(sql`count(${clickEvents.id})`),
				desc(articles.clickScore),
				desc(articles.publishedAt)
			)
			.limit(20),
		db
			.select({
				id: clickEvents.id,
				sourceName: sources.name,
				articleTitle: articles.title,
				referrer: clickEvents.referrer,
				utmCampaign: clickEvents.utmCampaign,
				isUnique: clickEvents.isUnique,
				createdAt: clickEvents.createdAt
			})
			.from(clickEvents)
			.innerJoin(sources, eq(sources.id, clickEvents.sourceId))
			.innerJoin(articles, eq(articles.id, clickEvents.articleId))
			.where(clickFilter)
			.orderBy(desc(clickEvents.createdAt))
			.limit(30),
		db.select({ slug: categories.slug, name: categories.name }).from(categories).orderBy(categories.name),
		scopedSourceId
			? db
					.select({
						id: sourceCategoryRules.id,
						urlPattern: sourceCategoryRules.urlPattern,
						categoryName: categories.name
					})
					.from(sourceCategoryRules)
					.innerJoin(categories, eq(categories.id, sourceCategoryRules.categoryId))
					.where(eq(sourceCategoryRules.sourceId, scopedSourceId))
					.orderBy(sourceCategoryRules.urlPattern)
			: Promise.resolve([]),
		db
			.select({
				feedId: sourceFeeds.id,
				sourceName: sources.name,
				feedUrl: sourceFeeds.feedUrl,
				status: sourceFeeds.status,
				lastFetchedAt: sourceFeeds.lastFetchedAt,
				lastError: sourceFeeds.lastError
			})
			.from(sourceFeeds)
			.innerJoin(sources, eq(sources.id, sourceFeeds.sourceId))
			.where(sourceFilter)
			.orderBy(sources.name, sourceFeeds.feedUrl),
		scopedSourceId
			? db
					.select({
						sourceId: sources.id,
						sourceName: sources.name,
						utmSource: sources.utmSource,
						utmMedium: sources.utmMedium,
						utmCampaign: sources.utmCampaign
					})
					.from(sources)
					.where(eq(sources.id, scopedSourceId))
					.limit(1)
			: Promise.resolve([]),
		getClicksOverTime(scopedSourceId, reportDays),
		db
			.select({
				slug: sql<string>`coalesce(${categories.slug}, 'nincs-rovat')`,
				name: sql<string>`coalesce(${categories.name}, 'Nincs rovat')`,
				clickCount: topCategoryClickCountExpr,
				uniqueClickCount: topCategoryUniqueClickCountExpr
			})
			.from(clickEvents)
			.leftJoin(categories, eq(categories.id, clickEvents.categoryId))
			.where(and(...clickWhere))
			.groupBy(categories.id, categories.slug, categories.name)
			.orderBy(desc(topCategoryClickCountExpr), desc(topCategoryUniqueClickCountExpr))
			.limit(8),
		db
			.select({
				label: trafficLabelExpr,
				clickCount: sql<number>`count(${clickEvents.id})::int`,
				uniqueClickCount: sql<number>`count(${clickEvents.id}) FILTER (WHERE ${clickEvents.isUnique} = true)::int`
			})
			.from(clickEvents)
			.where(and(...clickWhere))
			.groupBy(trafficLabelExpr)
			.orderBy(
				desc(sql`count(${clickEvents.id})`),
				desc(sql`count(${clickEvents.id}) FILTER (WHERE ${clickEvents.isUnique} = true)`)
			)
			.limit(8),
		db
			.select({
				surface: clickEvents.surface,
				acquisition_mode: clickEvents.acquisitionMode,
				click_count: sql<number>`count(${clickEvents.id}) FILTER (WHERE ${clickEvents.isUnique} = true)::int`,
				spend_amount: sql<number>`coalesce(sum(${clickEvents.chargeAmount}), 0)::int`
			})
			.from(clickEvents)
			.where(and(...clickWhere))
			.groupBy(clickEvents.surface, clickEvents.acquisitionMode)
			.orderBy(desc(sql`coalesce(sum(${clickEvents.chargeAmount}), 0)`)),
		scopedSourceId
			? db
					.select({
						id: sourceBillingLedger.id,
						entryType: sourceBillingLedger.entryType,
						fundingType: sourceBillingLedger.fundingType,
						surface: sourceBillingLedger.surface,
						amount: sourceBillingLedger.amount,
						description: sourceBillingLedger.description,
						createdAt: sourceBillingLedger.createdAt
					})
					.from(sourceBillingLedger)
					.where(eq(sourceBillingLedger.sourceId, scopedSourceId))
					.orderBy(desc(sourceBillingLedger.createdAt))
					.limit(12)
			: Promise.resolve([]),
		scopedSourceId
			? db
					.select({
						id: sourceBillingInvoices.id,
						amount: sourceBillingInvoices.amount,
						status: sourceBillingInvoices.status,
						provider: sourceBillingInvoices.provider,
						externalNumber: sourceBillingInvoices.externalNumber,
						description: sourceBillingInvoices.description,
						createdAt: sourceBillingInvoices.createdAt
					})
					.from(sourceBillingInvoices)
					.where(eq(sourceBillingInvoices.sourceId, scopedSourceId))
					.orderBy(desc(sourceBillingInvoices.createdAt))
					.limit(8)
			: Promise.resolve([])
		]);
	const commercialSummary = buildCommercialSummary(
		sourceState,
		Number(sourceStats[0]?.clickCount ?? 0)
	);

	return {
		sourceStats: sourceStats.map((row) => ({
			sourceId: row.sourceId,
			sourceName: row.sourceName,
			sourceDomain: row.sourceDomain,
			articleCount: Number(row.articleCount),
			clickCount: Number(row.clickCount),
			uniqueClickCount: Number(row.uniqueClickCount)
		})),
		topArticles: topArticles.map((row) => ({
			id: row.id,
			title: row.title,
			sourceName: row.sourceName,
			clickScore: row.clickScore,
			clickCount: Number(row.clickCount),
			uniqueClickCount: Number(row.uniqueClickCount),
			publishedAt: toIsoString(row.publishedAt)
		})),
		recentClicks: recentClicks.map((row) => ({
			id: row.id,
			sourceName: row.sourceName,
			articleTitle: row.articleTitle,
			referrer: row.referrer,
			utmCampaign: row.utmCampaign,
			isUnique: row.isUnique,
			createdAt: toIsoString(row.createdAt)
		})),
			categories: categoryRows,
			partnerSourceId: scopedSourceId,
			isAdmin: access.isAdmin,
			reportDays,
			reportRanges: REPORT_RANGES,
			availableSources: [],
			sourceState,
			commercialSummary,
			sourceRules: ruleRows,
			feedHealth: feedRows.map((row) => ({
			feedId: row.feedId,
			sourceName: row.sourceName,
			feedUrl: row.feedUrl,
			status: row.status,
			lastFetchedAt: row.lastFetchedAt ? toIsoString(row.lastFetchedAt) : null,
			lastError: row.lastError
		})),
		sourceSettings: sourceSettingsRows[0]
			? {
					sourceId: sourceSettingsRows[0].sourceId,
					sourceName: sourceSettingsRows[0].sourceName,
					utmSource: sourceSettingsRows[0].utmSource,
					utmMedium: sourceSettingsRows[0].utmMedium,
					utmCampaign: sourceSettingsRows[0].utmCampaign
				}
			: null,
		clicksOverTime: clicksOverTimeRows.map((row) => ({
			day: row.day,
			label: formatDayLabel(row.day),
			clickCount: Number(row.clickCount),
			uniqueClickCount: Number(row.uniqueClickCount)
		})),
		topCategories: topCategoryRows.map((row) => ({
			slug: row.slug,
			name: row.name,
			clickCount: Number(row.clickCount),
			uniqueClickCount: Number(row.uniqueClickCount)
		})),
		trafficSources: trafficSourceRows.map((row) => ({
			label: row.label,
			clickCount: Number(row.clickCount),
			uniqueClickCount: Number(row.uniqueClickCount)
		})),
		routePerformance: routePerformanceRows.map((row) => ({
			surface: row.surface ?? 'unknown',
			surfaceLabel: row.surface ? (publicSurfaceLabels[row.surface as keyof typeof publicSurfaceLabels] ?? row.surface) : 'Ismeretlen',
			acquisitionMode: row.acquisition_mode,
			acquisitionModeLabel:
				acquisitionModeLabels[row.acquisition_mode as keyof typeof acquisitionModeLabels] ?? row.acquisition_mode,
			clickCount: Number(row.click_count),
			spendAmount: Number(row.spend_amount)
		})),
		recentLedger: recentLedgerRows.map((row) => ({
			id: row.id,
			entryType: row.entryType,
			fundingType: row.fundingType,
			surface: row.surface,
			amount: Number(row.amount),
			description: row.description,
			createdAt: toIsoString(row.createdAt)
		})),
		recentInvoices: recentInvoiceRows.map((row) => ({
			id: row.id,
			amount: Number(row.amount),
			status: row.status,
			provider: row.provider,
			externalNumber: row.externalNumber,
			description: row.description,
			createdAt: toIsoString(row.createdAt)
		}))
	};
};

export const actions: Actions = {
	overrideCategory: async (event) => {
		const access = requirePartnerAccess(event);
		const form = await event.request.formData();
		const articleId = Number(form.get('articleId'));
		const categorySlug = String(form.get('categorySlug') ?? '');

		if (!Number.isInteger(articleId) || !categorySlug) {
			return { ok: false, action: 'overrideCategory', error: 'Invalid category override.' };
		}

		const [article] = await db
			.select({ id: articles.id, sourceId: articles.sourceId })
			.from(articles)
			.where(eq(articles.id, articleId))
			.limit(1);
		const [category] = await db
			.select({ id: categories.id })
			.from(categories)
			.where(eq(categories.slug, categorySlug))
			.limit(1);

		if (!article || !category) {
			return { ok: false, action: 'overrideCategory', error: 'Article or category not found.' };
		}
		if (!access.isAdmin && article.sourceId !== access.sourceId) {
			return { ok: false, action: 'overrideCategory', error: 'This article belongs to another source.' };
		}

		await db
			.insert(articleCategoryOverrides)
			.values({
				articleId: article.id,
				sourceId: article.sourceId,
				categoryId: category.id,
				updatedAt: sql`now()`
			})
			.onConflictDoUpdate({
				target: articleCategoryOverrides.articleId,
				set: { categoryId: category.id, updatedAt: sql`now()` }
			});

		await db.delete(articleCategories).where(eq(articleCategories.articleId, article.id));
		await db.insert(articleCategories).values({ articleId: article.id, categoryId: category.id });
		await indexArticles(await getArticleSearchDocuments([article.id]));

		return { ok: true, action: 'overrideCategory', articleId: article.id, categorySlug };
	},
	addUrlRule: async (event) => {
		const { sourceId } = requirePartnerAccess(event);
		const form = await event.request.formData();
		const categorySlug = String(form.get('categorySlug') ?? '');
		const urlPattern = normalizeUrlPattern(form.get('urlPattern'));

		if (!sourceId || !categorySlug) {
			return { ok: false, action: 'addUrlRule', error: 'Source, category and URL pattern are required.' };
		}
		const validation = validateUrlPatternInput({ urlPattern });
		if (!validation.ok) {
			return { ok: false, action: 'addUrlRule', error: partnerInputError(validation) };
		}
		if (!isApprovedSource((await getSourceApprovalContext(sourceId)).approvalStatus)) {
			return {
				ok: false,
				action: 'addUrlRule',
				error: 'A forrás jóváhagyása szükséges ehhez a művelethez.'
			};
		}

		const [category] = await db
			.select({ id: categories.id })
			.from(categories)
			.where(eq(categories.slug, categorySlug))
			.limit(1);

		if (!category) return { ok: false, action: 'addUrlRule', error: 'Category not found.' };

		await upsertSourceCategoryRule({
			sourceId,
			categoryId: category.id,
			urlPattern: validation.data.urlPattern
		});
		return { ok: true, action: 'addUrlRule' };
	},
	deleteUrlRule: async (event) => {
		const { sourceId } = requirePartnerAccess(event);
		const form = await event.request.formData();
		const ruleId = Number(form.get('ruleId'));

		if (!sourceId || !Number.isInteger(ruleId)) {
			return { ok: false, action: 'deleteUrlRule', error: 'Invalid rule.' };
		}
		if (!isApprovedSource((await getSourceApprovalContext(sourceId)).approvalStatus)) {
			return {
				ok: false,
				action: 'deleteUrlRule',
				error: 'A forrás jóváhagyása szükséges ehhez a művelethez.'
			};
		}

		await db
			.delete(sourceCategoryRules)
			.where(and(eq(sourceCategoryRules.id, ruleId), eq(sourceCategoryRules.sourceId, sourceId)));

		return { ok: true, action: 'deleteUrlRule' };
	},
	updateUtmSettings: async (event) => {
		const { sourceId } = requirePartnerAccess(event);
		const form = await event.request.formData();

		if (!sourceId) {
			return { ok: false, action: 'updateUtmSettings', error: 'Nincs kiválasztott forrás.' };
		}
		if (!isApprovedSource((await getSourceApprovalContext(sourceId)).approvalStatus)) {
			return {
				ok: false,
				action: 'updateUtmSettings',
				error: 'A forrás jóváhagyása szükséges ehhez a művelethez.'
			};
		}

		const validation = validateUtmSettingsInput({
			utmSource: form.get('utmSource'),
			utmMedium: form.get('utmMedium'),
			utmCampaign: form.get('utmCampaign')
		});
		if (!validation.ok) {
			return {
				ok: false,
				action: 'updateUtmSettings',
				error: partnerInputError(validation)
			};
		}

		await db
			.update(sources)
			.set({
				utmSource: validation.data.utmSource,
				utmMedium: validation.data.utmMedium,
				utmCampaign: validation.data.utmCampaign,
				updatedAt: new Date()
			})
			.where(eq(sources.id, sourceId));

		return { ok: true, action: 'updateUtmSettings' };
	},
	updateBoostSettings: async (event) => {
		const { sourceId } = requirePartnerAccess(event);
		const form = await event.request.formData();

		if (!sourceId) {
			return { ok: false, action: 'updateBoostSettings', error: 'Nincs kiválasztott forrás.' };
		}
		const approval = await getSourceApprovalContext(sourceId);
		if (!isApprovedSource(approval.approvalStatus)) {
			return {
				ok: false,
				action: 'updateBoostSettings',
				error: 'A forrás jóváhagyása szükséges ehhez a művelethez.'
			};
		}

		const validation = validateSourceAcquisitionInput({
			trustScore: approval.trustScore ?? 5,
			boostStatus: form.get('boostStatus'),
			boostRouteTargets: form.getAll('boostRouteTargets'),
			maxCpc: form.get('maxCpc'),
			dailySpendCap: form.get('dailySpendCap'),
			exchangeCreditBalance: approval.exchangeCreditBalance ?? 0,
			approvalStatus: approval.approvalStatus
		});
		if (!validation.ok) {
			return {
				ok: false,
				action: 'updateBoostSettings',
				error: partnerInputError(validation)
			};
		}

		await db
			.update(sources)
			.set({
				boostStatus: validation.data.boostStatus,
				boostRouteTargets: serializeSurfaceTargets(validation.data.boostRouteTargets),
				maxCpc: validation.data.maxCpc,
				dailySpendCap: validation.data.dailySpendCap,
				updatedAt: new Date()
			})
			.where(eq(sources.id, sourceId));

		return { ok: true, action: 'updateBoostSettings' };
	},
	topupWallet: async (event) => {
		const { sourceId } = requirePartnerAccess(event);
		const form = await event.request.formData();

		if (!sourceId) {
			return { ok: false, action: 'topupWallet', error: 'Nincs kiválasztott forrás.' };
		}

		const validation = validateWalletTopUpInput({
			amount: form.get('amount'),
			billingName: form.get('billingName'),
			billingEmail: form.get('billingEmail')
		});
		if (!validation.ok) {
			return { ok: false, action: 'topupWallet', error: partnerInputError(validation) };
		}

		const [source] = await db
			.select({ id: sources.id, name: sources.name })
			.from(sources)
			.where(eq(sources.id, sourceId))
			.limit(1);
		if (!source) {
			return { ok: false, action: 'topupWallet', error: 'A forrás nem található.' };
		}

		await createWalletTopUp({
			sourceId: source.id,
			sourceName: source.name,
			amount: validation.data.amount,
			billingName: validation.data.billingName,
			billingEmail: validation.data.billingEmail
		});

		return { ok: true, action: 'topupWallet' };
	}
};

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseReportDays(url: URL) {
	const requested = Number(url.searchParams.get('range') ?? '30');
	return REPORT_RANGES.includes(requested) ? requested : 30;
}

function getReportSince(days: number) {
	const since = new Date();
	since.setHours(0, 0, 0, 0);
	since.setDate(since.getDate() - (days - 1));
	return since;
}

function buildClickWhere(sourceId: number | null, reportSinceIso: string) {
	const clauses: SQL[] = [sql`${clickEvents.createdAt} >= ${reportSinceIso}::timestamptz`];
	if (sourceId) clauses.push(eq(clickEvents.sourceId, sourceId));
	return clauses;
}

function getClicksOverTime(sourceId: number | null, days: number) {
	const firstDay = getReportSince(days).toISOString();
	return db.execute<{ day: string; clickCount: string | number; uniqueClickCount: string | number }>(sql`
		WITH days AS (
			SELECT generate_series(
				${firstDay}::timestamptz,
				date_trunc('day', now()),
				interval '1 day'
			)::date AS day
		)
		SELECT
			days.day::text AS day,
			count(ce.id) AS "clickCount",
			count(ce.id) FILTER (WHERE ce.is_unique = true) AS "uniqueClickCount"
		FROM days
		LEFT JOIN click_events ce ON ce.created_at >= days.day
			AND ce.created_at < days.day + interval '1 day'
			${sourceId ? sql`AND ce.source_id = ${sourceId}` : sql``}
		GROUP BY days.day
		ORDER BY days.day ASC
	`);
}

function getTrafficSourceCase() {
	return sql`
		CASE
			WHEN nullif(trim(coalesce(${clickEvents.referrer}, '')), '') IS NULL THEN 'Közvetlen / ismeretlen'
			WHEN ${clickEvents.referrer} ILIKE '%/kereses%' THEN 'Keresés'
			WHEN ${clickEvents.referrer} ILIKE '%/konyvjelzok%' THEN 'Könyvjelzők'
			WHEN ${clickEvents.referrer} ILIKE '%/top%' THEN 'Toplista'
			WHEN ${clickEvents.referrer} ILIKE '%/rovat/%' THEN 'Rovat oldal'
			WHEN ${clickEvents.referrer} ~ '/[^/?#]+/[^/?#]+/?(\\?|#|$)' THEN 'Forrás + rovat oldal'
			WHEN ${clickEvents.referrer} ~ '/[^/?#]+/?(\\?|#|$)' THEN 'Forrás oldal'
			ELSE 'Egyéb referrer'
		END
	`;
}

function buildCommercialSummary(
	sourceState: {
		partnerPackage: string;
		partnerStatus: string;
		exchangeStatus: string;
		trafficTarget: number;
	},
	clickCount: number
) {
	const progress = getTrafficTargetProgress(sourceState.trafficTarget, clickCount);

	return {
		partnerPackage: sourceState.partnerPackage,
		partnerStatus: sourceState.partnerStatus,
		exchangeStatus: sourceState.exchangeStatus,
		trafficTarget: progress.target,
		targetClickCount: progress.clickCount,
		targetRemaining: progress.remaining,
		targetProgressPercent: progress.progressPercent,
		hasTrafficTarget: progress.hasTarget
	};
}

function formatDayLabel(day: string) {
	return new Intl.DateTimeFormat('hu-HU', {
		month: 'short',
		day: 'numeric'
	}).format(new Date(`${day}T00:00:00.000Z`));
}

function partnerInputError(validation: ValidationFailure) {
	if (validation.fieldErrors.urlPattern) {
		return validation.fieldErrors.urlPattern === 'URL minta szükséges.'
			? validation.fieldErrors.urlPattern
			: 'Adj meg érvényes URL mintát, például pelda.hu/rovat/*.';
	}
	if (
		validation.fieldErrors.utmSource ||
		validation.fieldErrors.utmMedium ||
		validation.fieldErrors.utmCampaign
	) {
		return 'Az UTM mezők csak betűket, számokat, pontot, aláhúzást, kötőjelet és hullámjelet tartalmazhatnak, és legfeljebb 120 karakteresek lehetnek.';
	}
	if (
		validation.fieldErrors.maxCpc ||
		validation.fieldErrors.dailySpendCap ||
		validation.fieldErrors.boostRouteTargets ||
		validation.fieldErrors.boostStatus
	) {
		return 'Adj meg érvényes boost beállításokat: állapot, legalább egy felület, nem negatív max CPC és napi limit.';
	}
	if (validation.fieldErrors.amount || validation.fieldErrors.billingName || validation.fieldErrors.billingEmail) {
		return 'Adj meg érvényes wallet feltöltési adatokat: pozitív összeg, számlázási név és email.';
	}

	return validation.summary || 'Érvényes partner adatok szükségesek.';
}

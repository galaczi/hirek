import { error, fail, type Actions } from '@sveltejs/kit';
import { and, eq, ne, or, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { DEFAULT_PARTNER_STATUS, getApprovedCommercialDefaults } from '$lib/source-commercial';
import { serializeSurfaceTargets } from '$lib/source-acquisition';
import { requireAdmin } from '$lib/server/admin/auth';
import { upsertSourceCategoryRule, deleteSourceCategoryRule } from '$lib/server/categorization/url-rules';
import { isUniqueViolation } from '$lib/server/db/errors';
import { db } from '$lib/server/db';
import { categories, sourceCategoryRules, sourceFeeds, sources } from '$lib/server/db/schema';
import {
	getApprovedSourceStatus,
	getSourceApprovalContext,
	isApprovedSource
} from '$lib/server/sources/approval';
import {
	normalizeDomain,
	normalizeFeedUrl,
	normalizeSlug,
	normalizeSourceName,
	normalizeUrlPattern,
	validateFeedInput,
	validateSourceAcquisitionInput,
	validateSourceCommercialInput,
	validateSourceIdentityInput,
	validateUrlPatternInput,
	type ValidationFailure
} from '$lib/server/validation/input';

const SOURCE_STATUSES = ['ingesting', 'needs_rss', 'needs_adapter', 'blocked', 'pending', 'disabled'];
const FEED_STATUSES = ['active', 'error', 'inactive'];

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const sourceId = parseSourceId(event.params.sourceId);
	const lastErrorExpr = sql<string | null>`(array_remove(array_agg(${sourceFeeds.lastError} ORDER BY ${sourceFeeds.updatedAt} DESC), NULL))[1]`;

	const [sourceRows, categoryRows, ruleRows, feedRows] = await Promise.all([
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
				totalFeedCount: sql<number>`count(${sourceFeeds.id})::int`,
				activeFeedCount: sql<number>`count(${sourceFeeds.id}) FILTER (WHERE ${sourceFeeds.status} = 'active')::int`,
				lastFetchedAt: sql<Date | string | null>`max(${sourceFeeds.lastFetchedAt})`,
				lastError: lastErrorExpr
			})
			.from(sources)
			.leftJoin(sourceFeeds, eq(sourceFeeds.sourceId, sources.id))
			.where(eq(sources.id, sourceId))
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
				sources.exchangeStatus,
				sources.trafficTarget
				,
				sources.trustScore,
				sources.boostStatus,
				sources.boostRouteTargets,
				sources.walletBalance,
				sources.exchangeCreditBalance,
				sources.maxCpc,
				sources.dailySpendCap,
				sources.lifetimeBillableClicks,
				sources.lifetimeWalletSpend,
				sources.lifetimeExchangeSpend
			)
			.limit(1),
		db.select({ id: categories.id, slug: categories.slug, name: categories.name }).from(categories).orderBy(categories.name),
		db
			.select({
				id: sourceCategoryRules.id,
				urlPattern: sourceCategoryRules.urlPattern,
				categoryName: categories.name,
				categorySlug: categories.slug
			})
			.from(sourceCategoryRules)
			.innerJoin(categories, eq(categories.id, sourceCategoryRules.categoryId))
			.where(eq(sourceCategoryRules.sourceId, sourceId))
			.orderBy(sourceCategoryRules.urlPattern),
		db
			.select({
				id: sourceFeeds.id,
				feedUrl: sourceFeeds.feedUrl,
				status: sourceFeeds.status,
				categoryId: sourceFeeds.categoryId,
				lastFetchedAt: sourceFeeds.lastFetchedAt,
				lastError: sourceFeeds.lastError
			})
			.from(sourceFeeds)
			.where(eq(sourceFeeds.sourceId, sourceId))
			.orderBy(sourceFeeds.feedUrl)
	]);

	const source = sourceRows.at(0);
	if (!source) error(404, 'Forrás nem található');

	return {
		sourceStatuses: SOURCE_STATUSES,
		feedStatuses: FEED_STATUSES,
		categories: categoryRows,
		selectedSource: {
			id: source.id,
			slug: source.slug,
			name: source.name,
			domain: source.domain,
			approvalStatus: source.approvalStatus,
			status: source.status,
			statusNote: source.statusNote,
			partnerPackage: source.partnerPackage,
			partnerStatus: source.partnerStatus,
			exchangeStatus: source.exchangeStatus,
			trafficTarget: Number(source.trafficTarget),
			trustScore: Number(source.trustScore),
			boostStatus: source.boostStatus,
			boostRouteTargets: source.boostRouteTargets,
			walletBalance: Number(source.walletBalance),
			exchangeCreditBalance: Number(source.exchangeCreditBalance),
			maxCpc: Number(source.maxCpc),
			dailySpendCap: Number(source.dailySpendCap),
			lifetimeBillableClicks: Number(source.lifetimeBillableClicks),
			lifetimeWalletSpend: Number(source.lifetimeWalletSpend),
			lifetimeExchangeSpend: Number(source.lifetimeExchangeSpend),
			totalFeedCount: Number(source.totalFeedCount),
			activeFeedCount: Number(source.activeFeedCount),
			canConfigure: source.approvalStatus === 'approved',
			lastFetchedAt: source.lastFetchedAt ? toIsoString(source.lastFetchedAt) : null,
			lastError: source.lastError
		},
		selectedRules: ruleRows,
		selectedFeeds: feedRows.map((feed) => ({
			...feed,
			lastFetchedAt: feed.lastFetchedAt ? toIsoString(feed.lastFetchedAt) : null
		}))
	};
};

export const actions: Actions = {
	updateSourceDetails: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);
		const form = await event.request.formData();
		const name = normalizeSourceName(form.get('name'));
		const slug = normalizeSlug(form.get('slug'));
		const domain = normalizeDomain(form.get('domain'));

		const validation = validateSourceIdentityInput({ name, slug, domain });
		if (!validation.ok) {
			return fail(400, { action: 'updateSourceDetails', error: sourceDetailError(validation) });
		}

		const normalized = validation.data;
		const [conflict] = await db
			.select({ id: sources.id, slug: sources.slug, domain: sources.domain })
			.from(sources)
			.where(
				and(
					ne(sources.id, sourceId),
					or(eq(sources.slug, normalized.slug), eq(sources.domain, normalized.domain))
				)
			)
			.limit(1);

		if (conflict?.slug === normalized.slug) {
			return fail(400, { action: 'updateSourceDetails', error: 'Ez a slug már foglalt.' });
		}
		if (conflict?.domain === normalized.domain) {
			return fail(400, {
				action: 'updateSourceDetails',
				error: 'Ehhez a domainhez már tartozik másik forrás.'
			});
		}

		try {
			await db
				.update(sources)
				.set({
					name: normalized.name,
					slug: normalized.slug,
					domain: normalized.domain,
					updatedAt: new Date()
				})
				.where(eq(sources.id, sourceId));
		} catch (error) {
			if (isUniqueViolation(error, 'sources_slug_idx')) {
				return fail(400, { action: 'updateSourceDetails', error: 'Ez a slug már foglalt.' });
			}
			if (isUniqueViolation(error, 'sources_domain_idx')) {
				return fail(400, {
					action: 'updateSourceDetails',
					error: 'Ehhez a domainhez már tartozik másik forrás.'
				});
			}

			throw error;
		}

		return { ok: true, action: 'updateSourceDetails' };
	},
	updateSourceStatus: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);
		const form = await event.request.formData();
		const status = String(form.get('status') ?? '');
		const statusNote = String(form.get('statusNote') ?? '').trim() || null;

		if (!SOURCE_STATUSES.includes(status)) {
			return fail(400, { action: 'updateSourceStatus', error: 'Érvénytelen állapot.' });
		}

		await db
			.update(sources)
			.set({ status, statusNote, updatedAt: new Date() })
			.where(eq(sources.id, sourceId));

		return { ok: true, action: 'updateSourceStatus' };
	},
	updateSourceCommercial: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);
		const source = await getSourceApprovalContext(sourceId);
		const form = await event.request.formData();
		const validation = validateSourceCommercialInput({
			partnerPackage: form.get('partnerPackage'),
			partnerStatus: form.get('partnerStatus'),
			exchangeStatus: form.get('exchangeStatus'),
			trafficTarget: form.get('trafficTarget'),
			approvalStatus: source.approvalStatus
		});

		if (!validation.ok) {
			return fail(400, {
				action: 'updateSourceCommercial',
				error: sourceDetailError(validation)
			});
		}

		await db
			.update(sources)
			.set({
				partnerPackage: validation.data.partnerPackage,
				partnerStatus: validation.data.partnerStatus,
				exchangeStatus: validation.data.exchangeStatus,
				trafficTarget: validation.data.trafficTarget,
				updatedAt: new Date()
			})
			.where(eq(sources.id, sourceId));

		return { ok: true, action: 'updateSourceCommercial' };
	},
	updateSourceAcquisition: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);
		const source = await getSourceApprovalContext(sourceId);
		const form = await event.request.formData();
		const validation = validateSourceAcquisitionInput({
			trustScore: form.get('trustScore'),
			boostStatus: form.get('boostStatus'),
			boostRouteTargets: form.getAll('boostRouteTargets'),
			maxCpc: form.get('maxCpc'),
			dailySpendCap: form.get('dailySpendCap'),
			exchangeCreditBalance: form.get('exchangeCreditBalance'),
			approvalStatus: source.approvalStatus
		});

		if (!validation.ok) {
			return fail(400, { action: 'updateSourceAcquisition', error: sourceDetailError(validation) });
		}

		await db
			.update(sources)
			.set({
				trustScore: validation.data.trustScore,
				boostStatus: validation.data.boostStatus,
				boostRouteTargets: serializeSurfaceTargets(validation.data.boostRouteTargets),
				maxCpc: validation.data.maxCpc,
				dailySpendCap: validation.data.dailySpendCap,
				exchangeCreditBalance: validation.data.exchangeCreditBalance,
				updatedAt: new Date()
			})
			.where(eq(sources.id, sourceId));

		return { ok: true, action: 'updateSourceAcquisition' };
	},
	approveSource: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);
		const source = await getSourceApprovalContext(sourceId);
		const approvedCommercial = getApprovedCommercialDefaults(source);

		await db
			.update(sources)
			.set({
				approvalStatus: 'approved',
				status: getApprovedSourceStatus(source.status, source.activeFeedCount),
				partnerPackage: approvedCommercial.partnerPackage,
				partnerStatus: approvedCommercial.partnerStatus,
				exchangeStatus: approvedCommercial.exchangeStatus,
				trafficTarget: approvedCommercial.trafficTarget,
				updatedAt: new Date()
			})
			.where(eq(sources.id, sourceId));

		return { ok: true, action: 'approveSource' };
	},
	rejectSource: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);
		const source = await getSourceApprovalContext(sourceId);

		await db
			.update(sources)
			.set({
				approvalStatus: 'rejected',
				partnerStatus: DEFAULT_PARTNER_STATUS,
				exchangeStatus: source.exchangeStatus === 'active' ? 'eligible' : source.exchangeStatus,
				updatedAt: new Date()
			})
			.where(eq(sources.id, sourceId));

		return { ok: true, action: 'rejectSource' };
	},
	addFeed: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);
		const source = await getSourceApprovalContext(sourceId);
		const form = await event.request.formData();
		const feedUrl = normalizeFeedUrl(form.get('feedUrl'));
		const categoryId = parseOptionalId(form.get('categoryId'));

		const validation = validateFeedInput({ feedUrl });
		if (!validation.ok) {
			return fail(400, { action: 'addFeed', error: sourceDetailError(validation) });
		}
		if (!isApprovedSource(source.approvalStatus)) {
			return fail(409, { action: 'addFeed', error: 'A forrás jóváhagyása szükséges ehhez a művelethez.' });
		}

		await db
			.insert(sourceFeeds)
			.values({
				sourceId,
				feedUrl: validation.data.feedUrl,
				categoryId,
				status: 'active',
				updatedAt: new Date()
			})
			.onConflictDoUpdate({
				target: sourceFeeds.feedUrl,
				set: { sourceId, categoryId, status: 'active', updatedAt: new Date() }
			});

		return { ok: true, action: 'addFeed' };
	},
	updateFeed: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);
		const source = await getSourceApprovalContext(sourceId);
		const form = await event.request.formData();
		const feedId = Number(form.get('feedId'));
		const status = String(form.get('status') ?? '');
		const categoryId = parseOptionalId(form.get('categoryId'));
		const lastError = String(form.get('lastError') ?? '').trim() || null;

		if (!Number.isInteger(feedId) || !FEED_STATUSES.includes(status)) {
			return fail(400, { action: 'updateFeed', error: 'Érvénytelen feed.' });
		}
		if (!isApprovedSource(source.approvalStatus)) {
			return fail(409, { action: 'updateFeed', error: 'A forrás jóváhagyása szükséges ehhez a művelethez.' });
		}

		await db
			.update(sourceFeeds)
			.set({ status, categoryId, lastError, updatedAt: new Date() })
			.where(and(eq(sourceFeeds.id, feedId), eq(sourceFeeds.sourceId, sourceId)));

		return { ok: true, action: 'updateFeed' };
	},
	addRule: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);
		const source = await getSourceApprovalContext(sourceId);
		const form = await event.request.formData();
		const categoryId = Number(form.get('categoryId'));
		const urlPattern = normalizeUrlPattern(form.get('urlPattern'));

		const validation = validateUrlPatternInput({ urlPattern });
		if (!Number.isInteger(categoryId)) {
			return fail(400, { action: 'addRule', error: 'Rovat és URL minta szükséges.' });
		}
		if (!validation.ok) {
			return fail(400, { action: 'addRule', error: sourceDetailError(validation) });
		}
		if (!isApprovedSource(source.approvalStatus)) {
			return fail(409, { action: 'addRule', error: 'A forrás jóváhagyása szükséges ehhez a művelethez.' });
		}

		await upsertSourceCategoryRule({ sourceId, categoryId, urlPattern: validation.data.urlPattern });
		return { ok: true, action: 'addRule' };
	},
	deleteRule: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);
		const source = await getSourceApprovalContext(sourceId);
		const form = await event.request.formData();
		const ruleId = Number(form.get('ruleId'));

		if (!Number.isInteger(ruleId)) {
			return fail(400, { action: 'deleteRule', error: 'Érvénytelen szabály.' });
		}
		if (!isApprovedSource(source.approvalStatus)) {
			return fail(409, { action: 'deleteRule', error: 'A forrás jóváhagyása szükséges ehhez a művelethez.' });
		}

		await deleteSourceCategoryRule(sourceId, ruleId);
		return { ok: true, action: 'deleteRule' };
	}
};

function parseSourceId(value: string | undefined) {
	const sourceId = Number(value);
	if (!Number.isInteger(sourceId) || sourceId < 1) error(404, 'Forrás nem található');
	return sourceId;
}

function parseOptionalId(value: FormDataEntryValue | null) {
	const raw = String(value ?? '').trim();
	if (!raw || raw === 'none') return null;
	const id = Number(raw);
	return Number.isInteger(id) ? id : null;
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function sourceDetailError(validation: ValidationFailure) {
	if (validation.fieldErrors.slug) {
		return validation.fieldErrors.slug === 'Slug szükséges.'
			? validation.fieldErrors.slug
			: 'A slug csak kisbetűket, számokat és kötőjeleket tartalmazhat.';
	}
	if (validation.fieldErrors.domain) {
		return validation.fieldErrors.domain === 'Domain szükséges.'
			? validation.fieldErrors.domain
			: 'Adj meg érvényes domain nevet, például pelda.hu.';
	}
	if (validation.fieldErrors.feedUrl) {
		return validation.fieldErrors.feedUrl === 'Feed URL szükséges.'
			? validation.fieldErrors.feedUrl
			: 'Adj meg érvényes HTTP vagy HTTPS feed URL-t.';
	}
	if (validation.fieldErrors.urlPattern) {
		return validation.fieldErrors.urlPattern === 'URL minta szükséges.'
			? validation.fieldErrors.urlPattern
			: 'Adj meg érvényes URL mintát, például pelda.hu/rovat/*.';
	}
	if (validation.fieldErrors.name) {
		return 'A forrás neve nem lehet üres vagy túl hosszú.';
	}
	if (validation.fieldErrors.partnerPackage) {
		return validation.fieldErrors.partnerPackage;
	}
	if (validation.fieldErrors.partnerStatus) {
		return validation.fieldErrors.partnerStatus;
	}
	if (validation.fieldErrors.exchangeStatus) {
		return validation.fieldErrors.exchangeStatus;
	}
	if (validation.fieldErrors.trafficTarget) {
		return validation.fieldErrors.trafficTarget;
	}

	return validation.summary || 'Érvényes forrásadatok szükségesek.';
}

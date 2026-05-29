import { error, fail, type Actions } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
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
	validateSourceIdentityInput,
	validateUrlPatternInput,
	type ValidationFailure
} from '$lib/server/validation/input';

type SourceDetailRow = {
	id: number;
	slug: string;
	name: string;
	domain: string;
	approval_status: string;
	status: string;
	status_note: string | null;
	total_feed_count: string | number;
	active_feed_count: string | number;
	last_fetched_at: Date | string | null;
	last_error: string | null;
};

const SOURCE_STATUSES = ['ingesting', 'needs_rss', 'needs_adapter', 'blocked', 'pending', 'disabled'];
const FEED_STATUSES = ['active', 'error', 'inactive'];

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const sourceId = parseSourceId(event.params.sourceId);

	const [sourceRows, categoryRows, ruleRows, feedRows] = await Promise.all([
		db.execute<SourceDetailRow>(sql`
			SELECT
				s.id,
				s.slug,
				s.name,
				s.domain,
				s.approval_status,
				s.status,
				s.status_note,
				count(sf.id) AS total_feed_count,
				count(sf.id) FILTER (WHERE sf.status = 'active') AS active_feed_count,
				max(sf.last_fetched_at) AS last_fetched_at,
				(
					array_remove(array_agg(sf.last_error ORDER BY sf.updated_at DESC), NULL)
				)[1] AS last_error
			FROM sources s
			LEFT JOIN source_feeds sf ON sf.source_id = s.id
			WHERE s.id = ${sourceId}
			GROUP BY s.id
			LIMIT 1
		`),
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
			approvalStatus: source.approval_status,
			status: source.status,
			statusNote: source.status_note,
			totalFeedCount: Number(source.total_feed_count),
			activeFeedCount: Number(source.active_feed_count),
			canConfigure: source.approval_status === 'approved',
			lastFetchedAt: source.last_fetched_at ? toIsoString(source.last_fetched_at) : null,
			lastError: source.last_error
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
		const [conflict] = await db.execute<{ id: number; slug: string; domain: string }>(sql`
			SELECT id, slug, domain
			FROM sources
			WHERE id <> ${sourceId}
				AND (slug = ${normalized.slug} OR domain = ${normalized.domain})
			LIMIT 1
		`);

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
	approveSource: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);
		const source = await getSourceApprovalContext(sourceId);

		await db
			.update(sources)
			.set({
				approvalStatus: 'approved',
				status: getApprovedSourceStatus(source.status, source.activeFeedCount),
				updatedAt: new Date()
			})
			.where(eq(sources.id, sourceId));

		return { ok: true, action: 'approveSource' };
	},
	rejectSource: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);

		await db
			.update(sources)
			.set({
				approvalStatus: 'rejected',
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

	return validation.summary || 'Érvényes forrásadatok szükségesek.';
}

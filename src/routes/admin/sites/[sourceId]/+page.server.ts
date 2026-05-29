import { error, fail, type Actions } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/admin/auth';
import { upsertSourceCategoryRule, deleteSourceCategoryRule } from '$lib/server/categorization/url-rules';
import { db } from '$lib/server/db';
import { categories, sourceCategoryRules, sourceFeeds, sources } from '$lib/server/db/schema';

type SourceDetailRow = {
	id: number;
	slug: string;
	name: string;
	domain: string;
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
			status: source.status,
			statusNote: source.status_note,
			totalFeedCount: Number(source.total_feed_count),
			activeFeedCount: Number(source.active_feed_count),
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
		const name = String(form.get('name') ?? '').trim();
		const slug = String(form.get('slug') ?? '').trim();
		const domain = normalizeDomain(form.get('domain'));

		if (!name || !slug || !domain) {
			return fail(400, { action: 'updateSourceDetails', error: 'Név, slug és domain szükséges.' });
		}

		await db
			.update(sources)
			.set({ name, slug, domain, updatedAt: new Date() })
			.where(eq(sources.id, sourceId));

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
	addFeed: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);
		const form = await event.request.formData();
		const feedUrl = String(form.get('feedUrl') ?? '').trim();
		const categoryId = parseOptionalId(form.get('categoryId'));

		if (!feedUrl) return fail(400, { action: 'addFeed', error: 'Feed URL szükséges.' });

		await db
			.insert(sourceFeeds)
			.values({ sourceId, feedUrl, categoryId, status: 'active', updatedAt: new Date() })
			.onConflictDoUpdate({
				target: sourceFeeds.feedUrl,
				set: { sourceId, categoryId, status: 'active', updatedAt: new Date() }
			});

		return { ok: true, action: 'addFeed' };
	},
	updateFeed: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);
		const form = await event.request.formData();
		const feedId = Number(form.get('feedId'));
		const status = String(form.get('status') ?? '');
		const categoryId = parseOptionalId(form.get('categoryId'));
		const lastError = String(form.get('lastError') ?? '').trim() || null;

		if (!Number.isInteger(feedId) || !FEED_STATUSES.includes(status)) {
			return fail(400, { action: 'updateFeed', error: 'Érvénytelen feed.' });
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
		const form = await event.request.formData();
		const categoryId = Number(form.get('categoryId'));
		const urlPattern = String(form.get('urlPattern') ?? '');

		if (!Number.isInteger(categoryId) || !urlPattern.trim()) {
			return fail(400, { action: 'addRule', error: 'Rovat és URL minta szükséges.' });
		}

		await upsertSourceCategoryRule({ sourceId, categoryId, urlPattern });
		return { ok: true, action: 'addRule' };
	},
	deleteRule: async (event) => {
		requireAdmin(event);
		const sourceId = parseSourceId(event.params.sourceId);
		const form = await event.request.formData();
		const ruleId = Number(form.get('ruleId'));

		if (!Number.isInteger(ruleId)) {
			return fail(400, { action: 'deleteRule', error: 'Érvénytelen szabály.' });
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

function normalizeDomain(value: FormDataEntryValue | null) {
	return String(value ?? '').trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

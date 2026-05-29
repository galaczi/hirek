import { redirect } from '@sveltejs/kit';
import { and, eq, ne, sql, type SQL } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/admin/auth';
import { isUniqueViolation } from '$lib/server/db/errors';
import { db } from '$lib/server/db';
import { sourceFeeds, sources } from '$lib/server/db/schema';
import {
	normalizeDomain,
	normalizeSlug,
	normalizeSourceName,
	validateAdminSourceCreateInput,
	type ValidationFailure
} from '$lib/server/validation/input';

type SourceRow = {
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

type SourceFilters = {
	q: string;
	status: string;
};

const PAGE_SIZE = 30;

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const filters = parseFilters(event.url);
	const page = parsePage(event.url.searchParams.get('page'));
	const where = buildWhere(filters);
	const offset = (page - 1) * PAGE_SIZE;

	const [sourceRows, totalRows, statusRows] = await Promise.all([
		db.execute<SourceRow>(sql`
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
			${where ? sql`WHERE ${where}` : sql``}
			GROUP BY s.id
			ORDER BY s.name ASC
			LIMIT ${PAGE_SIZE}
			OFFSET ${offset}
		`),
		db.execute<{ count: string | number }>(sql`
			SELECT count(*) AS count
			FROM sources s
			${where ? sql`WHERE ${where}` : sql``}
		`),
		db
			.selectDistinct({ status: sources.status })
			.from(sources)
			.orderBy(sources.status)
	]);
	const total = Number(totalRows.at(0)?.count ?? 0);

	return {
		filters,
		statuses: statusRows.map((row) => row.status),
		sources: sourceRows.map((row) => ({
			id: row.id,
			slug: row.slug,
			name: row.name,
			domain: row.domain,
			status: row.status,
			statusNote: row.status_note,
			totalFeedCount: Number(row.total_feed_count),
			activeFeedCount: Number(row.active_feed_count),
			lastFetchedAt: row.last_fetched_at ? toIsoString(row.last_fetched_at) : null,
			lastError: row.last_error
		})),
		pagination: {
			page,
			pageSize: PAGE_SIZE,
			total,
			totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE))
		}
	};
};

export const actions: Actions = {
	addSource: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const name = normalizeSourceName(form.get('name'));
		const slug = normalizeSlug(form.get('slug'));
		const domain = normalizeDomain(form.get('domain'));
		const feedUrl = String(form.get('feedUrl') ?? '').trim();

		const validation = validateAdminSourceCreateInput({ name, slug, domain, feedUrl });
		if (!validation.ok) {
			return { ok: false, action: 'addSource', error: sourceActionError(validation) };
		}

		const normalized = validation.data;
		const [existingDomain] = await db
			.select({ id: sources.id, slug: sources.slug })
			.from(sources)
			.where(and(eq(sources.domain, normalized.domain), ne(sources.slug, normalized.slug)))
			.limit(1);

		if (existingDomain) {
			return {
				ok: false,
				action: 'addSource',
				error: 'Ehhez a domainhez már tartozik másik forrás.'
			};
		}

		let source;

		try {
			[source] = await db
				.insert(sources)
				.values({
					name: normalized.name,
					slug: normalized.slug,
					domain: normalized.domain,
					approvalStatus: 'approved',
					status: 'ingesting',
					updatedAt: new Date()
				})
				.onConflictDoUpdate({
					target: sources.slug,
					set: {
						name: normalized.name,
						domain: normalized.domain,
						approvalStatus: 'approved',
						status: 'ingesting',
						updatedAt: new Date()
					}
				})
				.returning({ id: sources.id });

			await db
				.insert(sourceFeeds)
				.values({
					sourceId: source.id,
					feedUrl: normalized.feedUrl,
					status: 'active',
					updatedAt: new Date()
				})
				.onConflictDoUpdate({
					target: sourceFeeds.feedUrl,
					set: { sourceId: source.id, status: 'active', updatedAt: new Date() }
				});
		} catch (error) {
			if (isUniqueViolation(error, 'sources_slug_idx')) {
				return { ok: false, action: 'addSource', error: 'Ez a slug már foglalt.' };
			}
			if (isUniqueViolation(error, 'sources_domain_idx')) {
				return { ok: false, action: 'addSource', error: 'Ehhez a domainhez már tartozik forrás.' };
			}

			throw error;
		}

		redirect(303, `/admin/sites/${source.id}/`);
	}
};

function parseFilters(url: URL): SourceFilters {
	return {
		q: url.searchParams.get('q')?.trim() ?? '',
		status: cleanFilter(url.searchParams.get('status'))
	};
}

function cleanFilter(value: string | null) {
	const clean = value?.trim() ?? '';
	return clean === 'all' ? '' : clean;
}

function parsePage(value: string | null) {
	const page = Number(value);
	return Number.isInteger(page) && page > 0 ? page : 1;
}

function buildWhere(filters: SourceFilters) {
	const clauses: SQL[] = [];

	if (filters.q) {
		const like = `%${filters.q}%`;
		clauses.push(sql`(
			s.name ILIKE ${like}
			OR s.domain ILIKE ${like}
			OR s.slug ILIKE ${like}
			OR s.status_note ILIKE ${like}
		)`);
	}

	if (filters.status) clauses.push(sql`s.status = ${filters.status}`);

	return clauses.length > 0 ? sql.join(clauses, sql` AND `) : null;
}

function sourceActionError(validation: ValidationFailure) {
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
	if (validation.fieldErrors.name) {
		return 'A forrás neve nem lehet üres vagy túl hosszú.';
	}

	return validation.summary || 'Érvényes forrásadatok szükségesek.';
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

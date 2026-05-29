import { redirect } from '@sveltejs/kit';
import { and, asc, eq, ilike, ne, or, sql, type SQL } from 'drizzle-orm';
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
	const lastErrorExpr = sql<string | null>`(array_remove(array_agg(${sourceFeeds.lastError} ORDER BY ${sourceFeeds.updatedAt} DESC), NULL))[1]`;

	const [sourceRows, totalRows, statusRows] = await Promise.all([
		db
			.select({
				id: sources.id,
				slug: sources.slug,
				name: sources.name,
				domain: sources.domain,
				status: sources.status,
				statusNote: sources.statusNote,
				totalFeedCount: sql<number>`count(${sourceFeeds.id})::int`,
				activeFeedCount: sql<number>`count(${sourceFeeds.id}) FILTER (WHERE ${sourceFeeds.status} = 'active')::int`,
				lastFetchedAt: sql<Date | string | null>`max(${sourceFeeds.lastFetchedAt})`,
				lastError: lastErrorExpr
			})
			.from(sources)
			.leftJoin(sourceFeeds, eq(sourceFeeds.sourceId, sources.id))
			.where(where)
			.groupBy(sources.id, sources.slug, sources.name, sources.domain, sources.status, sources.statusNote)
			.orderBy(asc(sources.name))
			.limit(PAGE_SIZE)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(sources)
			.where(where),
		db
			.selectDistinct({ status: sources.status })
			.from(sources)
			.orderBy(asc(sources.status))
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
			statusNote: row.statusNote,
			totalFeedCount: Number(row.totalFeedCount),
			activeFeedCount: Number(row.activeFeedCount),
			lastFetchedAt: row.lastFetchedAt ? toIsoString(row.lastFetchedAt) : null,
			lastError: row.lastError
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
		clauses.push(
			or(
				ilike(sources.name, like),
				ilike(sources.domain, like),
				ilike(sources.slug, like),
				ilike(sources.statusNote, like)
			)!
		);
	}

	if (filters.status) clauses.push(eq(sources.status, filters.status));

	return clauses.length > 0 ? and(...clauses) : undefined;
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

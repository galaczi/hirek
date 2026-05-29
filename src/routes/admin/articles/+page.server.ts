import { fail, redirect, type Actions } from '@sveltejs/kit';
import { and, asc, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { getArticleSearchDocuments } from '$lib/server/articles/search-documents';
import { requireAdmin } from '$lib/server/admin/auth';
import { db } from '$lib/server/db';
import { articleCategories, articles, categories, sources } from '$lib/server/db/schema';
import { deleteArticlesFromIndex, indexArticles } from '$lib/server/search/meili';

type ArticleFilters = {
	q: string;
	source: string;
	category: string;
	status: string;
};

const PAGE_SIZE = 50;
const sortKeys = new Set(['publishedAt', 'title', 'sourceName', 'categoryName', 'clickScore', 'status']);
const sortDirections = new Set(['asc', 'desc']);

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const filters = parseFilters(event.url);
	const page = parsePage(event.url.searchParams.get('page'));
	const sort = parseSort(event.url);
	const where = buildWhere(filters);
	const offset = (page - 1) * PAGE_SIZE;
	const categoryNameExpr = sql<string | null>`(array_remove(array_agg(DISTINCT ${categories.name}), NULL))[1]`;

	const [moderationArticles, totalRows, sourceOptions, categoryOptions] = await Promise.all([
		db
			.select({
				id: articles.id,
				title: articles.title,
				sourceName: sources.name,
				categoryName: categoryNameExpr,
				publishedAt: articles.publishedAt,
				active: articles.active,
				clickScore: articles.clickScore
			})
			.from(articles)
			.innerJoin(sources, eq(sources.id, articles.sourceId))
			.leftJoin(articleCategories, eq(articleCategories.articleId, articles.id))
			.leftJoin(categories, eq(categories.id, articleCategories.categoryId))
			.where(where)
			.groupBy(
				articles.id,
				articles.title,
				articles.publishedAt,
				articles.active,
				articles.clickScore,
				sources.id,
				sources.name
			)
			.orderBy(...getOrderBy(sort.key, sort.direction, categoryNameExpr), desc(articles.id))
			.limit(PAGE_SIZE)
			.offset(offset),
		db
			.select({
				count: sql<number>`count(DISTINCT ${articles.id})::int`
			})
			.from(articles)
			.innerJoin(sources, eq(sources.id, articles.sourceId))
			.leftJoin(articleCategories, eq(articleCategories.articleId, articles.id))
			.leftJoin(categories, eq(categories.id, articleCategories.categoryId))
			.where(where),
		db
			.select({ slug: sources.slug, name: sources.name })
			.from(sources)
			.where(sql`${sources.status} != 'disabled'`)
			.orderBy(asc(sources.name)),
		db.select({ slug: categories.slug, name: categories.name }).from(categories).orderBy(asc(categories.name))
	]);
	const total = Number(totalRows.at(0)?.count ?? 0);

	return {
		filters,
		sort,
		pagination: {
			page,
			pageSize: PAGE_SIZE,
			total,
			totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE))
		},
		sources: sourceOptions,
		categories: categoryOptions,
		moderationArticles: moderationArticles.map((row) => ({
			id: row.id,
			title: row.title,
			sourceName: row.sourceName,
			categoryName: row.categoryName ?? 'Egyéb',
			publishedAt: toIsoString(row.publishedAt),
			active: row.active,
			clickScore: row.clickScore
		}))
	};
};

export const actions: Actions = {
	moderateArticle: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const articleId = Number(form.get('articleId'));
		const active = String(form.get('active')) === 'true';
		const returnTo = getSafeReturnTo(form.get('returnTo'));

		if (!Number.isInteger(articleId)) return fail(400, { error: 'Érvénytelen cikk.' });

		const [article] = await db
			.update(articles)
			.set({ active, updatedAt: new Date() })
			.where(eq(articles.id, articleId))
			.returning({ id: articles.id });

		if (!article) return fail(404, { error: 'A cikk nem található.' });

		if (active) {
			await indexArticles(await getArticleSearchDocuments([article.id]));
		} else {
			await deleteArticlesFromIndex([article.id]);
		}

		redirect(303, returnTo);
	}
};

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseFilters(url: URL): ArticleFilters {
	return {
		q: url.searchParams.get('q')?.trim() ?? '',
		source: cleanFilter(url.searchParams.get('source')),
		category: cleanFilter(url.searchParams.get('category')),
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

function parseSort(url: URL) {
	const key = url.searchParams.get('sort') ?? 'publishedAt';
	const direction = url.searchParams.get('dir') ?? 'desc';

	return {
		key: sortKeys.has(key) ? key : 'publishedAt',
		direction: sortDirections.has(direction) ? direction : 'desc'
	};
}

function buildWhere(filters: ArticleFilters) {
	const clauses: SQL[] = [];

	if (filters.q) {
		const like = `%${filters.q}%`;
		clauses.push(
			or(
				ilike(articles.title, like),
				ilike(articles.canonicalUrl, like),
				ilike(sources.name, like),
				ilike(categories.name, like),
				sql`${articles.id}::text = ${filters.q}`
			)!
		);
	}

	if (filters.source) clauses.push(eq(sources.slug, filters.source));
	if (filters.category) clauses.push(eq(categories.slug, filters.category));
	if (filters.status === 'active') clauses.push(eq(articles.active, true));
	if (filters.status === 'hidden') clauses.push(eq(articles.active, false));

	return clauses.length > 0 ? and(...clauses) : undefined;
}

function getOrderBy(key: string, direction: string, categoryNameExpr: SQL) {
	const isDesc = direction === 'desc';

	if (key === 'title') return [isDesc ? desc(articles.title) : asc(articles.title)];
	if (key === 'sourceName') return [isDesc ? desc(sources.name) : asc(sources.name)];
	if (key === 'categoryName') {
		return [isDesc ? sql`${categoryNameExpr} DESC NULLS LAST` : sql`${categoryNameExpr} ASC NULLS LAST`];
	}
	if (key === 'clickScore') return [isDesc ? desc(articles.clickScore) : asc(articles.clickScore)];
	if (key === 'status') return [isDesc ? desc(articles.active) : asc(articles.active)];

	return [isDesc ? desc(articles.publishedAt) : asc(articles.publishedAt)];
}

function getSafeReturnTo(value: FormDataEntryValue | null) {
	const returnTo = String(value ?? '/admin/articles');
	return returnTo.startsWith('/admin/articles') ? returnTo : '/admin/articles';
}

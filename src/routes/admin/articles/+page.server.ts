import { fail, redirect, type Actions } from '@sveltejs/kit';
import { eq, sql, type SQL } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { getArticleSearchDocuments } from '$lib/server/articles/search-documents';
import { requireAdmin } from '$lib/server/admin/auth';
import { db } from '$lib/server/db';
import { articles } from '$lib/server/db/schema';
import { deleteArticlesFromIndex, indexArticles } from '$lib/server/search/meili';

type ModerationArticleRow = {
	id: number;
	title: string;
	source_name: string;
	category_name: string | null;
	published_at: Date | string;
	active: boolean;
	click_score: number;
};

type SourceFilterRow = {
	slug: string;
	name: string;
};

type CategoryFilterRow = {
	slug: string;
	name: string;
};

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

	const [moderationArticles, totalRows, sources, categories] = await Promise.all([
		db.execute<ModerationArticleRow>(sql`
		SELECT
			a.id,
			a.title,
			s.name AS source_name,
			(array_remove(array_agg(DISTINCT c.name), NULL))[1] AS category_name,
			a.published_at,
			a.active,
			a.click_score
		FROM articles a
		INNER JOIN sources s ON s.id = a.source_id
		LEFT JOIN article_categories ac ON ac.article_id = a.id
		LEFT JOIN categories c ON c.id = ac.category_id
		${where ? sql`WHERE ${where}` : sql``}
		GROUP BY a.id, s.id
		ORDER BY ${getOrderBy(sort.key, sort.direction)}, a.id DESC
		LIMIT ${PAGE_SIZE}
		OFFSET ${offset}
	`),
		db.execute<{ count: string | number }>(sql`
		SELECT count(DISTINCT a.id) AS count
		FROM articles a
		INNER JOIN sources s ON s.id = a.source_id
		LEFT JOIN article_categories ac ON ac.article_id = a.id
		LEFT JOIN categories c ON c.id = ac.category_id
		${where ? sql`WHERE ${where}` : sql``}
	`),
		db.execute<SourceFilterRow>(sql`
		SELECT slug, name
		FROM sources
		WHERE status != 'disabled'
		ORDER BY name ASC
	`),
		db.execute<CategoryFilterRow>(sql`
		SELECT slug, name
		FROM categories
		ORDER BY name ASC
	`)
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
		sources,
		categories,
		moderationArticles: moderationArticles.map((row) => ({
			id: row.id,
			title: row.title,
			sourceName: row.source_name,
			categoryName: row.category_name ?? 'Egyéb',
			publishedAt: toIsoString(row.published_at),
			active: row.active,
			clickScore: row.click_score
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
		clauses.push(sql`(
			a.title ILIKE ${like}
			OR a.canonical_url ILIKE ${like}
			OR s.name ILIKE ${like}
			OR c.name ILIKE ${like}
			OR a.id::text = ${filters.q}
		)`);
	}

	if (filters.source) clauses.push(sql`s.slug = ${filters.source}`);
	if (filters.category) clauses.push(sql`c.slug = ${filters.category}`);
	if (filters.status === 'active') clauses.push(sql`a.active = true`);
	if (filters.status === 'hidden') clauses.push(sql`a.active = false`);

	return clauses.length > 0 ? sql.join(clauses, sql` AND `) : null;
}

function getOrderBy(key: string, direction: string) {
	const desc = direction === 'desc';

	if (key === 'title') return desc ? sql`a.title DESC` : sql`a.title ASC`;
	if (key === 'sourceName') return desc ? sql`s.name DESC` : sql`s.name ASC`;
	if (key === 'categoryName') return desc ? sql`category_name DESC NULLS LAST` : sql`category_name ASC NULLS LAST`;
	if (key === 'clickScore') return desc ? sql`a.click_score DESC` : sql`a.click_score ASC`;
	if (key === 'status') return desc ? sql`a.active DESC` : sql`a.active ASC`;

	return desc ? sql`a.published_at DESC` : sql`a.published_at ASC`;
}

function getSafeReturnTo(value: FormDataEntryValue | null) {
	const returnTo = String(value ?? '/admin/articles');
	return returnTo.startsWith('/admin/articles') ? returnTo : '/admin/articles';
}

import { error, redirect } from '@sveltejs/kit';
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { articleCategories, articles, categories, sources } from '$lib/server/db/schema';
import type { Article, Category, Publisher } from '$lib/home/data';
import { getCategoryBySlug, getSourceBySlug } from '$lib/server/articles/list';
import { searchArticles } from '$lib/server/search';
import type { SearchFilters, SearchResponse, SearchResult } from '$lib/server/search/types';

type CategoryRow = Category & {
	count: string | number;
};

type SourceRow = Publisher;

type HomeFilters = {
	category?: string;
	source?: string;
	time?: Extract<SearchFilters['time'], '4h' | '12h' | '24h' | '7d'>;
};

const fallbackCategories: Category[] = [{ slug: 'all', name: 'Összes hír' }];
const timeFilters = new Set(['4h', '12h', '24h', '7d']);
const HOMEPAGE_LOAD_ERROR = 'A hírek betöltése most nem sikerült. Kérlek, próbáld újra pár pillanat múlva.';

export const load: LayoutServerLoad = async ({ params, url }) => {
	const isSearchRoute = url.pathname.startsWith('/kereses');
	redirectLegacyHomeFilters(url, isSearchRoute);

	const q = url.searchParams.get('q')?.trim() ?? '';
	const routeFilters = isSearchRoute ? getSearchRouteFilters(url) : await getRouteFilters(params, url);
	const filters = { ...parseQueryFilters(url), ...routeFilters };
	const canonicalPath = isSearchRoute ? '/kereses/' : buildHomePath(filters);
	const todayLabel = new Intl.DateTimeFormat('hu-HU', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		weekday: 'long'
	}).format(new Date());

	try {
		const shouldSearch = Boolean(q || filters.category || filters.source || filters.time);
		const [streamRows, topRows, categoryRows, sourceRows, totalRows, search] = await Promise.all([
			getArticles('fresh', 80, filters),
			getArticles('top', 24),
			getCategories(),
			getSources(),
			getTotalArticles(),
			shouldSearch
				? searchArticles({ q, ...filters, limit: 80, offset: 0 })
				: Promise.resolve(null)
		]);
		const searchResponse = search as SearchResponse | null;

		return {
			todayLabel,
			articles: streamRows.map(toArticle),
			streamArticles: searchResponse
				? searchResponse.results.map(toArticleFromSearchResult)
				: streamRows.map(toArticle),
			topArticles: topRows.map(toArticle),
			categories: [
				{ slug: 'all', name: 'Összes hír', count: Number(totalRows.at(0)?.count ?? 0) },
				...categoryRows.map((category) => ({ ...category, count: Number(category.count) }))
			],
			publishers: sourceRows,
			searchQuery: q,
			searchTotal: searchResponse?.total ?? null,
			searchEngine: searchResponse?.engine ?? null,
			searchError: searchResponse?.error ?? null,
			activeCategory: filters.category ?? 'all',
			activePublisher: filters.source ?? 'all',
			activeTimeFilter: filters.time ?? 'all',
			canonicalPath,
			loadError: null
		};
	} catch (loadError) {
		console.error('Homepage load failed:', loadError);

		return {
			todayLabel,
			articles: [],
			streamArticles: [],
			topArticles: [],
			categories: fallbackCategories.map((category) => ({ ...category, count: 0 })),
			publishers: [],
			searchQuery: q,
			searchTotal: null,
			searchEngine: null,
			searchError: null,
			activeCategory: filters.category ?? 'all',
			activePublisher: filters.source ?? 'all',
			activeTimeFilter: filters.time ?? 'all',
			canonicalPath,
			loadError: HOMEPAGE_LOAD_ERROR
		};
	}
};

async function getRouteFilters(params: Partial<Record<string, string>>, url: URL): Promise<HomeFilters> {
	if (url.pathname.startsWith('/rovat/')) {
		const category = await getCategoryBySlug(params.category ?? '');
		if (!category) error(404, 'Rovat nem található');
		return { category: category.slug };
	}

	if (params.source) {
		const source = await getSourceBySlug(params.source);
		if (!source) error(404, 'Forrás nem található');

		if (!params.category) return { source: source.slug };

		const category = await getCategoryBySlug(params.category);
		if (!category) error(404, 'Rovat nem található');
		return { source: source.slug, category: category.slug };
	}

	return {};
}

function redirectLegacyHomeFilters(url: URL, isSearchRoute: boolean) {
	if (isSearchRoute) return;
	const source = cleanFilter(url.searchParams.get('source'));
	const category = cleanFilter(url.searchParams.get('category'));
	if (!source && !category) return;

	const params = new URLSearchParams(url.searchParams);
	params.delete('source');
	params.delete('category');
	const query = params.toString();
	redirect(308, `${buildHomePath({ source, category })}${query ? `?${query}` : ''}`);
}

function buildHomePath(filters: Pick<HomeFilters, 'category' | 'source'>) {
	if (filters.source && filters.category) return `/${filters.source}/${filters.category}/`;
	if (filters.source) return `/${filters.source}/`;
	if (filters.category) return `/rovat/${filters.category}/`;
	return '/';
}

function getSearchRouteFilters(url: URL): HomeFilters {
	return {
		source: cleanFilter(url.searchParams.get('source')),
		category: cleanFilter(url.searchParams.get('category'))
	};
}

function parseQueryFilters(url: URL): HomeFilters {
	const rawTime = url.searchParams.get('time');
	const time = timeFilters.has(rawTime ?? '')
		? (rawTime as HomeFilters['time'])
		: undefined;

	return { time };
}

function cleanFilter(value: string | null) {
	const clean = value?.trim();
	return clean && clean !== 'all' ? clean : undefined;
}

async function getArticles(orderBy: 'fresh' | 'top', limit: number, filters: HomeFilters = {}) {
	const conditions = [eq(articles.active, true)];
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

	const since = getTimeBoundary(filters.time);
	if (since) conditions.push(sql`${articles.publishedAt} >= ${since.toISOString()}::timestamptz`);

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
			clickScore: articles.clickScore
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
		.orderBy(
			...(orderBy === 'top'
				? [desc(articles.clickScore), desc(articles.publishedAt)]
				: [desc(articles.publishedAt), desc(articles.clickScore)])
		)
		.limit(limit);
}

function getTimeBoundary(time: HomeFilters['time']) {
	if (!time) return null;

	const hours = {
		'4h': 4,
		'12h': 12,
		'24h': 24,
		'7d': 24 * 7
	}[time];

	return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function getCategories() {
	return db
		.select({
			slug: categories.slug,
			name: categories.name,
			count: sql<number>`count(${articles.id})::int`
		})
		.from(categories)
		.leftJoin(articleCategories, eq(articleCategories.categoryId, categories.id))
		.leftJoin(articles, and(eq(articles.id, articleCategories.articleId), eq(articles.active, true)))
		.groupBy(categories.id, categories.slug, categories.name)
		.orderBy(asc(categories.name));
}

async function getSources() {
	return db
		.select({
			slug: sources.slug,
			name: sources.name,
			host: sources.domain
		})
		.from(sources)
		.where(ne(sources.status, 'disabled'))
		.orderBy(asc(sources.name));
}

async function getTotalArticles() {
	return db
		.select({
			count: sql<number>`count(*)::int`
		})
		.from(articles)
		.where(eq(articles.active, true));
}

function toArticle(row: {
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
}): Article {
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
		clicks: row.clickScore
	};
}

function toArticleFromSearchResult(result: SearchResult): Article {
	const categorySlug = result.categorySlugs.at(0) ?? 'uncategorized';

	return {
		id: result.id,
		title: result.title,
		excerpt: result.excerpt,
		category: categorySlug,
		categoryName: categorySlug,
		categorySlugs: result.categorySlugs,
		source: result.sourceSlug,
		sourceName: result.sourceName,
		publishedAt: result.publishedAt,
		clicks: result.clickScore
	};
}

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

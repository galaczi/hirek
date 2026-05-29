import { error, redirect } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import type { Article, Category, Publisher } from '$lib/home/data';
import { getCategoryBySlug, getSourceBySlug } from '$lib/server/articles/list';
import { searchArticles } from '$lib/server/search';
import type { SearchFilters, SearchResponse, SearchResult } from '$lib/server/search/types';

type ArticleRow = {
	id: number;
	title: string;
	source_slug: string;
	source_name: string;
	category_slug: string | null;
	category_name: string | null;
	category_slugs: string[];
	published_at: Date | string;
	click_score: number;
};

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
			getArticles('published_at DESC, click_score DESC', 80, filters),
			getArticles('click_score DESC, published_at DESC', 24),
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

async function getArticles(orderBy: string, limit: number, filters: HomeFilters = {}) {
	const where = [sql`a.active = true`];
	if (filters.source) where.push(sql`s.slug = ${filters.source}`);
	if (filters.category) {
		where.push(sql`EXISTS (
			SELECT 1
			FROM article_categories ac_filter
			INNER JOIN categories c_filter ON c_filter.id = ac_filter.category_id
			WHERE ac_filter.article_id = a.id
				AND c_filter.slug = ${filters.category}
		)`);
	}

	const since = getTimeBoundary(filters.time);
	if (since) where.push(sql`a.published_at >= ${since.toISOString()}::timestamptz`);

	return db.execute<ArticleRow>(sql`
		SELECT
			a.id,
			a.title,
			s.slug AS source_slug,
			s.name AS source_name,
			(
				array_remove(array_agg(DISTINCT c.slug), NULL)
			)[1] AS category_slug,
			(
				array_remove(array_agg(DISTINCT c.name), NULL)
			)[1] AS category_name,
			array_remove(array_agg(DISTINCT c.slug), NULL) AS category_slugs,
			a.published_at,
			a.click_score
		FROM articles a
		INNER JOIN sources s ON s.id = a.source_id
		LEFT JOIN article_categories ac ON ac.article_id = a.id
		LEFT JOIN categories c ON c.id = ac.category_id
		WHERE ${sql.join(where, sql` AND `)}
		GROUP BY a.id, s.id
		ORDER BY ${sql.raw(orderBy)}
		LIMIT ${limit}
	`);
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
	return db.execute<CategoryRow>(sql`
		SELECT c.slug, c.name, count(a.id) AS count
		FROM categories c
		LEFT JOIN article_categories ac ON ac.category_id = c.id
		LEFT JOIN articles a ON a.id = ac.article_id AND a.active = true
		GROUP BY c.id
		ORDER BY c.name ASC
	`);
}

async function getSources() {
	return db.execute<SourceRow>(sql`
		SELECT slug, name, domain AS host
		FROM sources
		WHERE status != 'disabled'
		ORDER BY name ASC
	`);
}

async function getTotalArticles() {
	return db.execute<{ count: string | number }>(sql`
		SELECT count(*) AS count
		FROM articles
		WHERE active = true
	`);
}

function toArticle(row: ArticleRow): Article {
	return {
		id: row.id,
		title: row.title,
		category: row.category_slug ?? 'uncategorized',
		categoryName: row.category_name ?? 'Egyéb',
		categorySlugs: row.category_slugs ?? [],
		source: row.source_slug,
		sourceName: row.source_name,
		publishedAt: toIsoString(row.published_at),
		clicks: row.click_score
	};
}

function toArticleFromSearchResult(result: SearchResult): Article {
	const categorySlug = result.categorySlugs.at(0) ?? 'uncategorized';

	return {
		id: result.id,
		title: result.title,
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

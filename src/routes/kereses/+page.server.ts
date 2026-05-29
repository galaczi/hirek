import type { PageServerLoad } from './$types';
import { searchArticles } from '$lib/server/search';
import type { SearchFilters } from '$lib/server/search/types';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;
const TIME_FILTERS = new Set(['4h', '12h', '24h', '7d']);

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const category = cleanParam(url.searchParams.get('category'));
	const source = cleanParam(url.searchParams.get('source'));
	const rawTime = url.searchParams.get('time');
	const time = TIME_FILTERS.has(rawTime ?? '') ? (rawTime as SearchFilters['time']) : undefined;
	const limit = clampNumber(url.searchParams.get('limit'), DEFAULT_LIMIT, MAX_LIMIT);
	const page = Math.max(clampNumber(url.searchParams.get('page'), 1, 500), 1);

	const hasSearch = q || category || source || time;
	const search = hasSearch
		? await searchArticles({
				q,
				category,
				source,
				time,
				limit,
				offset: (page - 1) * limit
			})
		: { results: [], total: 0, engine: 'meilisearch' as const };

	return {
		q,
		category,
		source,
		time,
		limit,
		page,
		search
	};
};

function cleanParam(value: string | null) {
	const clean = value?.trim();
	return clean ? clean : undefined;
}

function clampNumber(value: string | null, fallback: number, max: number) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 1) return fallback;
	return Math.min(Math.floor(parsed), max);
}

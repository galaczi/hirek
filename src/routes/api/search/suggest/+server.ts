import { json } from '@sveltejs/kit';
import { searchArticles } from '$lib/server/search';

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 10;

export const GET = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const limit = clampNumber(url.searchParams.get('limit'), DEFAULT_LIMIT, MAX_LIMIT);

	if (q.length < 2) {
		return json({ q, suggestions: [], total: 0, engine: 'meilisearch' });
	}

	const search = await searchArticles({ q, limit, offset: 0 });

	return json({
		q,
		suggestions: search.results.map((article) => ({
			id: article.id,
			title: article.title,
			sourceName: article.sourceName,
			publishedAt: article.publishedAt,
			highlightTitle: article._highlight?.title
		})),
		total: search.total,
		engine: search.engine,
		error: search.error
	});
};

function clampNumber(value: string | null, fallback: number, max: number) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 1) return fallback;
	return Math.min(Math.floor(parsed), max);
}

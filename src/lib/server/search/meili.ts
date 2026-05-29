import { Meilisearch } from 'meilisearch';
import { env } from '$env/dynamic/private';
import type { ArticleSearchDocument, SearchFilters, SearchResponse } from './types';

const ARTICLES_INDEX = env.MEILI_ARTICLES_INDEX ?? 'articles';

function getClient() {
	return new Meilisearch({
		host: env.MEILI_HOST ?? 'http://127.0.0.1:7700',
		apiKey: env.MEILI_API_KEY
	});
}

export async function configureArticleIndex() {
	const index = getClient().index(ARTICLES_INDEX);

	await index.updateSettings({
		searchableAttributes: ['title', 'excerpt', 'sourceName'],
		filterableAttributes: ['categorySlugs', 'sourceSlug', 'publishedAt'],
		sortableAttributes: ['publishedAt', 'clickScore'],
		displayedAttributes: [
			'id',
			'title',
			'excerpt',
			'sourceName',
			'sourceSlug',
			'categorySlugs',
			'publishedAt',
			'urlHost',
			'clickScore'
		],
		rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness']
	});
}

export async function indexArticles(documents: ArticleSearchDocument[]) {
	if (documents.length === 0) return;

	const index = getClient().index<ArticleSearchDocument>(ARTICLES_INDEX);
	await index.addDocuments(documents, { primaryKey: 'id' });
}

export async function deleteArticlesFromIndex(ids: number[]) {
	if (ids.length === 0) return;

	const index = getClient().index(ARTICLES_INDEX);
	await index.deleteDocuments(ids);
}

export async function searchWithMeili(filters: SearchFilters): Promise<SearchResponse> {
	const index = getClient().index<ArticleSearchDocument>(ARTICLES_INDEX);
	const filter = buildMeiliFilter(filters);

	const response = await index.search(filters.q, {
		filter,
		limit: filters.limit,
		offset: filters.offset,
		sort: ['publishedAt:desc', 'clickScore:desc'],
		attributesToHighlight: ['title', 'excerpt', 'sourceName'],
		highlightPreTag: '<mark>',
		highlightPostTag: '</mark>'
	});

	return {
		results: response.hits.map((hit) => ({
			id: hit.id,
			title: hit.title,
			excerpt: hit.excerpt,
			sourceName: hit.sourceName,
			sourceSlug: hit.sourceSlug,
			categorySlugs: hit.categorySlugs,
			publishedAt: hit.publishedAt,
			urlHost: hit.urlHost,
			clickScore: hit.clickScore,
			_highlight: hit._formatted as Record<string, string> | undefined
		})),
		total: response.estimatedTotalHits ?? response.hits.length,
		engine: 'meilisearch'
	};
}

function buildMeiliFilter(filters: SearchFilters) {
	const parts: string[] = [];

	if (filters.category) parts.push(`categorySlugs = ${JSON.stringify(filters.category)}`);
	if (filters.source) parts.push(`sourceSlug = ${JSON.stringify(filters.source)}`);

	const since = getTimeBoundary(filters.time);
	if (since) parts.push(`publishedAt >= ${JSON.stringify(since.toISOString())}`);

	return parts.length > 0 ? parts.join(' AND ') : undefined;
}

function getTimeBoundary(time: SearchFilters['time']) {
	if (!time) return null;

	const hours = {
		'4h': 4,
		'12h': 12,
		'24h': 24,
		'7d': 24 * 7
	}[time];

	return new Date(Date.now() - hours * 60 * 60 * 1000);
}

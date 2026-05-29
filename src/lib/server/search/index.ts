import { searchWithMeili } from './meili';
import { searchWithPostgres } from './postgres';
import type { SearchFilters, SearchResponse } from './types';

export async function searchArticles(filters: SearchFilters): Promise<SearchResponse> {
	try {
		return await searchWithMeili(filters);
	} catch (error) {
		console.error('Meilisearch failed; using Postgres fallback:', error);
		const fallback = await searchWithPostgres(filters);
		return {
			...fallback,
			error: 'A kereső átmenetileg tartalék módra váltott.'
		};
	}
}

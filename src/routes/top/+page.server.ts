import type { PageServerLoad } from './$types';
import { getArticleList } from '$lib/server/articles/list';

export const load: PageServerLoad = async () => {
	return {
		articles: await getArticleList({ order: 'top', limit: 50 })
	};
};

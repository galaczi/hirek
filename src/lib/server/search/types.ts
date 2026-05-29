export type ArticleSearchDocument = {
	id: number;
	title: string;
	excerpt: string | null;
	sourceName: string;
	sourceSlug: string;
	categorySlugs: string[];
	publishedAt: string;
	urlHost: string;
	clickScore: number;
};

export type SearchFilters = {
	q: string;
	category?: string;
	source?: string;
	time?: '4h' | '12h' | '24h' | '7d';
	limit: number;
	offset: number;
};

export type SearchResult = {
	id: number;
	title: string;
	excerpt: string | null;
	sourceName: string;
	sourceSlug: string;
	categorySlugs: string[];
	publishedAt: string;
	urlHost: string;
	clickScore: number;
	_highlight?: Record<string, string>;
};

export type SearchResponse = {
	results: SearchResult[];
	total: number;
	engine: 'meilisearch' | 'postgres';
	error?: string;
};

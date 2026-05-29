export const seedCategories = [
	{ slug: 'minden', name: 'Minden' },
	{ slug: 'egyeb', name: 'Egyéb' },
	{ slug: 'belfold', name: 'Belföld' },
	{ slug: 'kulfold', name: 'Külföld' },
	{ slug: 'gazdasag', name: 'Gazdaság' },
	{ slug: 'tech', name: 'Tech' },
	{ slug: 'sport', name: 'Sport' },
	{ slug: 'bulvar', name: 'Bulvár' },
	{ slug: 'eletmod', name: 'Életmód' },
	{ slug: 'auto', name: 'Autó' }
];

export const seedFeeds = [
	{
		source: { slug: 'telex', name: 'Telex', domain: 'telex.hu' },
		feedUrl: 'https://telex.hu/rss',
		categorySlug: 'minden'
	},
	{
		source: { slug: '24-hu', name: '24.hu', domain: '24.hu' },
		feedUrl: 'https://24.hu/feed/',
		categorySlug: 'minden'
	},
	{
		source: { slug: 'hvg', name: 'HVG', domain: 'hvg.hu' },
		feedUrl: 'https://hvg.hu/rss',
		categorySlug: 'minden'
	},
	{
		source: { slug: 'index', name: 'Index', domain: 'index.hu' },
		feedUrl: 'https://index.hu/24ora/rss/',
		categorySlug: 'minden'
	},
	{
		source: { slug: 'portfolio', name: 'Portfolio', domain: 'portfolio.hu' },
		feedUrl: 'https://www.portfolio.hu/rss/all.xml',
		categorySlug: 'gazdasag'
	}
];

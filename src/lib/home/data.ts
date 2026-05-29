export type Category = {
	slug: string;
	name: string;
};

export type Publisher = {
	slug: string;
	name: string;
	host: string;
};

export type Article = {
	id: number;
	title: string;
	category: string;
	categoryName: string;
	categorySlugs: string[];
	source: string;
	sourceName: string;
	publishedAt: string;
	clicks: number;
};

export type Weather = {
	temp: number;
	desc: string;
	wind: string;
	icon: 'sunny' | 'cloudy' | 'rainy';
};

export const weatherData: Record<string, Weather> = {
	Budapest: { temp: 24, desc: 'Napos', wind: '12 km/h', icon: 'sunny' },
	Debrecen: { temp: 22, desc: 'Enyhén felhős', wind: '9 km/h', icon: 'cloudy' },
	Szeged: { temp: 26, desc: 'Derült', wind: '10 km/h', icon: 'sunny' },
	Pécs: { temp: 23, desc: 'Gomolyfelhők', wind: '14 km/h', icon: 'cloudy' },
	Győr: { temp: 21, desc: 'Zápor', wind: '18 km/h', icon: 'rainy' }
};

export const exchangeRates = [
	{ code: 'EUR', name: 'Euró', icon: '€', value: '396,42 Ft', change: '+0,12%', direction: 'up' },
	{ code: 'USD', name: 'USA Dollár', icon: '$', value: '364,18 Ft', change: '-0,08%', direction: 'down' },
	{ code: 'CHF', name: 'Svájci frank', icon: 'Fr', value: '402,15 Ft', change: '+0,24%', direction: 'up' },
	{ code: 'BTC', name: 'Bitcoin', icon: '₿', value: '68 450 $', change: '+1,45%', direction: 'up' }
];

export const horoscopeTexts = {
	kos: 'Ma tele vagy energiával. Olyan feladatokba is bátran belevághatsz, amelyeket korábban halogattál.',
	bika: 'Fontos pénzügyi döntés előtt állsz, de ne siess el semmit. Egy beszélgetés új irányt nyithat.',
	ikrek: 'A kommunikációs készséged ma különösen erős. Könnyen elsimíthatsz egy vitás helyzetet.',
	rak: 'Befelé figyelőbb napod lehet, ami tökéletes alkalom tervezésre és feltöltődésre.',
	oroszlan: 'A figyelem középpontjába kerülhetsz. Egy jó ötleted ma gyors támogatást kaphat.',
	szuz: 'Rendkívül produktív nap áll előtted. A részletekre fordított figyelem most sokat ér.',
	merleg: 'Törekedj harmóniára a kapcsolataidban. Egy félreértés ma könnyen tisztázható.',
	skorpio: 'Nagy felismerések napja. Ami régóta nyomasztott, végre kezelhetőbbé válhat.',
	nyilas: 'Kalandvágyad másokra is átragad. Utazás vagy tanulás tervezésére jó nap.',
	bak: 'Kitartásod meghozza a gyümölcsét. Dolgozz fókuszáltan, este viszont pihenj rendesen.',
	vizonto: 'Kreativitásod ma szárnyal. Egyedi megoldással lepheted meg a környezeted.',
	halak: 'Intuíciód erős. Könnyen észreveszed, mi marad kimondatlanul egy beszélgetésben.'
};

export const timeFilters = [
	{ value: 'all', label: 'Összes' },
	{ value: '4h', label: '4 óra' },
	{ value: '12h', label: '12 óra' },
	{ value: '24h', label: '24 óra' },
	{ value: '7d', label: '7 nap' }
];

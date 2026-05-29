type CategorizationInput = {
	title: string;
	excerpt: string | null;
	url: string;
	fallbackSlug?: string | null;
};

const pathRules: Array<[string[], string]> = [
	[['global', 'world', 'kulfold', 'nemzetkozi', 'europa'], 'kulfold'],
	[['belfold', 'kozelet', 'politika', 'valasztas'], 'belfold'],
	[['gazdasag', 'penz', 'uzlet', 'vallalat', 'ingatlan', 'befektetes', 'tozsde'], 'gazdasag'],
	[['tech', 'tudomany', 'digital', 'mobil'], 'tech'],
	[['sport', 'foci', 'forma-1'], 'sport'],
	[['bulvar', 'sztar', 'celeb'], 'bulvar'],
	[['eletmod', 'egeszseg', 'gasztro', 'utazas'], 'eletmod'],
	[['auto', 'jarmu', 'mobilitas'], 'auto']
];

const textRules: Array<[RegExp, string]> = [
	[/\b(nato|orosz|ukrajn|izrael|kína|usa|trump|zelenszkij|háború|katonai szövetség)\b/i, 'kulfold'],
	[/\b(kormány|fidesz|tisza|parlament|polgármester|köztársasági|választás)\b/i, 'belfold'],
	[/\b(forint|euró|tőzsde|bank|infláció|adó|árfolyam|ingatlan|befektetés|gazdaság)\b/i, 'gazdasag'],
	[/\b(ai|chip|telefon|szoftver|adat|kiber|openai|xiaomi|apple|google)\b/i, 'tech'],
	[/\b(foci|meccs|válogatott|bajnok|forma-1|tenisz|olimpia)\b/i, 'sport'],
	[/\b(sztár|celeb|énekes|színész|válás|párja)\b/i, 'bulvar'],
	[/\b(egészség|diéta|recept|utazás|lakberendezés|horoszkóp)\b/i, 'eletmod'],
	[/\b(autó|motor|tesztvezetés|elektromos autó)\b/i, 'auto']
];

export function inferCategorySlugs(input: CategorizationInput) {
	const urlSlugs = inferFromUrl(input.url);
	if (urlSlugs.length > 0) return urlSlugs;

	const text = `${input.title} ${input.excerpt ?? ''}`;
	for (const [pattern, slug] of textRules) {
		if (pattern.test(text)) return [slug];
	}

	return [input.fallbackSlug || 'minden'];
}

function inferFromUrl(value: string) {
	try {
		const pathParts = new URL(value).pathname.split('/').filter(Boolean).map(normalize);
		for (const [segments, slug] of pathRules) {
			if (pathParts.some((part) => segments.includes(part))) return [slug];
		}
	} catch {
		return [];
	}

	return [];
}

function normalize(value: string) {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

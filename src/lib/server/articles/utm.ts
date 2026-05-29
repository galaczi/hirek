export type TrackedUtm = {
	source: string;
	medium: string;
	campaign: string;
	content: string;
};

export type SourceUtmSettings = {
	utmSource?: string | null;
	utmMedium?: string | null;
	utmCampaign?: string | null;
};

export function getArticleUtm(articleId: number, settings: SourceUtmSettings = {}): TrackedUtm {
	return {
		source: cleanUtm(settings.utmSource, 'hirek.hu'),
		medium: cleanUtm(settings.utmMedium, 'referral'),
		campaign: cleanUtm(settings.utmCampaign, 'hirek_stream'),
		content: String(articleId)
	};
}

export function buildTrackedUrl(destination: string, articleId: number, settings: SourceUtmSettings = {}) {
	const url = new URL(destination);
	const utm = getArticleUtm(articleId, settings);

	setIfMissing(url, 'utm_source', utm.source);
	setIfMissing(url, 'utm_medium', utm.medium);
	setIfMissing(url, 'utm_campaign', utm.campaign);
	setIfMissing(url, 'utm_content', utm.content);

	return url.toString();
}

function cleanUtm(value: string | null | undefined, fallback: string) {
	const clean = value?.trim();
	return clean || fallback;
}

function setIfMissing(url: URL, key: string, value: string) {
	if (!url.searchParams.has(key)) url.searchParams.set(key, value);
}

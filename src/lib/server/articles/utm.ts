export function buildTrackedUrl(destination: string, articleId: number) {
	const url = new URL(destination);

	setIfMissing(url, 'utm_source', 'hirek.hu');
	setIfMissing(url, 'utm_medium', 'referral');
	setIfMissing(url, 'utm_campaign', 'hirek_stream');
	setIfMissing(url, 'utm_content', String(articleId));

	return url.toString();
}

function setIfMissing(url: URL, key: string, value: string) {
	if (!url.searchParams.has(key)) url.searchParams.set(key, value);
}

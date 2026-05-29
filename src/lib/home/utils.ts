import type { Article } from './data';

export function normalize(value: string) {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

export function matchesTimeFilter(article: Article, filter: string) {
	if (filter === 'all') return true;

	const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / 3_600_000;
	if (filter === '4h') return hoursAgo <= 4;
	if (filter === '12h') return hoursAgo <= 12;
	if (filter === '24h') return hoursAgo <= 24;
	if (filter === '7d') return hoursAgo <= 24 * 7;

	return true;
}

export function recencyClass(article: Article) {
	const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / 3_600_000;
	if (hoursAgo <= 1) return 'fresh';
	if (hoursAgo <= 4) return 'medium';
	return 'old';
}

export function formatTime(value: string) {
	const date = new Date(value);
	const now = new Date();
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');

	if (date.toDateString() === now.toDateString()) return `${hours}:${minutes}`;

	const yesterday = new Date(now.getTime() - 86_400_000);
	if (date.toDateString() === yesterday.toDateString()) return `Tegnap ${hours}:${minutes}`;

	return `${date.getMonth() + 1}.${date.getDate()}. ${hours}:${minutes}`;
}

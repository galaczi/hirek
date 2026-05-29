import { XMLParser } from 'fast-xml-parser';

export type FeedItem = {
	title: string;
	url: string;
	excerpt: string | null;
	publishedAt: Date;
};

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	textNodeName: '#text',
	cdataPropName: '#cdata',
	trimValues: true
});

export function parseFeed(xml: string): FeedItem[] {
	const parsed = parser.parse(xml);
	const rssItems = parsed?.rss?.channel?.item;
	const atomEntries = parsed?.feed?.entry;

	if (rssItems) return toArray(rssItems).map((item) => normalizeRssItem(asRecord(item))).filter(isFeedItem);
	if (atomEntries) return toArray(atomEntries).map((entry) => normalizeAtomEntry(asRecord(entry))).filter(isFeedItem);

	return [];
}

function normalizeRssItem(item: Record<string, unknown>): FeedItem | null {
	const title = text(item.title);
	const url = text(item.link) || text(item.guid);
	if (!title || !url) return null;

	return {
		title,
		url,
		excerpt: truncate(stripHtml(text(item.description) || text(item['content:encoded']))),
		publishedAt: parseDate(text(item.pubDate) || text(item['dc:date']) || text(item.updated))
	};
}

function normalizeAtomEntry(entry: Record<string, unknown>): FeedItem | null {
	const title = text(entry.title);
	const url = atomLink(entry.link);
	if (!title || !url) return null;

	return {
		title,
		url,
		excerpt: truncate(stripHtml(text(entry.summary) || text(entry.content))),
		publishedAt: parseDate(text(entry.published) || text(entry.updated))
	};
}

function atomLink(link: unknown) {
	const links = toArray(link);
	const alternate = links.find((item) => isRecord(item) && item['@_rel'] === 'alternate') ?? links[0];
	return isRecord(alternate) ? text(alternate['@_href'] ?? alternate) : text(alternate);
}

function text(value: unknown): string {
	if (value === undefined || value === null) return '';
	if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
	if (isRecord(value)) return text(value['#text'] ?? value['#cdata']);
	return '';
}

function parseDate(value: string) {
	const date = value ? new Date(value) : new Date();
	return Number.isNaN(date.getTime()) ? new Date() : date;
}

function stripHtml(value: string) {
	return value
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function truncate(value: string) {
	return value ? value.slice(0, 500) : null;
}

function toArray(value: unknown): unknown[] {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function asRecord(value: unknown): Record<string, unknown> {
	return isRecord(value) ? value : {};
}

function isFeedItem(value: FeedItem | null): value is FeedItem {
	return value !== null;
}

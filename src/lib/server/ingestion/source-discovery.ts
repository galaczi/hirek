import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { seedCategories } from './seed-data';
import { parseFeed } from './rss';

const discoveryPages = [
	{ url: 'https://www.hirkereso.hu/', categorySlug: 'minden' },
	{ url: 'https://www.hirkereso.hu/gazdasag/', categorySlug: 'gazdasag' },
	{ url: 'https://www.hirkereso.hu/tech/', categorySlug: 'tech' },
	{ url: 'https://www.hirkereso.hu/sport/', categorySlug: 'sport' },
	{ url: 'https://www.hirkereso.hu/bulvar/', categorySlug: 'bulvar' },
	{ url: 'https://www.hirkereso.hu/eletmod/', categorySlug: 'eletmod' },
	{ url: 'https://www.hirkereso.hu/auto/', categorySlug: 'auto' }
];

const knownDomains = new Map([
	['24.hu', '24.hu'],
	['24 - g', '24.hu'],
	['444', '444.hu'],
	['agroinform', 'agroinform.hu'],
	['blikk', 'blikk.hu'],
	['femcafe', 'femcafe.hu'],
	['femina', 'femina.hu'],
	['hvg', 'hvg.hu'],
	['index', 'index.hu'],
	['liner', 'liner.hu'],
	['mfor', 'mfor.hu'],
	['portfolio', 'portfolio.hu'],
	['telex', 'telex.hu']
]);

const displayNamesByDomain = new Map([
	['24.hu', '24.hu'],
	['index.hu', 'Index'],
	['portfolio.hu', 'Portfolio'],
	['telex.hu', 'Telex']
]);

type SourceCandidate = {
	name: string;
	slug: string;
	domain: string;
};

type DiscoveredSource = {
	name: string;
	slug: string;
	domain: string;
	categories: Set<string>;
	pages: Set<string>;
};

type FeedProbeResult = {
	sourceId: number;
	slug: string;
	name: string;
	domain: string;
	feedUrl: string | null;
	itemCount: number;
	error: string | null;
};

export async function discoverHirkeresoSources() {
	for (const category of seedCategories) {
		await db.execute(sql`
			INSERT INTO categories (slug, name)
			VALUES (${category.slug}, ${category.name})
			ON CONFLICT (slug) DO UPDATE SET name = excluded.name
		`);
	}

	const discovered = new Map<string, DiscoveredSource>();
	const pageErrors: { url: string; error: string }[] = [];

	for (const page of discoveryPages) {
		try {
			const response = await fetch(page.url, {
				headers: { 'user-agent': 'hirek.hu source discovery (+https://hirek.hu)' }
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);

			const html = await response.text();
			for (const candidate of extractSources(html)) {
				const slug = candidate.slug;
				if (!slug) continue;

				const current =
					discovered.get(slug) ??
					({
						name: candidate.name,
						slug,
						domain: candidate.domain,
						categories: new Set<string>(),
						pages: new Set<string>()
					} satisfies DiscoveredSource);

				current.categories.add(page.categorySlug);
				current.pages.add(page.url);
				discovered.set(slug, current);
			}
		} catch (error) {
			pageErrors.push({ url: page.url, error: error instanceof Error ? error.message : String(error) });
		}
	}

	if (discovered.size > 0) {
		await db.execute(sql`
			DELETE FROM sources s
			WHERE s.approval_status = 'approved'
				AND s.status = 'pending'
				AND NOT EXISTS (SELECT 1 FROM articles a WHERE a.source_id = s.id)
				AND NOT EXISTS (SELECT 1 FROM source_feeds sf WHERE sf.source_id = s.id)
		`);
	}

	for (const source of discovered.values()) {
		await db.execute(sql`
			INSERT INTO sources (slug, name, domain, approval_status, status, updated_at)
			VALUES (${source.slug}, ${source.name}, ${source.domain}, 'approved', 'pending', now())
			ON CONFLICT (slug) DO UPDATE SET
				name = excluded.name,
				domain = excluded.domain,
				updated_at = now()
		`);
	}

	return {
		count: discovered.size,
		pageErrors,
		sources: [...discovered.values()]
			.sort((first, second) => first.name.localeCompare(second.name, 'hu'))
			.map((source) => ({
				name: source.name,
				slug: source.slug,
				domain: source.domain,
				categories: [...source.categories],
				pages: [...source.pages]
			}))
	};
}

export async function discoverMissingSourceFeeds(limit = 20) {
	const rows = await db.execute<{
		id: number;
		slug: string;
		name: string;
		domain: string;
		status: string;
	}>(sql`
		SELECT s.id, s.slug, s.name, s.domain, s.status
		FROM sources s
		WHERE s.approval_status = 'approved'
			AND s.status IN ('needs_rss', 'pending')
			AND NOT EXISTS (
				SELECT 1
				FROM source_feeds sf
				WHERE sf.source_id = s.id
					AND sf.status = 'active'
			)
		ORDER BY s.name ASC
		LIMIT ${limit}
	`);

	const results: FeedProbeResult[] = [];
	for (const source of rows) {
		const result = await probeSourceFeed(source);
		results.push(result);

		if (result.feedUrl) {
			await db.execute(sql`
				INSERT INTO source_feeds (source_id, feed_url, status, last_error, updated_at)
				VALUES (${source.id}, ${result.feedUrl}, 'active', NULL, now())
				ON CONFLICT (feed_url) DO UPDATE SET
					source_id = excluded.source_id,
					status = 'active',
					last_error = NULL,
					updated_at = now()
			`);
			await db.execute(sql`
				UPDATE sources
				SET status = 'ingesting', status_note = NULL, updated_at = now()
				WHERE id = ${source.id}
			`);
		} else {
			await db.execute(sql`
				UPDATE sources
				SET
					status = 'needs_adapter',
					status_note = ${result.error ?? 'No RSS/Atom feed found at common endpoints.'},
					updated_at = now()
				WHERE id = ${source.id}
					AND approval_status = 'approved'
					AND status IN ('needs_rss', 'pending')
			`);
		}
	}

	return {
		checked: results.length,
		found: results.filter((result) => result.feedUrl).length,
		results
	};
}

async function probeSourceFeed(source: { id: number; slug: string; name: string; domain: string }) {
	let lastError: string | null = null;
	for (const url of candidateFeedUrls(source.domain)) {
		try {
			const response = await fetch(url, {
				headers: {
					'user-agent': 'hirek.hu feed discovery (+https://hirek.hu)',
					accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'
				},
				signal: AbortSignal.timeout(8000)
			});
			if (!response.ok) {
				lastError = `${url}: HTTP ${response.status}`;
				continue;
			}

			const xml = await response.text();
			const items = parseFeed(xml);
			if (items.length > 0) {
				return {
					sourceId: source.id,
					slug: source.slug,
					name: source.name,
					domain: source.domain,
					feedUrl: url,
					itemCount: items.length,
					error: null
				} satisfies FeedProbeResult;
			}
			lastError = `${url}: no feed items`;
		} catch (error) {
			lastError = `${url}: ${error instanceof Error ? error.message : String(error)}`;
		}
	}

	return {
		sourceId: source.id,
		slug: source.slug,
		name: source.name,
		domain: source.domain,
		feedUrl: null,
		itemCount: 0,
		error: lastError
	} satisfies FeedProbeResult;
}

function candidateFeedUrls(domain: string) {
	const hosts = Array.from(new Set([normalizeDomain(domain), `www.${normalizeDomain(domain)}`]));
	const paths = [
		'/rss',
		'/rss/',
		'/feed',
		'/feed/',
		'/rss.xml',
		'/feed.xml',
		'/atom.xml',
		'/index.xml'
	];
	return hosts.flatMap((host) => paths.map((path) => `https://${host}${path}`));
}

function extractSources(html: string) {
	const sources = new Map<string, SourceCandidate>();
	const itemPattern =
		/<li\b[\s\S]*?<a\b[^>]*href="([^"]*rd\.hirkereso\.hu[^"]*)"[^>]*>[\s\S]*?<\/a>\s*<span class="source">\s*<a\b[^>]*href="\/hirsiteok\/([^"/]+)\/"[^>]*>\(([^)<]{2,80})\)<\/a>/gi;

	for (const match of html.matchAll(itemPattern)) {
		const rdUrl = decodeEntities(match[1]);
		const sourcePathSlug = decodeEntities(match[2]).trim();
		const rawName = decodeEntities(match[3]).trim();
		const domain = getTargetDomain(rdUrl) ?? inferDomain(rawName);
		const name = normalizeSourceName(rawName, domain);
		const slug = slugFromSource(sourcePathSlug, name, domain);
		sources.set(slug, { name, slug, domain });
	}

	return sources.values();
}

function inferDomain(name: string) {
	const normalized = name.toLowerCase().trim();
	const knownDomain = knownDomains.get(normalized);
	if (knownDomain) return knownDomain;
	if (normalized.includes('.')) return normalized.replace(/\s+/g, '');
	return `${slugify(name)}.hu`;
}

function getTargetDomain(rdUrl: string) {
	try {
		const parsedUrl = new URL(rdUrl);
		const targetUrl = parsedUrl.searchParams.get('url');
		if (!targetUrl) return null;
		const target = new URL(targetUrl);
		return normalizeDomain(target.hostname);
	} catch {
		return null;
	}
}

function normalizeSourceName(name: string, domain: string) {
	return displayNamesByDomain.get(domain) ?? name;
}

function slugFromSource(sourcePathSlug: string, name: string, domain: string) {
	const existingSlug = slugify(normalizeSourceName(name, domain));
	if (existingSlug && !sourcePathSlug.includes('_')) return existingSlug;
	const hostBase = domain.replace(/^www\./, '').replace(/\.hu$/, '');
	if (/^\d/.test(hostBase)) return `${hostBase}-hu`;
	return slugify(hostBase || name);
}

function normalizeDomain(domain: string) {
	return domain.toLowerCase().replace(/^www\./, '');
}

function slugify(value: string) {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

function decodeEntities(value: string) {
	return value
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>');
}

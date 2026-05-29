import { and, count, desc, eq, gte, sql, type SQL } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { requirePartnerAccess } from '$lib/server/admin/auth';
import { db } from '$lib/server/db';
import {
	articleCategories,
	articleCategoryOverrides,
	articles,
	categories,
	clickEvents,
	sourceFeeds,
	sourceCategoryRules,
	sources
} from '$lib/server/db/schema';
import { getArticleSearchDocuments } from '$lib/server/articles/search-documents';
import { indexArticles } from '$lib/server/search/meili';
import { upsertSourceCategoryRule } from '$lib/server/categorization/url-rules';

type ClicksOverTimeRow = {
	day: string;
	click_count: string | number;
	unique_click_count: string | number;
};

type TopCategoryRow = {
	slug: string;
	name: string;
	click_count: string | number;
	unique_click_count: string | number;
};

type TrafficSourceRow = {
	label: string;
	click_count: string | number;
	unique_click_count: string | number;
};

type AvailableSourceRow = {
	id: number;
	slug: string;
	name: string;
	domain: string;
	status: string;
	article_count: string | number;
	click_count: string | number;
	unique_click_count: string | number;
	last_fetched_at: string | Date | null;
};

const REPORT_RANGES = [7, 30, 90];

export const load: PageServerLoad = async (event) => {
	const access = requirePartnerAccess(event);
	const scopedSourceId = access.sourceId;
	const reportDays = parseReportDays(event.url);
	const reportSince = getReportSince(reportDays);
	const reportSinceIso = reportSince.toISOString();

	if (access.isAdmin && !scopedSourceId) {
		const [availableSourceRows, categoryRows] = await Promise.all([
			db.execute<AvailableSourceRow>(sql`
				SELECT
					s.id,
					s.slug,
					s.name,
					s.domain,
					s.status,
					(
						SELECT count(*)::int
						FROM articles a
						WHERE a.source_id = s.id
							AND a.active = true
					) AS article_count,
					(
						SELECT count(*)::int
						FROM click_events ce
						WHERE ce.source_id = s.id
							AND ce.is_bot = false
							AND ce.created_at >= ${reportSinceIso}::timestamptz
					) AS click_count,
					(
						SELECT count(*)::int
						FROM click_events ce
						WHERE ce.source_id = s.id
							AND ce.is_bot = false
							AND ce.is_unique = true
							AND ce.created_at >= ${reportSinceIso}::timestamptz
					) AS unique_click_count,
					(
						SELECT max(sf.last_fetched_at)
						FROM source_feeds sf
						WHERE sf.source_id = s.id
					) AS last_fetched_at
				FROM sources s
				ORDER BY s.name ASC
			`),
			db.select({ slug: categories.slug, name: categories.name }).from(categories).orderBy(categories.name)
		]);

		return {
			sourceStats: [],
			topArticles: [],
			recentClicks: [],
			categories: categoryRows,
			partnerSourceId: null,
			isAdmin: true,
			reportDays,
			reportRanges: REPORT_RANGES,
			availableSources: availableSourceRows.map((row) => ({
				id: row.id,
				slug: row.slug,
				name: row.name,
				domain: row.domain,
				status: row.status,
				articleCount: Number(row.article_count),
				clickCount: Number(row.click_count),
				uniqueClickCount: Number(row.unique_click_count),
				lastFetchedAt: row.last_fetched_at ? toIsoString(row.last_fetched_at) : null
			})),
			sourceRules: [],
			feedHealth: [],
			sourceSettings: null,
			clicksOverTime: [],
			topCategories: [],
			trafficSources: []
		};
	}

	const sourceFilter = scopedSourceId ? eq(sources.id, scopedSourceId) : undefined;
	const articleFilter = scopedSourceId ? eq(articles.sourceId, scopedSourceId) : undefined;
	const clickFilter = scopedSourceId
		? and(eq(clickEvents.sourceId, scopedSourceId), gte(clickEvents.createdAt, reportSince))
		: gte(clickEvents.createdAt, reportSince);

	const clickWhere = buildClickWhere(scopedSourceId, reportSinceIso);
	const [sourceStats, topArticles, recentClicks, categoryRows, ruleRows, feedRows, sourceSettingsRows, clicksOverTimeRows, topCategoryRows, trafficSourceRows] =
		await Promise.all([
		db
			.select({
				sourceId: sources.id,
				sourceName: sources.name,
				sourceDomain: sources.domain,
				articleCount: sql<number>`(
					SELECT count(*)::int
					FROM ${articles}
					WHERE ${articles.sourceId} = ${sources.id}
						AND ${articles.active} = true
				)`,
				clickCount: sql<number>`(
					SELECT count(*)::int
					FROM ${clickEvents}
					WHERE ${clickEvents.sourceId} = ${sources.id}
						AND ${clickEvents.isBot} = false
						AND ${clickEvents.createdAt} >= ${reportSince}
				)`,
				rawClickCount: sql<number>`(
					SELECT count(*)::int
					FROM ${clickEvents}
					WHERE ${clickEvents.sourceId} = ${sources.id}
						AND ${clickEvents.createdAt} >= ${reportSince}
				)`,
				uniqueClickCount: sql<number>`(
					SELECT count(*)::int
					FROM ${clickEvents}
					WHERE ${clickEvents.sourceId} = ${sources.id}
						AND ${clickEvents.isBot} = false
						AND ${clickEvents.isUnique} = true
						AND ${clickEvents.createdAt} >= ${reportSince}
				)`,
				botClickCount: sql<number>`(
					SELECT count(*)::int
					FROM ${clickEvents}
					WHERE ${clickEvents.sourceId} = ${sources.id}
						AND ${clickEvents.isBot} = true
						AND ${clickEvents.createdAt} >= ${reportSince}
				)`
			})
			.from(sources)
			.where(sourceFilter)
			.orderBy(sources.name),
		db
			.select({
				id: articles.id,
				title: articles.title,
				sourceName: sources.name,
				clickScore: articles.clickScore,
				publishedAt: articles.publishedAt,
				clickCount: sql<number>`count(${clickEvents.id}) FILTER (WHERE ${clickEvents.isBot} = false)`,
				rawClickCount: count(clickEvents.id),
				uniqueClickCount: sql<number>`count(${clickEvents.id}) FILTER (WHERE ${clickEvents.isBot} = false AND ${clickEvents.isUnique} = true)`,
				botClickCount: sql<number>`count(${clickEvents.id}) FILTER (WHERE ${clickEvents.isBot} = true)`
			})
			.from(articles)
			.innerJoin(sources, eq(sources.id, articles.sourceId))
			.leftJoin(clickEvents, and(eq(clickEvents.articleId, articles.id), gte(clickEvents.createdAt, reportSince)))
			.where(articleFilter ? and(eq(articles.active, true), articleFilter) : eq(articles.active, true))
			.groupBy(articles.id, sources.id)
			.orderBy(
				desc(sql`count(${clickEvents.id}) FILTER (WHERE ${clickEvents.isBot} = false)`),
				desc(articles.clickScore),
				desc(articles.publishedAt)
			)
			.limit(20),
		db
			.select({
				id: clickEvents.id,
				sourceName: sources.name,
				articleTitle: articles.title,
				referrer: clickEvents.referrer,
				utmCampaign: clickEvents.utmCampaign,
				isBot: clickEvents.isBot,
				botName: clickEvents.botName,
				isUnique: clickEvents.isUnique,
				createdAt: clickEvents.createdAt
			})
			.from(clickEvents)
			.innerJoin(sources, eq(sources.id, clickEvents.sourceId))
			.innerJoin(articles, eq(articles.id, clickEvents.articleId))
			.where(clickFilter)
			.orderBy(desc(clickEvents.createdAt))
			.limit(30),
		db.select({ slug: categories.slug, name: categories.name }).from(categories).orderBy(categories.name),
		scopedSourceId
			? db
					.select({
						id: sourceCategoryRules.id,
						urlPattern: sourceCategoryRules.urlPattern,
						categoryName: categories.name
					})
					.from(sourceCategoryRules)
					.innerJoin(categories, eq(categories.id, sourceCategoryRules.categoryId))
					.where(eq(sourceCategoryRules.sourceId, scopedSourceId))
					.orderBy(sourceCategoryRules.urlPattern)
			: Promise.resolve([]),
		db
			.select({
				feedId: sourceFeeds.id,
				sourceName: sources.name,
				feedUrl: sourceFeeds.feedUrl,
				status: sourceFeeds.status,
				lastFetchedAt: sourceFeeds.lastFetchedAt,
				lastError: sourceFeeds.lastError
			})
			.from(sourceFeeds)
			.innerJoin(sources, eq(sources.id, sourceFeeds.sourceId))
			.where(sourceFilter)
			.orderBy(sources.name, sourceFeeds.feedUrl),
		scopedSourceId
			? db
					.select({
						sourceId: sources.id,
						sourceName: sources.name,
						utmSource: sources.utmSource,
						utmMedium: sources.utmMedium,
						utmCampaign: sources.utmCampaign
					})
					.from(sources)
					.where(eq(sources.id, scopedSourceId))
					.limit(1)
			: Promise.resolve([]),
		getClicksOverTime(scopedSourceId, reportDays),
		db.execute<TopCategoryRow>(sql`
			SELECT
				coalesce(c.slug, 'nincs-rovat') AS slug,
				coalesce(c.name, 'Nincs rovat') AS name,
				count(ce.id) FILTER (WHERE ce.is_bot = false) AS click_count,
				count(ce.id) FILTER (WHERE ce.is_bot = false AND ce.is_unique = true) AS unique_click_count
			FROM click_events ce
			LEFT JOIN categories c ON c.id = ce.category_id
			WHERE ${sql.join(clickWhere, sql` AND `)}
			GROUP BY c.id, c.slug, c.name
			ORDER BY click_count DESC, unique_click_count DESC
			LIMIT 8
		`),
		db.execute<TrafficSourceRow>(sql`
			SELECT
				${getTrafficSourceCase()} AS label,
				count(ce.id) FILTER (WHERE ce.is_bot = false) AS click_count,
				count(ce.id) FILTER (WHERE ce.is_bot = false AND ce.is_unique = true) AS unique_click_count
			FROM click_events ce
			WHERE ${sql.join(clickWhere, sql` AND `)}
			GROUP BY label
			ORDER BY click_count DESC, unique_click_count DESC
			LIMIT 8
		`)
		]);

	return {
		sourceStats: sourceStats.map((row) => ({
			sourceId: row.sourceId,
			sourceName: row.sourceName,
			sourceDomain: row.sourceDomain,
			articleCount: Number(row.articleCount),
			clickCount: Number(row.clickCount),
			rawClickCount: Number(row.rawClickCount),
			uniqueClickCount: Number(row.uniqueClickCount),
			botClickCount: Number(row.botClickCount)
		})),
		topArticles: topArticles.map((row) => ({
			id: row.id,
			title: row.title,
			sourceName: row.sourceName,
			clickScore: row.clickScore,
			clickCount: Number(row.clickCount),
			rawClickCount: Number(row.rawClickCount),
			uniqueClickCount: Number(row.uniqueClickCount),
			botClickCount: Number(row.botClickCount),
			publishedAt: toIsoString(row.publishedAt)
		})),
		recentClicks: recentClicks.map((row) => ({
			id: row.id,
			sourceName: row.sourceName,
			articleTitle: row.articleTitle,
			referrer: row.referrer,
			utmCampaign: row.utmCampaign,
			isBot: row.isBot,
			botName: row.botName,
			isUnique: row.isUnique,
			createdAt: toIsoString(row.createdAt)
		})),
		categories: categoryRows,
		partnerSourceId: scopedSourceId,
		isAdmin: access.isAdmin,
		reportDays,
		reportRanges: REPORT_RANGES,
		availableSources: [],
		sourceRules: ruleRows,
		feedHealth: feedRows.map((row) => ({
			feedId: row.feedId,
			sourceName: row.sourceName,
			feedUrl: row.feedUrl,
			status: row.status,
			lastFetchedAt: row.lastFetchedAt ? toIsoString(row.lastFetchedAt) : null,
			lastError: row.lastError
		})),
		sourceSettings: sourceSettingsRows[0]
			? {
					sourceId: sourceSettingsRows[0].sourceId,
					sourceName: sourceSettingsRows[0].sourceName,
					utmSource: sourceSettingsRows[0].utmSource,
					utmMedium: sourceSettingsRows[0].utmMedium,
					utmCampaign: sourceSettingsRows[0].utmCampaign
				}
			: null,
		clicksOverTime: clicksOverTimeRows.map((row) => ({
			day: row.day,
			label: formatDayLabel(row.day),
			clickCount: Number(row.click_count),
			uniqueClickCount: Number(row.unique_click_count)
		})),
		topCategories: topCategoryRows.map((row) => ({
			slug: row.slug,
			name: row.name,
			clickCount: Number(row.click_count),
			uniqueClickCount: Number(row.unique_click_count)
		})),
		trafficSources: trafficSourceRows.map((row) => ({
			label: row.label,
			clickCount: Number(row.click_count),
			uniqueClickCount: Number(row.unique_click_count)
		}))
	};
};

export const actions: Actions = {
	overrideCategory: async (event) => {
		const access = requirePartnerAccess(event);
		const form = await event.request.formData();
		const articleId = Number(form.get('articleId'));
		const categorySlug = String(form.get('categorySlug') ?? '');

		if (!Number.isInteger(articleId) || !categorySlug) {
			return { ok: false, action: 'overrideCategory', error: 'Invalid category override.' };
		}

		const [article] = await db
			.select({ id: articles.id, sourceId: articles.sourceId })
			.from(articles)
			.where(eq(articles.id, articleId))
			.limit(1);
		const [category] = await db
			.select({ id: categories.id })
			.from(categories)
			.where(eq(categories.slug, categorySlug))
			.limit(1);

		if (!article || !category) {
			return { ok: false, action: 'overrideCategory', error: 'Article or category not found.' };
		}
		if (!access.isAdmin && article.sourceId !== access.sourceId) {
			return { ok: false, action: 'overrideCategory', error: 'This article belongs to another source.' };
		}

		await db
			.insert(articleCategoryOverrides)
			.values({
				articleId: article.id,
				sourceId: article.sourceId,
				categoryId: category.id,
				updatedAt: sql`now()`
			})
			.onConflictDoUpdate({
				target: articleCategoryOverrides.articleId,
				set: { categoryId: category.id, updatedAt: sql`now()` }
			});

		await db.delete(articleCategories).where(eq(articleCategories.articleId, article.id));
		await db.insert(articleCategories).values({ articleId: article.id, categoryId: category.id });
		await indexArticles(await getArticleSearchDocuments([article.id]));

		return { ok: true, action: 'overrideCategory', articleId: article.id, categorySlug };
	},
	addUrlRule: async (event) => {
		const { sourceId } = requirePartnerAccess(event);
		const form = await event.request.formData();
		const categorySlug = String(form.get('categorySlug') ?? '');
		const urlPattern = String(form.get('urlPattern') ?? '');

		if (!sourceId || !categorySlug || !urlPattern.trim()) {
			return { ok: false, action: 'addUrlRule', error: 'Source, category and URL pattern are required.' };
		}

		const [category] = await db
			.select({ id: categories.id })
			.from(categories)
			.where(eq(categories.slug, categorySlug))
			.limit(1);

		if (!category) return { ok: false, action: 'addUrlRule', error: 'Category not found.' };

		await upsertSourceCategoryRule({ sourceId, categoryId: category.id, urlPattern });
		return { ok: true, action: 'addUrlRule' };
	},
	deleteUrlRule: async (event) => {
		const { sourceId } = requirePartnerAccess(event);
		const form = await event.request.formData();
		const ruleId = Number(form.get('ruleId'));

		if (!sourceId || !Number.isInteger(ruleId)) {
			return { ok: false, action: 'deleteUrlRule', error: 'Invalid rule.' };
		}

		await db
			.delete(sourceCategoryRules)
			.where(and(eq(sourceCategoryRules.id, ruleId), eq(sourceCategoryRules.sourceId, sourceId)));

		return { ok: true, action: 'deleteUrlRule' };
	},
	updateUtmSettings: async (event) => {
		const { sourceId } = requirePartnerAccess(event);
		const form = await event.request.formData();

		if (!sourceId) {
			return { ok: false, action: 'updateUtmSettings', error: 'Nincs kiválasztott forrás.' };
		}

		const utmSource = normalizeUtmValue(form.get('utmSource'), 'hirek.hu');
		const utmMedium = normalizeUtmValue(form.get('utmMedium'), 'referral');
		const utmCampaign = normalizeUtmValue(form.get('utmCampaign'), 'hirek_stream');

		await db
			.update(sources)
			.set({
				utmSource,
				utmMedium,
				utmCampaign,
				updatedAt: new Date()
			})
			.where(eq(sources.id, sourceId));

		return { ok: true, action: 'updateUtmSettings' };
	}
};

function toIsoString(value: Date | string) {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseReportDays(url: URL) {
	const requested = Number(url.searchParams.get('range') ?? '30');
	return REPORT_RANGES.includes(requested) ? requested : 30;
}

function getReportSince(days: number) {
	const since = new Date();
	since.setHours(0, 0, 0, 0);
	since.setDate(since.getDate() - (days - 1));
	return since;
}

function buildClickWhere(sourceId: number | null, reportSinceIso: string) {
	const clauses: SQL[] = [sql`ce.created_at >= ${reportSinceIso}::timestamptz`];
	if (sourceId) clauses.push(sql`ce.source_id = ${sourceId}`);
	return clauses;
}

function getClicksOverTime(sourceId: number | null, days: number) {
	const firstDay = getReportSince(days).toISOString();
	return db.execute<ClicksOverTimeRow>(sql`
		WITH days AS (
			SELECT generate_series(
				${firstDay}::timestamptz,
				date_trunc('day', now()),
				interval '1 day'
			)::date AS day
		)
		SELECT
			days.day::text AS day,
			count(ce.id) FILTER (WHERE ce.is_bot = false) AS click_count,
			count(ce.id) FILTER (WHERE ce.is_bot = false AND ce.is_unique = true) AS unique_click_count
		FROM days
		LEFT JOIN click_events ce ON ce.created_at >= days.day
			AND ce.created_at < days.day + interval '1 day'
			${sourceId ? sql`AND ce.source_id = ${sourceId}` : sql``}
		GROUP BY days.day
		ORDER BY days.day ASC
	`);
}

function getTrafficSourceCase() {
	return sql`
		CASE
			WHEN nullif(trim(coalesce(ce.referrer, '')), '') IS NULL THEN 'Közvetlen / ismeretlen'
			WHEN ce.referrer ILIKE '%/kereses%' THEN 'Keresés'
			WHEN ce.referrer ILIKE '%/konyvjelzok%' THEN 'Könyvjelzők'
			WHEN ce.referrer ILIKE '%/top%' THEN 'Toplista'
			WHEN ce.referrer ILIKE '%/rovat/%' THEN 'Rovat oldal'
			WHEN ce.referrer ~ '/[^/?#]+/[^/?#]+/?(\\?|#|$)' THEN 'Forrás + rovat oldal'
			WHEN ce.referrer ~ '/[^/?#]+/?(\\?|#|$)' THEN 'Forrás oldal'
			ELSE 'Egyéb referrer'
		END
	`;
}

function formatDayLabel(day: string) {
	return new Intl.DateTimeFormat('hu-HU', {
		month: 'short',
		day: 'numeric'
	}).format(new Date(`${day}T00:00:00.000Z`));
}

function normalizeUtmValue(value: FormDataEntryValue | null, fallback: string) {
	const clean = String(value ?? '').trim();
	return clean.slice(0, 120) || fallback;
}

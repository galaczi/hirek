import { eq, sql } from 'drizzle-orm';
import { error, redirect, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articleCategories, articles, clickEvents, sources } from '$lib/server/db/schema';
import { classifyClick } from '$lib/server/articles/click-tracking';
import { buildTrackedUrl, getArticleUtm } from '$lib/server/articles/utm';

export const GET: RequestHandler = async ({ params, request, getClientAddress }) => {
	const articleId = Number(params.articleId);
	if (!Number.isInteger(articleId)) error(400, 'Invalid article id');

	const [article] = await db
		.select({
			id: articles.id,
			sourceId: articles.sourceId,
			canonicalUrl: articles.canonicalUrl,
			active: articles.active,
			utmSource: sources.utmSource,
			utmMedium: sources.utmMedium,
			utmCampaign: sources.utmCampaign
		})
		.from(articles)
		.innerJoin(sources, eq(sources.id, articles.sourceId))
		.where(eq(articles.id, articleId))
		.limit(1);

	if (!article || !article.active) error(404, 'Article not found');

	const [primaryCategory] = await db
		.select({ categoryId: articleCategories.categoryId })
		.from(articleCategories)
		.where(eq(articleCategories.articleId, article.id))
		.limit(1);
	const click = await classifyClick({
		articleId: article.id,
		ipAddress: getClientAddress(),
		userAgent: request.headers.get('user-agent')
	});
	const utm = getArticleUtm(article.id, article);

	await db.insert(clickEvents).values({
		articleId: article.id,
		sourceId: article.sourceId,
		categoryId: primaryCategory?.categoryId ?? null,
		referrer: request.headers.get('referer'),
		userAgent: request.headers.get('user-agent'),
		ipHash: click.ipHash,
		utmCampaign: utm.campaign,
		utmContent: utm.content,
		isBot: click.isBot,
		botName: click.botName,
		isUnique: click.isUnique
	});

	if (!click.isBot) {
		await db
			.update(articles)
			.set({ clickScore: sql`${articles.clickScore} + 1`, updatedAt: new Date() })
			.where(eq(articles.id, article.id));
	}

	redirect(302, buildTrackedUrl(article.canonicalUrl, article.id, article));
};

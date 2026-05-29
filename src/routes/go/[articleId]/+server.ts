import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { error, redirect, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles, clickEvents } from '$lib/server/db/schema';
import { buildTrackedUrl } from '$lib/server/articles/utm';

export const GET: RequestHandler = async ({ params, request, getClientAddress }) => {
	const articleId = Number(params.articleId);
	if (!Number.isInteger(articleId)) error(400, 'Invalid article id');

	const article = await db.query.articles.findFirst({
		where: eq(articles.id, articleId),
		columns: {
			id: true,
			sourceId: true,
			canonicalUrl: true,
			active: true
		}
	});

	if (!article || !article.active) error(404, 'Article not found');

	await db.insert(clickEvents).values({
		articleId: article.id,
		sourceId: article.sourceId,
		referrer: request.headers.get('referer'),
		userAgent: request.headers.get('user-agent'),
		ipHash: hashIp(getClientAddress())
	});

	redirect(302, buildTrackedUrl(article.canonicalUrl, article.id));
};

function hashIp(ip: string) {
	return createHash('sha256').update(ip).digest('hex');
}

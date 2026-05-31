import { createHash } from 'node:crypto';
import { and, eq, gte, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { clickEvents } from '$lib/server/db/schema';

const BOT_PATTERNS: Array<[string, RegExp]> = [
	['Googlebot', /googlebot/i],
	['Bingbot', /bingbot/i],
	['Facebook crawler', /facebookexternalhit|facebot/i],
	['Twitterbot', /twitterbot/i],
	['LinkedInBot', /linkedinbot/i],
	['Slackbot', /slackbot/i],
	['Discordbot', /discordbot/i],
	['TelegramBot', /telegrambot/i],
	['Generic crawler', /bot|crawler|spider|preview|scraper|curl|wget|python-requests/i]
];

export type ClickClassification = {
	ipHash: string;
	isBot: boolean;
	isUnique: boolean;
};

export async function classifyClick(input: {
	articleId: number;
	ipAddress: string;
	userAgent: string | null;
}) {
	const ipHash = hashIp(input.ipAddress);
	const isBot = isBotUserAgent(input.userAgent);
	const isUnique = isBot ? false : await isUniqueHumanClick(input.articleId, ipHash, input.userAgent);

	return {
		ipHash,
		isBot,
		isUnique
	} satisfies ClickClassification;
}

export function classifyRequest(input: { ipAddress: string; userAgent: string | null }) {
	return {
		ipHash: hashIp(input.ipAddress),
		isBot: isBotUserAgent(input.userAgent)
	};
}

export function isBotUserAgent(userAgent: string | null) {
	if (!userAgent) return false;
	for (const [, pattern] of BOT_PATTERNS) {
		if (pattern.test(userAgent)) return true;
	}
	return false;
}

async function isUniqueHumanClick(articleId: number, ipHash: string, userAgent: string | null) {
	const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
	const [existing] = await db
		.select({ id: clickEvents.id })
		.from(clickEvents)
		.where(
			and(
				eq(clickEvents.articleId, articleId),
				eq(clickEvents.ipHash, ipHash),
				userAgent ? eq(clickEvents.userAgent, userAgent) : isNull(clickEvents.userAgent),
				gte(clickEvents.createdAt, since)
			)
		)
		.limit(1);

	return !existing;
}

function hashIp(ip: string) {
	return createHash('sha256').update(ip).digest('hex');
}

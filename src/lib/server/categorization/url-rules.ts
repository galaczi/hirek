import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories, sourceCategoryRules } from '$lib/server/db/schema';

export async function getCategorySlugsForUrl(sourceId: number, url: string) {
	const rules = await db
		.select({
			pattern: sourceCategoryRules.urlPattern,
			categorySlug: categories.slug
		})
		.from(sourceCategoryRules)
		.innerJoin(categories, eq(categories.id, sourceCategoryRules.categoryId))
		.where(eq(sourceCategoryRules.sourceId, sourceId));

	const normalizedUrl = normalizeUrl(url);
	const match = rules.find((rule) => matchesUrlPattern(normalizedUrl, rule.pattern));
	return match ? [match.categorySlug] : [];
}

export function matchesUrlPattern(url: string, pattern: string) {
	const normalizedPattern = normalizePattern(pattern);
	if (!normalizedPattern) return false;

	if (normalizedPattern.endsWith('*')) {
		return url.startsWith(normalizedPattern.slice(0, -1));
	}

	return url.includes(normalizedPattern);
}

export async function upsertSourceCategoryRule(input: {
	sourceId: number;
	categoryId: number;
	urlPattern: string;
}) {
	const urlPattern = normalizePattern(input.urlPattern);
	if (!urlPattern) throw new Error('URL pattern is required');

	return db
		.insert(sourceCategoryRules)
		.values({
			sourceId: input.sourceId,
			categoryId: input.categoryId,
			urlPattern
		})
		.onConflictDoUpdate({
			target: [sourceCategoryRules.sourceId, sourceCategoryRules.urlPattern],
			set: {
				categoryId: input.categoryId,
				updatedAt: new Date()
			}
		})
		.returning({ id: sourceCategoryRules.id });
}

export async function deleteSourceCategoryRule(sourceId: number, ruleId: number) {
	return db
		.delete(sourceCategoryRules)
		.where(and(eq(sourceCategoryRules.id, ruleId), eq(sourceCategoryRules.sourceId, sourceId)));
}

function normalizeUrl(url: string) {
	try {
		const parsed = new URL(url);
		return `${parsed.hostname.replace(/^www\./, '')}${parsed.pathname}`.toLowerCase();
	} catch {
		return url.toLowerCase();
	}
}

function normalizePattern(pattern: string) {
	return pattern.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
}

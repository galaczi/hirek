import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/admin/auth';
import { db } from '$lib/server/db';
import { categories, sourceCategoryRules, sourceFeeds, sources } from '$lib/server/db/schema';
import { upsertSourceCategoryRule } from '$lib/server/categorization/url-rules';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);

	const [sourceRows, categoryRows, ruleRows] = await Promise.all([
		db
			.select({
				id: sources.id,
				slug: sources.slug,
				name: sources.name,
				domain: sources.domain,
				status: sources.status
			})
			.from(sources)
			.orderBy(sources.name),
		db.select({ id: categories.id, slug: categories.slug, name: categories.name }).from(categories),
		db
			.select({
				id: sourceCategoryRules.id,
				sourceId: sourceCategoryRules.sourceId,
				sourceName: sources.name,
				urlPattern: sourceCategoryRules.urlPattern,
				categoryName: categories.name,
				categorySlug: categories.slug
			})
			.from(sourceCategoryRules)
			.innerJoin(sources, eq(sources.id, sourceCategoryRules.sourceId))
			.innerJoin(categories, eq(categories.id, sourceCategoryRules.categoryId))
			.orderBy(sources.name, sourceCategoryRules.urlPattern)
	]);

	return {
		sources: sourceRows,
		categories: categoryRows,
		rules: ruleRows
	};
};

export const actions: Actions = {
	addSource: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const name = String(form.get('name') ?? '').trim();
		const slug = String(form.get('slug') ?? '').trim();
		const domain = String(form.get('domain') ?? '').trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
		const feedUrl = String(form.get('feedUrl') ?? '').trim();

		if (!name || !slug || !domain || !feedUrl) {
			return { ok: false, action: 'addSource', error: 'Name, slug, domain and feed URL are required.' };
		}

		const [source] = await db
			.insert(sources)
			.values({ name, slug, domain, status: 'ingesting', updatedAt: new Date() })
			.onConflictDoUpdate({
				target: sources.slug,
				set: { name, domain, status: 'ingesting', updatedAt: new Date() }
			})
			.returning({ id: sources.id });

		await db
			.insert(sourceFeeds)
			.values({ sourceId: source.id, feedUrl, status: 'active', updatedAt: new Date() })
			.onConflictDoUpdate({
				target: sourceFeeds.feedUrl,
				set: { sourceId: source.id, status: 'active', updatedAt: new Date() }
			});

		return { ok: true, action: 'addSource', sourceId: source.id };
	},
	addRule: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const sourceId = Number(form.get('sourceId'));
		const categoryId = Number(form.get('categoryId'));
		const urlPattern = String(form.get('urlPattern') ?? '');

		if (!Number.isInteger(sourceId) || !Number.isInteger(categoryId) || !urlPattern.trim()) {
			return { ok: false, action: 'addRule', error: 'Source, category and URL pattern are required.' };
		}

		await upsertSourceCategoryRule({ sourceId, categoryId, urlPattern });
		return { ok: true, action: 'addRule' };
	},
	deleteRule: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const ruleId = Number(form.get('ruleId'));

		if (!Number.isInteger(ruleId)) {
			return { ok: false, action: 'deleteRule', error: 'Invalid rule.' };
		}

		await db.delete(sourceCategoryRules).where(eq(sourceCategoryRules.id, ruleId));
		return { ok: true, action: 'deleteRule' };
	}
};

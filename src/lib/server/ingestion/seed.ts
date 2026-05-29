import { and, asc, eq, inArray, ne, notExists, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { articles, categories, sourceFeeds, sources } from '$lib/server/db/schema';
import { seedCategories, seedFeeds, seedSources } from './seed-data';

export async function seedSourceRegistry() {
	for (const category of seedCategories) {
		await db
			.insert(categories)
			.values({ slug: category.slug, name: category.name })
			.onConflictDoUpdate({
				target: categories.slug,
				set: { name: category.name }
			});
	}

	for (const source of seedSources) {
		const [slugRow] = await db
			.select({ id: sources.id })
			.from(sources)
			.where(eq(sources.slug, source.slug))
			.limit(1);

		if (slugRow) {
			await db
				.update(sources)
				.set({
					name: source.name,
					domain: source.domain,
					status: sql`CASE
						WHEN ${sources.approvalStatus} = 'approved' AND ${sources.status} = 'pending' THEN 'needs_rss'
						ELSE ${sources.status}
					END`,
					updatedAt: sql`now()`
				})
				.where(eq(sources.id, slugRow.id));
			await markDuplicateDomainSources(source.domain, slugRow.id, source.slug);
			continue;
		}

		const [domainRow] = await db
			.select({ id: sources.id })
			.from(sources)
			.where(eq(sources.domain, source.domain))
			.orderBy(asc(sources.id))
			.limit(1);

		if (domainRow) {
			await db
				.update(sources)
				.set({
					slug: source.slug,
					name: source.name,
					domain: source.domain,
					status: sql`CASE
						WHEN ${sources.approvalStatus} = 'approved' AND ${sources.status} = 'pending' THEN 'needs_rss'
						ELSE ${sources.status}
					END`,
					updatedAt: sql`now()`
				})
				.where(eq(sources.id, domainRow.id));
			await markDuplicateDomainSources(source.domain, domainRow.id, source.slug);
			continue;
		}

		await db.insert(sources).values({
			slug: source.slug,
			name: source.name,
			domain: source.domain,
			approvalStatus: 'approved',
			status: 'needs_rss',
			updatedAt: sql`now()`
		});
	}

	for (const feed of seedFeeds) {
		const [sourceRow] = await db
			.insert(sources)
			.values({
				slug: feed.source.slug,
				name: feed.source.name,
				domain: feed.source.domain,
				approvalStatus: 'approved',
				status: 'ingesting',
				updatedAt: sql`now()`
			})
			.onConflictDoUpdate({
				target: sources.slug,
				set: {
					name: feed.source.name,
					domain: feed.source.domain,
					status: sql`CASE
						WHEN ${sources.approvalStatus} = 'approved' THEN 'ingesting'
						ELSE ${sources.status}
					END`,
					updatedAt: sql`now()`
				}
			})
			.returning({ id: sources.id });

		const [categoryRow] = await db
			.select({ id: categories.id })
			.from(categories)
			.where(eq(categories.slug, feed.categorySlug))
			.limit(1);

		await db
			.insert(sourceFeeds)
			.values({
				sourceId: sourceRow.id,
				categoryId: categoryRow?.id ?? null,
				feedUrl: feed.feedUrl,
				status: 'active',
				updatedAt: sql`now()`
			})
			.onConflictDoUpdate({
				target: sourceFeeds.feedUrl,
				set: {
					sourceId: sourceRow.id,
					categoryId: categoryRow?.id ?? null,
					status: 'active',
					updatedAt: sql`now()`
				}
			});
	}

	return {
		categories: seedCategories.length,
		sources: seedSources.length,
		feeds: seedFeeds.length
	};
}

async function markDuplicateDomainSources(domain: string, canonicalId: number, canonicalSlug: string) {
	await db
		.update(sources)
		.set({
			status: 'disabled',
			statusNote: `Duplicate source row superseded by ${canonicalSlug}.`,
			updatedAt: sql`now()`
		})
		.where(
			and(
				eq(sources.domain, domain),
				ne(sources.id, canonicalId),
				inArray(sources.status, ['pending', 'needs_rss']),
				notExists(
					db
						.select({ id: sourceFeeds.id })
						.from(sourceFeeds)
						.where(and(eq(sourceFeeds.sourceId, sources.id), eq(sourceFeeds.status, 'active')))
				)
			)
		);
}

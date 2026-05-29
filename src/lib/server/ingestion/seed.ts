import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { seedCategories, seedFeeds } from './seed-data';

export async function seedSourceRegistry() {
	for (const category of seedCategories) {
		await db.execute(sql`
			INSERT INTO categories (slug, name)
			VALUES (${category.slug}, ${category.name})
			ON CONFLICT (slug) DO UPDATE SET name = excluded.name
		`);
	}

	for (const feed of seedFeeds) {
		const sourceRows = await db.execute<{ id: number }>(sql`
			INSERT INTO sources (slug, name, domain, status, updated_at)
			VALUES (${feed.source.slug}, ${feed.source.name}, ${feed.source.domain}, 'ingesting', now())
			ON CONFLICT (slug) DO UPDATE SET
				name = excluded.name,
				domain = excluded.domain,
				status = 'ingesting',
				updated_at = now()
			RETURNING id
		`);

		const categoryRows = await db.execute<{ id: number }>(sql`
			SELECT id FROM categories WHERE slug = ${feed.categorySlug}
		`);

		await db.execute(sql`
			INSERT INTO source_feeds (source_id, category_id, feed_url, status, updated_at)
			VALUES (${sourceRows[0].id}, ${categoryRows[0]?.id ?? null}, ${feed.feedUrl}, 'active', now())
			ON CONFLICT (feed_url) DO UPDATE SET
				source_id = excluded.source_id,
				category_id = excluded.category_id,
				status = 'active',
				updated_at = now()
		`);
	}

	return {
		categories: seedCategories.length,
		feeds: seedFeeds.length
	};
}

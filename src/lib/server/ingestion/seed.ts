import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { seedCategories, seedFeeds, seedSources } from './seed-data';

export async function seedSourceRegistry() {
	for (const category of seedCategories) {
		await db.execute(sql`
			INSERT INTO categories (slug, name)
			VALUES (${category.slug}, ${category.name})
			ON CONFLICT (slug) DO UPDATE SET name = excluded.name
		`);
	}

	for (const source of seedSources) {
		const slugRows = await db.execute<{ id: number }>(sql`
			SELECT id FROM sources WHERE slug = ${source.slug} LIMIT 1
		`);

		if (slugRows[0]) {
			await db.execute(sql`
				UPDATE sources
				SET
					name = ${source.name},
					domain = ${source.domain},
					status = CASE
						WHEN approval_status = 'approved' AND status = 'pending' THEN 'needs_rss'
						ELSE status
					END,
					updated_at = now()
				WHERE id = ${slugRows[0].id}
			`);
			await markDuplicateDomainSources(source.domain, slugRows[0].id, source.slug);
			continue;
		}

		const domainRows = await db.execute<{ id: number }>(sql`
			SELECT id FROM sources WHERE domain = ${source.domain} ORDER BY id LIMIT 1
		`);

		if (domainRows[0]) {
			await db.execute(sql`
				UPDATE sources
				SET
					slug = ${source.slug},
					name = ${source.name},
					domain = ${source.domain},
					status = CASE
						WHEN approval_status = 'approved' AND status = 'pending' THEN 'needs_rss'
						ELSE status
					END,
					updated_at = now()
				WHERE id = ${domainRows[0].id}
			`);
			await markDuplicateDomainSources(source.domain, domainRows[0].id, source.slug);
			continue;
		}

		await db.execute(sql`
			INSERT INTO sources (slug, name, domain, approval_status, status, updated_at)
			VALUES (${source.slug}, ${source.name}, ${source.domain}, 'approved', 'needs_rss', now())
		`);
	}

	for (const feed of seedFeeds) {
		const sourceRows = await db.execute<{ id: number }>(sql`
			INSERT INTO sources (slug, name, domain, approval_status, status, updated_at)
			VALUES (${feed.source.slug}, ${feed.source.name}, ${feed.source.domain}, 'approved', 'ingesting', now())
			ON CONFLICT (slug) DO UPDATE SET
				name = excluded.name,
				domain = excluded.domain,
				status = CASE
					WHEN sources.approval_status = 'approved' THEN 'ingesting'
					ELSE sources.status
				END,
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
		sources: seedSources.length,
		feeds: seedFeeds.length
	};
}

async function markDuplicateDomainSources(domain: string, canonicalId: number, canonicalSlug: string) {
	await db.execute(sql`
		UPDATE sources duplicate
		SET
			status = 'disabled',
			status_note = ${`Duplicate source row superseded by ${canonicalSlug}.`},
			updated_at = now()
		WHERE duplicate.domain = ${domain}
			AND duplicate.id <> ${canonicalId}
			AND duplicate.status IN ('pending', 'needs_rss')
			AND NOT EXISTS (
				SELECT 1
				FROM source_feeds sf
				WHERE sf.source_id = duplicate.id
					AND sf.status = 'active'
			)
	`);
}

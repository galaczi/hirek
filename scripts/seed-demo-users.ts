import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { hashPassword } from 'better-auth/crypto';
import postgres from 'postgres';

type DemoUser = {
	email: string;
	password: string;
	role: 'admin' | 'partner';
	sourceId: number | null;
};

loadDotenv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('DATABASE_URL is not set.');
	process.exit(1);
}

const adminEmail = process.env.DEMO_ADMIN_EMAIL?.trim().toLowerCase() || 'admin@hirek.local';
const partnerEmail = process.env.DEMO_PARTNER_EMAIL?.trim().toLowerCase() || 'partner@hirek.local';
const adminPassword = process.env.DEMO_ADMIN_PASSWORD || 'hirek-admin-demo';
const partnerPassword = process.env.DEMO_PARTNER_PASSWORD || 'hirek-partner-demo';
const partnerSourceSlug = process.env.DEMO_PARTNER_SOURCE_SLUG || '24-hu';

const sql = postgres(databaseUrl, { max: 1 });

try {
	const partnerSourceId = await ensurePartnerSource(partnerSourceSlug);
	const users: DemoUser[] = [
		{ email: adminEmail, password: adminPassword, role: 'admin', sourceId: null },
		{ email: partnerEmail, password: partnerPassword, role: 'partner', sourceId: partnerSourceId }
	];

	for (const user of users) {
		await upsertUser(user);
		console.log(`Created/updated ${user.role} demo user ${user.email}.`);
	}

	console.log(`Partner demo source: ${partnerSourceSlug} (#${partnerSourceId}).`);
} finally {
	await sql.end();
}

async function ensurePartnerSource(slug: string) {
	const existing = await sql<{ id: number }[]>`
		SELECT id
		FROM sources
		WHERE slug = ${slug}
		LIMIT 1
	`;

	if (existing[0]) return existing[0].id;

	const inserted = await sql<{ id: number }[]>`
		INSERT INTO sources (slug, name, domain, status, updated_at)
		VALUES (${slug}, '24.hu', '24.hu', 'needs_rss', now())
		ON CONFLICT (slug) DO UPDATE SET updated_at = now()
		RETURNING id
	`;

	return inserted[0].id;
}

async function upsertUser(user: DemoUser) {
	const now = new Date();
	const existing = await sql<{ id: string }[]>`
		SELECT id
		FROM "user"
		WHERE email = ${user.email}
		LIMIT 1
	`;
	const userId = existing[0]?.id ?? randomUUID();
	const passwordHash = await hashPassword(user.password);
	const name = user.email.split('@')[0];

	if (existing[0]) {
		await sql`
			UPDATE "user"
			SET
				name = ${name},
				email_verified = true,
				role = ${user.role},
				source_id = ${user.sourceId},
				updated_at = ${now}
			WHERE id = ${userId}
		`;
	} else {
		await sql`
			INSERT INTO "user" (
				id, name, email, email_verified, role, source_id, created_at, updated_at
			)
			VALUES (
				${userId}, ${name}, ${user.email}, true, ${user.role}, ${user.sourceId}, ${now}, ${now}
			)
		`;
	}

	const credentialAccount = await sql<{ id: string }[]>`
		SELECT id
		FROM "account"
		WHERE user_id = ${userId}
			AND provider_id = 'credential'
		LIMIT 1
	`;

	if (credentialAccount[0]) {
		await sql`
			UPDATE "account"
			SET
				account_id = ${userId},
				password = ${passwordHash},
				updated_at = ${now}
			WHERE id = ${credentialAccount[0].id}
		`;
		return;
	}

	await sql`
		INSERT INTO "account" (
			id, account_id, provider_id, user_id, password, created_at, updated_at
		)
		VALUES (
			${randomUUID()}, ${userId}, 'credential', ${userId}, ${passwordHash}, ${now}, ${now}
		)
	`;
}

function loadDotenv() {
	try {
		const content = readFileSync('.env', 'utf8');
		for (const line of content.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const equals = trimmed.indexOf('=');
			if (equals === -1) continue;
			const key = trimmed.slice(0, equals);
			const value = trimmed.slice(equals + 1).replace(/^["']|["']$/g, '');
			process.env[key] ??= value;
		}
	} catch {
		// Demo seeding can also run with real environment variables.
	}
}

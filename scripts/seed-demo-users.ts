import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import postgres from 'postgres';
import {
	account as accountTable,
	sources as sourcesTable,
	user as userTable
} from '../src/lib/server/db/schema.ts';

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

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client, { schema: { account: accountTable, sources: sourcesTable, user: userTable } });

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
	await client.end();
}

async function ensurePartnerSource(slug: string) {
	const [existing] = await db
		.select({ id: sourcesTable.id })
		.from(sourcesTable)
		.where(eq(sourcesTable.slug, slug))
		.limit(1);
	if (existing) return existing.id;

	const [inserted] = await db
		.insert(sourcesTable)
		.values({
			slug,
			name: '24.hu',
			domain: '24.hu',
			status: 'needs_rss',
			updatedAt: new Date()
		})
		.onConflictDoUpdate({
			target: sourcesTable.slug,
			set: { updatedAt: new Date() }
		})
		.returning({ id: sourcesTable.id });

	return inserted.id;
}

async function upsertUser(demoUser: DemoUser) {
	const now = new Date();
	const [existing] = await db
		.select({ id: userTable.id })
		.from(userTable)
		.where(eq(userTable.email, demoUser.email))
		.limit(1);
	const userId = existing?.id ?? randomUUID();
	const passwordHash = await hashPassword(demoUser.password);
	const name = demoUser.email.split('@')[0];

	if (existing) {
		await db
			.update(userTable)
			.set({
				name,
				emailVerified: true,
				role: demoUser.role,
				sourceId: demoUser.sourceId,
				updatedAt: now
			})
			.where(eq(userTable.id, userId));
	} else {
		await db.insert(userTable).values({
			id: userId,
			name,
			email: demoUser.email,
			emailVerified: true,
			role: demoUser.role,
			sourceId: demoUser.sourceId,
			createdAt: now,
			updatedAt: now
		});
	}

	const [credentialAccount] = await db
		.select({ id: accountTable.id })
		.from(accountTable)
		.where(and(eq(accountTable.userId, userId), eq(accountTable.providerId, 'credential')))
		.limit(1);

	if (credentialAccount) {
		await db
			.update(accountTable)
			.set({
				accountId: userId,
				password: passwordHash,
				updatedAt: now
			})
			.where(eq(accountTable.id, credentialAccount.id));
		return;
	}

	await db.insert(accountTable).values({
		id: randomUUID(),
		accountId: userId,
		providerId: 'credential',
		userId,
		password: passwordHash,
		createdAt: now,
		updatedAt: now
	});
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

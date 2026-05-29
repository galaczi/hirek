import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import postgres from 'postgres';
import { account, user } from '../src/lib/server/db/schema.ts';

type AuthRole = 'admin' | 'partner';

loadDotenv();

const [, , emailArg, passwordArg, roleArg = 'admin', sourceIdArg] = process.argv;
const email = emailArg?.trim().toLowerCase();
const password = passwordArg ?? '';
const role: AuthRole = roleArg === 'partner' ? 'partner' : 'admin';
const sourceId = sourceIdArg ? Number(sourceIdArg) : null;

if (!email || !password) {
	console.error('Usage: npm run auth:user -- email@example.com password [admin|partner] [sourceId]');
	process.exit(1);
}

if (role === 'partner' && !Number.isInteger(sourceId)) {
	console.error('Partner users need a numeric sourceId.');
	process.exit(1);
}

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not set.');
	process.exit(1);
}

const client = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(client, { schema: { account, user } });
const now = new Date();
const id = randomUUID();
const name = email.split('@')[0];
const passwordHash = await hashPassword(password);

try {
	const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
	const userId = existing?.id ?? id;

	if (existing) {
		await db
			.update(user)
			.set({
				role,
				sourceId,
				updatedAt: now
			})
			.where(eq(user.id, userId));
	} else {
		await db.insert(user).values({
			id: userId,
			name,
			email,
			emailVerified: true,
			role,
			sourceId,
			createdAt: now,
			updatedAt: now
		});
	}

	const [credentialAccount] = await db
		.select({ id: account.id })
		.from(account)
		.where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
		.limit(1);

	if (credentialAccount) {
		await db
			.update(account)
			.set({
				password: passwordHash,
				accountId: userId,
				updatedAt: now
			})
			.where(eq(account.id, credentialAccount.id));
	} else {
		await db.insert(account).values({
			id: randomUUID(),
			accountId: userId,
			providerId: 'credential',
			userId,
			password: passwordHash,
			createdAt: now,
			updatedAt: now
		});
	}

	console.log(`Created/updated ${role} user ${email}.`);
} finally {
	await client.end();
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
		// The script can also run with real environment variables in production.
	}
}

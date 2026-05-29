import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { hashPassword } from 'better-auth/crypto';
import postgres from 'postgres';

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

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const now = new Date();
const id = randomUUID();
const name = email.split('@')[0];
const passwordHash = await hashPassword(password);

try {
	const existing = await sql<{ id: string }[]>`SELECT id FROM "user" WHERE email = ${email} LIMIT 1`;
	const userId = existing[0]?.id ?? id;

	if (existing[0]) {
		await sql`
			UPDATE "user"
			SET role = ${role},
				source_id = ${sourceId},
				updated_at = ${now}
			WHERE id = ${userId}
		`;
	} else {
		await sql`
			INSERT INTO "user" (
				id, name, email, email_verified, role, source_id, created_at, updated_at
			)
			VALUES (
				${userId}, ${name}, ${email}, true, ${role}, ${sourceId}, ${now}, ${now}
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
			SET password = ${passwordHash},
				account_id = ${userId},
				updated_at = ${now}
			WHERE id = ${credentialAccount[0].id}
		`;
	} else {
		await sql`
			INSERT INTO "account" (
				id, account_id, provider_id, user_id, password, created_at, updated_at
			)
			VALUES (
				${randomUUID()}, ${userId}, 'credential', ${userId}, ${passwordHash}, ${now}, ${now}
			)
		`;
	}

	console.log(`Created/updated ${role} user ${email}.`);
} finally {
	await sql.end();
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

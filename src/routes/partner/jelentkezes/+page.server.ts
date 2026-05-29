import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { sources, user as authUsers } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(303, locals.user.role === 'admin' ? '/admin' : '/partner');
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const partnerName = String(form.get('partnerName') ?? '').trim();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(form.get('password') ?? '');
		const sourceName = String(form.get('sourceName') ?? '').trim();
		const slug = String(form.get('slug') ?? '').trim();
		const domain = normalizeDomain(form.get('domain'));

		const values = {
			partnerName,
			email,
			sourceName,
			slug,
			domain
		};

		if (!partnerName || !email || !password || !sourceName || !slug || !domain) {
			return fail(400, {
				...values,
				error: 'Név, email, jelszó, forrásnév, slug és domain szükséges.'
			});
		}

		const [existingUser, existingSlug, existingDomain] = await Promise.all([
			db.select({ id: authUsers.id }).from(authUsers).where(eq(authUsers.email, email)).limit(1),
			db.select({ id: sources.id }).from(sources).where(eq(sources.slug, slug)).limit(1),
			db.select({ id: sources.id }).from(sources).where(eq(sources.domain, domain)).limit(1)
		]);

		if (existingUser[0]) {
			return fail(400, { ...values, error: 'Ez az email cím már használatban van.' });
		}
		if (existingSlug[0]) {
			return fail(400, { ...values, error: 'Ez a source slug már foglalt.' });
		}
		if (existingDomain[0]) {
			return fail(400, { ...values, error: 'Ehhez a domainhez már tartozik forrás.' });
		}

		let sourceId: number | null = null;

		try {
			const [source] = await db
				.insert(sources)
				.values({
					name: sourceName,
					slug,
					domain,
					approvalStatus: 'pending',
					status: 'pending',
					updatedAt: new Date()
				})
				.returning({ id: sources.id });

			sourceId = source.id;

			const signup = await auth.api.signUpEmail({
				headers: event.request.headers,
				body: {
					name: partnerName,
					email,
					password,
					rememberMe: true
				}
			});

			await db
				.update(authUsers)
				.set({ sourceId, updatedAt: new Date() })
				.where(eq(authUsers.id, signup.user.id));
		} catch (error) {
			if (sourceId) {
				await db.delete(sources).where(eq(sources.id, sourceId));
			}

			return fail(400, {
				...values,
				error:
					error instanceof Error
						? 'A regisztráció nem sikerült. Ellenőrizd az adatokat és próbáld újra.'
						: 'A regisztráció nem sikerült.'
			});
		}

		redirect(303, '/partner/');
	}
};

function normalizeDomain(value: FormDataEntryValue | null) {
	return String(value ?? '')
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\//, '')
		.replace(/^www\./, '')
		.replace(/\/+$/, '');
}

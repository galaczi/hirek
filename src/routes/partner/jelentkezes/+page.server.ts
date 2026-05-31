import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getPendingCommercialDefaults } from '$lib/source-commercial';
import { isUniqueViolation } from '$lib/server/db/errors';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { sources, user as authUsers } from '$lib/server/db/schema';
import {
	normalizeDomain,
	normalizeEmail,
	normalizePartnerName,
	normalizeSlug,
	normalizeSourceName,
	validatePartnerSignupInput,
	type ValidationFailure
} from '$lib/server/validation/input';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(303, locals.user.role === 'admin' ? '/admin' : '/partner');
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const partnerName = normalizePartnerName(form.get('partnerName'));
		const email = normalizeEmail(form.get('email'));
		const password = String(form.get('password') ?? '');
		const sourceName = normalizeSourceName(form.get('sourceName'));
		const slug = normalizeSlug(form.get('slug'));
		const domain = normalizeDomain(form.get('domain'));

		const values = {
			partnerName,
			email,
			sourceName,
			slug,
			domain
		};

		const validation = validatePartnerSignupInput({
			partnerName,
			email,
			password,
			sourceName,
			slug,
			domain
		});

		if (!validation.ok) {
			return fail(400, { ...values, error: partnerSignupError(validation) });
		}

		const normalized = validation.data;

		const [existingUser, existingSlug, existingDomain] = await Promise.all([
			db
				.select({ id: authUsers.id })
				.from(authUsers)
				.where(eq(authUsers.email, normalized.email))
				.limit(1),
			db.select({ id: sources.id }).from(sources).where(eq(sources.slug, normalized.slug)).limit(1),
			db
				.select({ id: sources.id })
				.from(sources)
				.where(eq(sources.domain, normalized.domain))
				.limit(1)
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
		const pendingCommercial = getPendingCommercialDefaults();

		try {
			const [source] = await db
				.insert(sources)
				.values({
					name: normalized.sourceName,
					slug: normalized.slug,
					domain: normalized.domain,
					approvalStatus: 'pending',
					status: 'pending',
					partnerPackage: pendingCommercial.partnerPackage,
					partnerStatus: pendingCommercial.partnerStatus,
					exchangeStatus: pendingCommercial.exchangeStatus,
					trafficTarget: pendingCommercial.trafficTarget,
					updatedAt: new Date()
				})
				.returning({ id: sources.id });

			sourceId = source.id;

			const signup = await auth.api.signUpEmail({
				headers: event.request.headers,
				body: {
					name: normalized.partnerName,
					email: normalized.email,
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

			if (isUniqueViolation(error, 'user_email_idx')) {
				return fail(400, { ...values, error: 'Ez az email cím már használatban van.' });
			}
			if (isUniqueViolation(error, 'sources_slug_idx')) {
				return fail(400, { ...values, error: 'Ez a source slug már foglalt.' });
			}
			if (isUniqueViolation(error, 'sources_domain_idx')) {
				return fail(400, { ...values, error: 'Ehhez a domainhez már tartozik forrás.' });
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

function partnerSignupError(validation: ValidationFailure) {
	if (validation.fieldErrors.password) {
		return 'A jelszónak legalább 12 karakteresnek kell lennie, és tartalmaznia kell legalább egy betűt és egy számot.';
	}
	if (validation.fieldErrors.email) {
		return validation.fieldErrors.email === 'Email cím szükséges.'
			? validation.fieldErrors.email
			: 'Adj meg érvényes email címet.';
	}
	if (validation.fieldErrors.slug) {
		return validation.fieldErrors.slug === 'Slug szükséges.'
			? validation.fieldErrors.slug
			: 'A slug csak kisbetűket, számokat és kötőjeleket tartalmazhat.';
	}
	if (validation.fieldErrors.domain) {
		return validation.fieldErrors.domain === 'Domain szükséges.'
			? validation.fieldErrors.domain
			: 'Adj meg érvényes domain nevet, például pelda.hu.';
	}
	if (validation.fieldErrors.partnerName || validation.fieldErrors.sourceName) {
		return 'A név mezők nem lehetnek üresek vagy túl hosszúak.';
	}

	return validation.summary || 'A regisztrációhoz érvényes adatok szükségesek.';
}

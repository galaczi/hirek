import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, url }) => {
	const redirectTo = sanitizeRedirect(url.searchParams.get('redirectTo'));

	if (locals.user) redirect(303, redirectTo ?? defaultRedirect(locals.user.role));

	return {
		redirectTo
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const redirectTo = sanitizeRedirect(String(form.get('redirectTo') ?? '')) ?? '/partner';

		if (!email || !password) {
			return fail(400, { email, error: 'Email és jelszó szükséges.' });
		}

		try {
			await auth.api.signInEmail({
				headers: event.request.headers,
				body: { email, password, rememberMe: true }
			});
		} catch {
			return fail(400, { email, error: 'Hibás email vagy jelszó.' });
		}

		redirect(303, redirectTo);
	}
};

function defaultRedirect(role: string) {
	return role === 'admin' ? '/admin' : '/partner';
}

function sanitizeRedirect(value: string | null) {
	if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
	return value;
}

import { error, redirect, type RequestEvent } from '@sveltejs/kit';

export function requireSignedIn(event: RequestEvent) {
	if (event.locals.user) return event.locals.user;

	if (event.url.pathname.startsWith('/api/')) error(401, 'Bejelentkezés szükséges');

	const redirectTo = `${event.url.pathname}${event.url.search}`;
	redirect(303, `/belepes?${new URLSearchParams({ redirectTo })}`);
}

export function requireAdmin(event: RequestEvent) {
	const user = requireSignedIn(event);
	if (user.role === 'admin') return user;

	if (event.url.pathname.startsWith('/api/')) error(403, 'Admin jogosultság szükséges');
	error(403, 'Admin jogosultság szükséges');
}

export function requirePartnerAccess(event: RequestEvent) {
	const user = requireSignedIn(event);

	if (user.role === 'admin') {
		const sourceId = Number(event.url.searchParams.get('sourceId'));
		return {
			user,
			isAdmin: true,
			sourceId: Number.isInteger(sourceId) ? sourceId : null
		};
	}

	if (user.role !== 'partner' || !user.sourceId) {
		error(403, 'Partner forrás nincs hozzárendelve ehhez a felhasználóhoz');
	}

	return {
		user,
		isAdmin: false,
		sourceId: user.sourceId
	};
}

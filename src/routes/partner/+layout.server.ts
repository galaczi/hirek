import type { LayoutServerLoad } from './$types';
import { requirePartnerAccess } from '$lib/server/admin/auth';

export const load: LayoutServerLoad = (event) => {
	const access = requirePartnerAccess(event);

	return {
		isAdmin: access.isAdmin
	};
};

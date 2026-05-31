export const SOURCE_BOOST_STATUS_VALUES = ['paused', 'active'] as const;
export type SourceBoostStatus = (typeof SOURCE_BOOST_STATUS_VALUES)[number];

export const PUBLIC_SURFACE_VALUES = [
	'home',
	'top',
	'category',
	'source',
	'source_category'
] as const;
export type PublicSurface = (typeof PUBLIC_SURFACE_VALUES)[number];

export const ACQUISITION_MODE_VALUES = ['organic', 'paid', 'exchange'] as const;
export type AcquisitionMode = (typeof ACQUISITION_MODE_VALUES)[number];

export const DEFAULT_PUBLIC_SURFACES = PUBLIC_SURFACE_VALUES.join(',');
export const DEFAULT_TRUST_SCORE = 5;

export const sourceBoostStatusLabels: Record<SourceBoostStatus, string> = {
	paused: 'Szünetel',
	active: 'Aktív'
};

export const publicSurfaceLabels: Record<PublicSurface, string> = {
	home: 'Főoldal',
	top: 'Toplista',
	category: 'Rovat oldal',
	source: 'Forrás oldal',
	source_category: 'Forrás + rovat oldal'
};

export const acquisitionModeLabels: Record<AcquisitionMode, string> = {
	organic: 'Organikus',
	paid: 'Fizetett boost',
	exchange: 'Csereprogram boost'
};

export function isSourceBoostStatus(value: string | null | undefined): value is SourceBoostStatus {
	return SOURCE_BOOST_STATUS_VALUES.includes((value ?? '') as SourceBoostStatus);
}

export function isPublicSurface(value: string | null | undefined): value is PublicSurface {
	return PUBLIC_SURFACE_VALUES.includes((value ?? '') as PublicSurface);
}

export function isAcquisitionMode(value: string | null | undefined): value is AcquisitionMode {
	return ACQUISITION_MODE_VALUES.includes((value ?? '') as AcquisitionMode);
}

export function normalizeTrustScore(value: unknown) {
	const parsed = Number(String(value ?? '').trim());
	if (!Number.isFinite(parsed)) return Number.NaN;
	return Math.min(10, Math.max(0, Math.round(parsed)));
}

export function normalizeMoneyAmount(value: unknown) {
	const parsed = Number(String(value ?? '').trim());
	if (!Number.isFinite(parsed)) return Number.NaN;
	return Math.max(0, Math.round(parsed));
}

export function normalizeSurfaceTargets(value: unknown) {
	const values = Array.isArray(value) ? value : String(value ?? '').split(',');
	return Array.from(
		new Set(
			values
				.map((item) => String(item ?? '').trim())
				.filter((item): item is PublicSurface => isPublicSurface(item))
		)
	);
}

export function serializeSurfaceTargets(targets: PublicSurface[]) {
	return normalizeSurfaceTargets(targets).join(',');
}

export function parseSurfaceTargets(value: string | null | undefined) {
	return normalizeSurfaceTargets(value ?? DEFAULT_PUBLIC_SURFACES);
}

export function hasSurfaceTarget(value: string | null | undefined, surface: PublicSurface) {
	return parseSurfaceTargets(value).includes(surface);
}

export function classifyPublicSurface(pathname: string): PublicSurface {
	const path = pathname.replace(/\/+$/, '') || '/';
	if (path === '/') return 'home';
	if (path === '/top') return 'top';
	if (path.startsWith('/rovat/')) return 'category';

	const segments = path.slice(1).split('/');
	if (segments.length >= 2) return 'source_category';
	return 'source';
}

export function classifyReferrerSurface(referrer: string | null | undefined) {
	if (!referrer) return null;
	try {
		return classifyPublicSurface(new URL(referrer).pathname);
	} catch {
		return null;
	}
}

export function formatMoney(value: number) {
	return `${Math.max(0, Math.round(value)).toLocaleString('hu-HU')} Ft`;
}

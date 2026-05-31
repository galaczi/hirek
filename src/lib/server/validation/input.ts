import { type as ark } from 'arktype';
import {
	DEFAULT_EXCHANGE_STATUS,
	DEFAULT_PARTNER_PACKAGE,
	DEFAULT_PARTNER_STATUS,
	isExchangeStatus,
	isPartnerPackage,
	isPartnerStatus,
	type ExchangeStatus,
	type PartnerPackage,
	type PartnerStatus
} from '../../source-commercial.ts';
import {
	DEFAULT_TRUST_SCORE,
	isSourceBoostStatus,
	normalizeMoneyAmount,
	normalizeSurfaceTargets,
	normalizeTrustScore,
	type PublicSurface,
	type SourceBoostStatus
} from '../../source-acquisition.ts';

export type ValidationIssue = {
	path: string;
	message: string;
};

export type ValidationFailure = {
	ok: false;
	issues: ValidationIssue[];
	fieldErrors: Partial<Record<string, string>>;
	summary: string;
};

export type ValidationSuccess<T> = {
	ok: true;
	data: T;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const SLUG_MAX_LENGTH = 80;
const DOMAIN_MAX_LENGTH = 253;
const FEED_URL_MAX_LENGTH = 2048;
const URL_PATTERN_MAX_LENGTH = 512;
const PARTNER_NAME_MAX_LENGTH = 120;
const SOURCE_NAME_MAX_LENGTH = 160;
const PASSWORD_MAX_LENGTH = 200;
const PASSWORD_MIN_LENGTH = 12;
const UTM_MAX_LENGTH = 120;
const REFERRER_MAX_LENGTH = 2048;
const USER_AGENT_MAX_LENGTH = 512;
const PAGE_PATH_MAX_LENGTH = 500;
const MAX_IMPRESSION_BATCH_SIZE = 100;

const slugSchema = ark.and(`0 < string <= ${SLUG_MAX_LENGTH}`, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const domainSchema = ark.and(
	`0 < string <= ${DOMAIN_MAX_LENGTH}`,
	/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/
);
const feedUrlSchema = ark.and(`0 < string <= ${FEED_URL_MAX_LENGTH}`, 'string.url');
const urlPatternSchema = ark.and(
	`0 < string <= ${URL_PATTERN_MAX_LENGTH}`,
	/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?:\/[a-z0-9._~!$&'()*+,;=:@%/-]*)?(?:\*)?$/
);
const passwordSchema = ark.and(
	`${PASSWORD_MIN_LENGTH - 1} < string <= ${PASSWORD_MAX_LENGTH}`,
	/^(?=.*[A-Za-z])(?=.*\d).+$/
);
const utmSchema = ark.and(`0 < string <= ${UTM_MAX_LENGTH}`, /^[A-Za-z0-9][A-Za-z0-9._~-]*$/);
const referrerSchema = ark.and(`0 < string <= ${REFERRER_MAX_LENGTH}`, 'string');
const userAgentSchema = ark.and(`0 < string <= ${USER_AGENT_MAX_LENGTH}`, 'string');
const pagePathSchema = ark.and(`0 < string <= ${PAGE_PATH_MAX_LENGTH}`, 'string');
const emailSchema = ark('string.email');
const nonEmptyPartnerNameSchema = ark(`0 < string <= ${PARTNER_NAME_MAX_LENGTH}`);
const nonEmptySourceNameSchema = ark(`0 < string <= ${SOURCE_NAME_MAX_LENGTH}`);
const impressionPayloadSchema = ark({
	articleIds: 'number[]',
	pagePath: 'string | null',
	referrer: 'string | null',
	userAgent: 'string | null'
});
const trackingMetadataSchema = ark({
	referrer: 'string | null',
	userAgent: 'string | null'
});
const partnerSignupSchema = ark({
	partnerName: nonEmptyPartnerNameSchema,
	email: emailSchema,
	password: passwordSchema,
	sourceName: nonEmptySourceNameSchema,
	slug: slugSchema,
	domain: domainSchema
});
const sourceIdentitySchema = ark({
	name: nonEmptySourceNameSchema,
	slug: slugSchema,
	domain: domainSchema
});
const adminSourceCreateSchema = ark({
	name: nonEmptySourceNameSchema,
	slug: slugSchema,
	domain: domainSchema,
	feedUrl: feedUrlSchema
});
const feedInputSchema = ark({
	feedUrl: feedUrlSchema
});
const urlPatternInputSchema = ark({
	urlPattern: urlPatternSchema
});
const utmSettingsSchema = ark({
	utmSource: utmSchema,
	utmMedium: utmSchema,
	utmCampaign: utmSchema
});

export type PartnerSignupInput = typeof partnerSignupSchema.infer;
export type SourceIdentityInput = typeof sourceIdentitySchema.infer;
export type AdminSourceCreateInput = typeof adminSourceCreateSchema.infer;
export type FeedInput = typeof feedInputSchema.infer;
export type UrlPatternInput = typeof urlPatternInputSchema.infer;
export type UtmSettingsInput = typeof utmSettingsSchema.infer;
export type TrackingMetadataInput = typeof trackingMetadataSchema.infer;
export type ImpressionPayloadInput = typeof impressionPayloadSchema.infer;
export type SourceCommercialInput = {
	partnerPackage: PartnerPackage;
	partnerStatus: PartnerStatus;
	exchangeStatus: ExchangeStatus;
	trafficTarget: number;
};
export type SourceAcquisitionInput = {
	trustScore: number;
	boostStatus: SourceBoostStatus;
	boostRouteTargets: PublicSurface[];
	maxCpc: number;
	dailySpendCap: number;
	exchangeCreditBalance: number;
};
export type WalletTopUpInput = {
	amount: number;
	billingName: string;
	billingEmail: string;
};

export function normalizeEmail(value: unknown) {
	return asTrimmedString(value).toLowerCase();
}

export function normalizePartnerName(value: unknown) {
	return normalizeDisplayText(value);
}

export function normalizeSourceName(value: unknown) {
	return normalizeDisplayText(value);
}

export function normalizeSlug(value: unknown) {
	return asTrimmedString(value).toLowerCase();
}

export function normalizeDomain(value: unknown) {
	const raw = asTrimmedString(value).toLowerCase();
	if (!raw) return '';

	const parsed = tryParseUrl(raw.includes('://') ? raw : `https://${raw}`);
	if (parsed && isHttpUrl(parsed)) {
		return normalizeHostname(parsed.hostname);
	}

	return normalizeHostname(
		raw
			.replace(/^https?:\/\//, '')
			.replace(/^www\./, '')
			.replace(/[/?#].*$/, '')
			.replace(/:\d+$/, '')
	);
}

export function normalizeFeedUrl(value: unknown) {
	const raw = asTrimmedString(value);
	if (!raw) return '';

	const parsed = tryParseUrl(raw);
	if (!parsed || !isHttpUrl(parsed)) return raw;

	parsed.hash = '';
	parsed.hostname = parsed.hostname.toLowerCase();
	return parsed.toString();
}

export function normalizeUrlPattern(value: unknown) {
	const raw = asTrimmedString(value).toLowerCase();
	if (!raw) return '';
	if (raw.includes('?') || raw.includes('#')) return raw;

	const wildcardCount = [...raw].filter((char) => char === '*').length;
	if (wildcardCount > 1 || (wildcardCount === 1 && !raw.endsWith('*'))) return raw;

	const hasWildcard = raw.endsWith('*');
	const base = hasWildcard ? raw.slice(0, -1) : raw;
	const parsed = tryParseUrl(base.includes('://') ? base : `https://${base}`);
	if (!parsed || !isHttpUrl(parsed)) return raw;

	const host = normalizeHostname(parsed.hostname);
	if (!host) return raw;

	if (parsed.search || parsed.hash) return raw;

	const path = parsed.pathname === '/' ? '' : parsed.pathname;

	if (hasWildcard) {
		return path ? `${host}${path}*` : `${host}/*`;
	}

	return path ? `${host}${path}` : host;
}

export function normalizeUtmValue(value: unknown) {
	return asTrimmedString(value);
}

export function normalizePartnerPackage(value: unknown) {
	return asTrimmedString(value).toLowerCase();
}

export function normalizePartnerStatus(value: unknown) {
	return asTrimmedString(value).toLowerCase();
}

export function normalizeExchangeStatus(value: unknown) {
	return asTrimmedString(value).toLowerCase();
}

export function normalizeTrafficTarget(value: unknown) {
	const clean = String(value ?? '').trim();
	if (!clean) return 0;

	const parsed = Number(clean);
	if (!Number.isFinite(parsed)) return Number.NaN;
	return Math.max(0, Math.floor(parsed));
}

export function normalizeBoostStatus(value: unknown) {
	return asTrimmedString(value).toLowerCase();
}

export function normalizeBoostRouteTargets(value: unknown) {
	return normalizeSurfaceTargets(value);
}

export function normalizeBillingName(value: unknown) {
	return normalizeDisplayText(value);
}

export function normalizeTrackingMetadata(input: {
	referrer?: string | null;
	userAgent?: string | null;
}) {
	const metadata = {
		referrer: normalizeOptionalBoundedText(input.referrer, REFERRER_MAX_LENGTH),
		userAgent: normalizeOptionalBoundedText(input.userAgent, USER_AGENT_MAX_LENGTH)
	};

	return validateSchema(trackingMetadataSchema, metadata);
}

export function normalizeImpressionPayload(input: {
	articleIds?: unknown;
	pagePath?: unknown;
	referrer?: string | null;
	userAgent?: string | null;
}) {
	const metadata = normalizeTrackingMetadata({
		referrer: input.referrer,
		userAgent: input.userAgent
	});

	if (!metadata.ok) return metadata;

	const payload = {
		articleIds: normalizeArticleIds(input.articleIds),
		pagePath: normalizeOptionalBoundedText(input.pagePath, PAGE_PATH_MAX_LENGTH),
		referrer: metadata.data.referrer,
		userAgent: metadata.data.userAgent
	};

	if (payload.articleIds.length === 0) {
		return createFailure([{ path: 'articleIds', message: 'At least one valid article id is required.' }]);
	}

	return validateSchema(impressionPayloadSchema, payload);
}

export function validatePartnerSignupInput(input: {
	partnerName?: unknown;
	email?: unknown;
	password?: unknown;
	sourceName?: unknown;
	slug?: unknown;
	domain?: unknown;
}) {
	const normalized = {
		partnerName: normalizePartnerName(input.partnerName),
		email: normalizeEmail(input.email),
		password: asTrimmedString(input.password),
		sourceName: normalizeSourceName(input.sourceName),
		slug: normalizeSlug(input.slug),
		domain: normalizeDomain(input.domain)
	};

	return validateRequiredAndSchema(normalized, partnerSignupSchema, {
		partnerName: 'Kapcsolattartó név szükséges.',
		email: 'Email cím szükséges.',
		password: 'Jelszó szükséges.',
		sourceName: 'Forrásnév szükséges.',
		slug: 'Slug szükséges.',
		domain: 'Domain szükséges.'
	});
}

export function validateSourceIdentityInput(input: {
	name?: unknown;
	slug?: unknown;
	domain?: unknown;
}) {
	const normalized = {
		name: normalizeSourceName(input.name),
		slug: normalizeSlug(input.slug),
		domain: normalizeDomain(input.domain)
	};

	return validateRequiredAndSchema(normalized, sourceIdentitySchema, {
		name: 'Név szükséges.',
		slug: 'Slug szükséges.',
		domain: 'Domain szükséges.'
	});
}

export function validateAdminSourceCreateInput(input: {
	name?: unknown;
	slug?: unknown;
	domain?: unknown;
	feedUrl?: unknown;
}) {
	const normalized = {
		name: normalizeSourceName(input.name),
		slug: normalizeSlug(input.slug),
		domain: normalizeDomain(input.domain),
		feedUrl: normalizeFeedUrl(input.feedUrl)
	};

	return validateRequiredAndSchema(normalized, adminSourceCreateSchema, {
		name: 'Név szükséges.',
		slug: 'Slug szükséges.',
		domain: 'Domain szükséges.',
		feedUrl: 'Feed URL szükséges.'
	});
}

export function validateFeedInput(input: { feedUrl?: unknown }) {
	const normalized = {
		feedUrl: normalizeFeedUrl(input.feedUrl)
	};

	return validateRequiredAndSchema(normalized, feedInputSchema, {
		feedUrl: 'Feed URL szükséges.'
	});
}

export function validateUrlPatternInput(input: { urlPattern?: unknown }) {
	const normalized = {
		urlPattern: normalizeUrlPattern(input.urlPattern)
	};

	return validateRequiredAndSchema(normalized, urlPatternInputSchema, {
		urlPattern: 'URL minta szükséges.'
	});
}

export function validateUtmSettingsInput(input: {
	utmSource?: unknown;
	utmMedium?: unknown;
	utmCampaign?: unknown;
}) {
	const normalized = {
		utmSource: normalizeUtmValue(input.utmSource),
		utmMedium: normalizeUtmValue(input.utmMedium),
		utmCampaign: normalizeUtmValue(input.utmCampaign)
	};

	return validateRequiredAndSchema(normalized, utmSettingsSchema, {
		utmSource: 'utm_source szükséges.',
		utmMedium: 'utm_medium szükséges.',
		utmCampaign: 'utm_campaign szükséges.'
	});
}

export function validateSourceCommercialInput(input: {
	partnerPackage?: unknown;
	partnerStatus?: unknown;
	exchangeStatus?: unknown;
	trafficTarget?: unknown;
	approvalStatus?: string | null;
}) {
	const normalized = {
		partnerPackage: normalizePartnerPackage(input.partnerPackage),
		partnerStatus: normalizePartnerStatus(input.partnerStatus),
		exchangeStatus: normalizeExchangeStatus(input.exchangeStatus),
		trafficTarget: normalizeTrafficTarget(input.trafficTarget)
	};
	const issues: ValidationIssue[] = [];

	if (!normalized.partnerPackage) {
		issues.push({ path: 'partnerPackage', message: 'Partner csomag szükséges.' });
	} else if (!isPartnerPackage(normalized.partnerPackage)) {
		issues.push({ path: 'partnerPackage', message: 'Érvénytelen partner csomag.' });
	}

	if (!normalized.partnerStatus) {
		issues.push({ path: 'partnerStatus', message: 'Kereskedelmi állapot szükséges.' });
	} else if (!isPartnerStatus(normalized.partnerStatus)) {
		issues.push({ path: 'partnerStatus', message: 'Érvénytelen kereskedelmi állapot.' });
	}

	if (!normalized.exchangeStatus) {
		issues.push({ path: 'exchangeStatus', message: 'Csereprogram állapot szükséges.' });
	} else if (!isExchangeStatus(normalized.exchangeStatus)) {
		issues.push({ path: 'exchangeStatus', message: 'Érvénytelen csereprogram állapot.' });
	}

	if (Number.isNaN(normalized.trafficTarget)) {
		issues.push({ path: 'trafficTarget', message: 'A célforgalom csak nem negatív szám lehet.' });
	}

	if (input.approvalStatus !== 'approved') {
		if (normalized.partnerStatus && normalized.partnerStatus !== DEFAULT_PARTNER_STATUS) {
			issues.push({
				path: 'partnerStatus',
				message: 'A kereskedelmi állapot csak jóváhagyott forrásnál lehet aktív.'
			});
		}

		if (normalized.exchangeStatus === 'active') {
			issues.push({
				path: 'exchangeStatus',
				message: 'Aktív csereprogram csak jóváhagyott forrásnál állítható be.'
			});
		}
	}

	if (issues.length > 0) return createFailure(issues);

	return {
		ok: true,
		data: {
			partnerPackage: isPartnerPackage(normalized.partnerPackage)
				? normalized.partnerPackage
				: DEFAULT_PARTNER_PACKAGE,
			partnerStatus: isPartnerStatus(normalized.partnerStatus)
				? normalized.partnerStatus
				: DEFAULT_PARTNER_STATUS,
			exchangeStatus: isExchangeStatus(normalized.exchangeStatus)
				? normalized.exchangeStatus
				: DEFAULT_EXCHANGE_STATUS,
			trafficTarget: normalized.trafficTarget
		} satisfies SourceCommercialInput
	} satisfies ValidationSuccess<SourceCommercialInput>;
}

export function validateSourceAcquisitionInput(input: {
	trustScore?: unknown;
	boostStatus?: unknown;
	boostRouteTargets?: unknown;
	maxCpc?: unknown;
	dailySpendCap?: unknown;
	exchangeCreditBalance?: unknown;
	approvalStatus?: string | null;
}) {
	const normalized = {
		trustScore: normalizeTrustScore(input.trustScore),
		boostStatus: normalizeBoostStatus(input.boostStatus),
		boostRouteTargets: normalizeBoostRouteTargets(input.boostRouteTargets),
		maxCpc: normalizeMoneyAmount(input.maxCpc),
		dailySpendCap: normalizeMoneyAmount(input.dailySpendCap),
		exchangeCreditBalance: normalizeMoneyAmount(input.exchangeCreditBalance)
	};
	const issues: ValidationIssue[] = [];

	if (Number.isNaN(normalized.trustScore)) {
		issues.push({ path: 'trustScore', message: 'A bizalmi pontszám 0 és 10 közötti szám lehet.' });
	}
	if (!normalized.boostStatus) {
		issues.push({ path: 'boostStatus', message: 'Boost állapot szükséges.' });
	} else if (!isSourceBoostStatus(normalized.boostStatus)) {
		issues.push({ path: 'boostStatus', message: 'Érvénytelen boost állapot.' });
	}
	if (normalized.boostRouteTargets.length === 0) {
		issues.push({ path: 'boostRouteTargets', message: 'Legalább egy megjelenési felület szükséges.' });
	}
	if (Number.isNaN(normalized.maxCpc)) {
		issues.push({ path: 'maxCpc', message: 'A max CPC csak nem negatív szám lehet.' });
	}
	if (Number.isNaN(normalized.dailySpendCap)) {
		issues.push({ path: 'dailySpendCap', message: 'A napi limit csak nem negatív szám lehet.' });
	}
	if (Number.isNaN(normalized.exchangeCreditBalance)) {
		issues.push({
			path: 'exchangeCreditBalance',
			message: 'A csereprogram kredit csak nem negatív szám lehet.'
		});
	}

	if (input.approvalStatus !== 'approved' && normalized.boostStatus === 'active') {
		issues.push({
			path: 'boostStatus',
			message: 'Boost csak jóváhagyott forrásnál lehet aktív.'
		});
	}

	if (issues.length > 0) return createFailure(issues);

	return {
		ok: true,
		data: {
			trustScore: Number.isNaN(normalized.trustScore) ? DEFAULT_TRUST_SCORE : normalized.trustScore,
			boostStatus: isSourceBoostStatus(normalized.boostStatus)
				? normalized.boostStatus
				: 'paused',
			boostRouteTargets: normalized.boostRouteTargets,
			maxCpc: normalized.maxCpc,
			dailySpendCap: normalized.dailySpendCap,
			exchangeCreditBalance: normalized.exchangeCreditBalance
		} satisfies SourceAcquisitionInput
	} satisfies ValidationSuccess<SourceAcquisitionInput>;
}

export function validateWalletTopUpInput(input: {
	amount?: unknown;
	billingName?: unknown;
	billingEmail?: unknown;
}) {
	const normalized = {
		amount: normalizeMoneyAmount(input.amount),
		billingName: normalizeBillingName(input.billingName),
		billingEmail: normalizeEmail(input.billingEmail)
	};
	const issues: ValidationIssue[] = [];

	if (Number.isNaN(normalized.amount) || normalized.amount <= 0) {
		issues.push({ path: 'amount', message: 'A feltöltés összege pozitív szám legyen.' });
	}
	if (!normalized.billingName) {
		issues.push({ path: 'billingName', message: 'Számlázási név szükséges.' });
	}
	const emailResult = validateSchema(emailSchema, normalized.billingEmail);
	if (!normalized.billingEmail) {
		issues.push({ path: 'billingEmail', message: 'Számlázási email szükséges.' });
	} else if (!emailResult.ok) {
		issues.push({ path: 'billingEmail', message: 'Érvényes számlázási email szükséges.' });
	}

	if (issues.length > 0) return createFailure(issues);

	return {
		ok: true,
		data: normalized satisfies WalletTopUpInput
	} satisfies ValidationSuccess<WalletTopUpInput>;
}

function validateRequiredAndSchema<T extends Record<string, string>>(
	values: T,
	schema: (value: T) => T | InstanceType<typeof ark.errors>,
	requiredMessages: Partial<Record<keyof T, string>>
): ValidationResult<T> {
	const missingIssues: ValidationIssue[] = [];

	for (const [key, message] of Object.entries(requiredMessages)) {
		if (!values[key]) {
			missingIssues.push({ path: key, message: message ?? 'This field is required.' });
		}
	}

	if (missingIssues.length > 0) return createFailure(missingIssues);
	return validateSchema(schema, values);
}

function validateSchema<T>(
	schema: (value: T) => T | InstanceType<typeof ark.errors>,
	value: T
): ValidationResult<T> {
	const result = schema(value);
	if (result instanceof ark.errors) {
		return createFailure(mapArkErrors(result));
	}

	return {
		ok: true,
		data: result as T
	};
}

function createFailure(issues: ValidationIssue[]): ValidationFailure {
	const fieldErrors: Partial<Record<string, string>> = {};

	for (const issue of issues) {
		if (!fieldErrors[issue.path]) {
			fieldErrors[issue.path] = issue.message;
		}
	}

	return {
		ok: false,
		issues,
		fieldErrors,
		summary: issues.map((issue) => issue.message).join(' ')
	};
}

function mapArkErrors(errors: InstanceType<typeof ark.errors>): ValidationIssue[] {
	return Object.entries(errors.flatByPath).flatMap(([path, pathErrors]) =>
		pathErrors.map((error) => ({
			path: path || rootPath(error.propString),
			message: error.message
		}))
	);
}

function rootPath(propString: string) {
	return propString.split(/[.[\]]/, 1)[0] ?? 'form';
}

function normalizeArticleIds(value: unknown) {
	if (!Array.isArray(value)) return [];
	const ids = value
		.map((item) => Number(item))
		.filter((id) => Number.isInteger(id) && id > 0)
		.slice(0, MAX_IMPRESSION_BATCH_SIZE);

	return Array.from(new Set(ids));
}

function normalizeDisplayText(value: unknown) {
	return asTrimmedString(value).replace(/\s+/g, ' ');
}

function normalizeOptionalBoundedText(value: unknown, maxLength: number) {
	const clean = asTrimmedString(value);
	if (!clean) return null;
	return clean.slice(0, maxLength);
}

function normalizeHostname(hostname: string) {
	return hostname.toLowerCase().replace(/^www\./, '').replace(/\.+$/, '');
}

function tryParseUrl(value: string) {
	try {
		return new URL(value);
	} catch {
		return null;
	}
}

function isHttpUrl(url: URL) {
	return url.protocol === 'http:' || url.protocol === 'https:';
}

function asTrimmedString(value: unknown) {
	return String(value ?? '').trim();
}

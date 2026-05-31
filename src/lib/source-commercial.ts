export const PARTNER_PACKAGE_VALUES = ['free', 'partner', 'growth'] as const;
export type PartnerPackage = (typeof PARTNER_PACKAGE_VALUES)[number];

export const PARTNER_STATUS_VALUES = ['none', 'trial', 'active', 'paused', 'cancelled'] as const;
export type PartnerStatus = (typeof PARTNER_STATUS_VALUES)[number];

export const EXCHANGE_STATUS_VALUES = ['none', 'eligible', 'active', 'paused'] as const;
export type ExchangeStatus = (typeof EXCHANGE_STATUS_VALUES)[number];

export const DEFAULT_PARTNER_PACKAGE: PartnerPackage = 'free';
export const DEFAULT_PARTNER_STATUS: PartnerStatus = 'none';
export const DEFAULT_APPROVED_PARTNER_STATUS: PartnerStatus = 'active';
export const DEFAULT_EXCHANGE_STATUS: ExchangeStatus = 'none';
export const DEFAULT_APPROVED_EXCHANGE_STATUS: ExchangeStatus = 'eligible';

export const partnerPackageLabels: Record<string, string> = {
	free: 'Ingyenes csomag',
	partner: 'Partner csomag',
	growth: 'Növekedési csomag'
};

export const partnerStatusLabels: Record<string, string> = {
	none: 'Még nincs aktiválva',
	trial: 'Próbaidőszak',
	active: 'Aktív',
	paused: 'Szüneteltetett',
	cancelled: 'Lezárt'
};

export const exchangeStatusLabels: Record<string, string> = {
	none: 'Nincs csereprogram',
	eligible: 'Elérhető csereprogram',
	active: 'Aktív csereprogram',
	paused: 'Szünetelő csereprogram'
};

export const partnerPackageDescriptions: Record<string, string> = {
	free: 'Alap megjelenés garantált prémium forgalmi vállalás nélkül.',
	partner: 'Emelt partnerjelenlét célzott forgalmi vállalással és kiemelt figyelemmel.',
	growth: 'Növekedési csomag agresszívebb forgalmi céllal és prémium támogatással.'
};

export const exchangeStatusDescriptions: Record<string, string> = {
	none: 'Ehhez a forráshoz jelenleg nincs csereprogram beállítva.',
	eligible: 'A forrás alkalmas csereprogramra, de még nincs aktiválva.',
	active: 'A forrás részt vesz a kölcsönös forgalomnövelő csereprogramban.',
	paused: 'A csereprogram ideiglenesen szünetel ennél a forrásnál.'
};

export function isPartnerPackage(value: string | null | undefined): value is PartnerPackage {
	return PARTNER_PACKAGE_VALUES.includes((value ?? '') as PartnerPackage);
}

export function isPartnerStatus(value: string | null | undefined): value is PartnerStatus {
	return PARTNER_STATUS_VALUES.includes((value ?? '') as PartnerStatus);
}

export function isExchangeStatus(value: string | null | undefined): value is ExchangeStatus {
	return EXCHANGE_STATUS_VALUES.includes((value ?? '') as ExchangeStatus);
}

export function getPendingCommercialDefaults() {
	return {
		partnerPackage: DEFAULT_PARTNER_PACKAGE,
		partnerStatus: DEFAULT_PARTNER_STATUS,
		exchangeStatus: DEFAULT_EXCHANGE_STATUS,
		trafficTarget: 0
	};
}

export function getApprovedCommercialDefaults(input: {
	partnerPackage?: string | null;
	partnerStatus?: string | null;
	exchangeStatus?: string | null;
	trafficTarget?: number | null;
}) {
	return {
		partnerPackage: isPartnerPackage(input.partnerPackage)
			? input.partnerPackage
			: DEFAULT_PARTNER_PACKAGE,
		partnerStatus:
			isPartnerStatus(input.partnerStatus) && input.partnerStatus !== DEFAULT_PARTNER_STATUS
				? input.partnerStatus
				: DEFAULT_APPROVED_PARTNER_STATUS,
		exchangeStatus:
			isExchangeStatus(input.exchangeStatus) && input.exchangeStatus !== DEFAULT_EXCHANGE_STATUS
				? input.exchangeStatus
				: DEFAULT_APPROVED_EXCHANGE_STATUS,
		trafficTarget: Math.max(0, input.trafficTarget ?? 0)
	};
}

export function getTrafficTargetProgress(trafficTarget: number, clickCount: number) {
	if (trafficTarget <= 0) {
		return {
			hasTarget: false,
			target: 0,
			clickCount,
			remaining: 0,
			progressPercent: null as number | null
		};
	}

	return {
		hasTarget: true,
		target: trafficTarget,
		clickCount,
		remaining: Math.max(0, trafficTarget - clickCount),
		progressPercent: Math.min(999, Math.round((clickCount / trafficTarget) * 100))
	};
}

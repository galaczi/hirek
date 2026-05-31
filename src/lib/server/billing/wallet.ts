import { eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { sourceBillingInvoices, sourceBillingLedger, sources } from '$lib/server/db/schema';
import { hasSurfaceTarget, type AcquisitionMode, type PublicSurface } from '$lib/source-acquisition';
import { createSzamlazzInvoice } from '$lib/server/billing/szamlazz';
import { getSourceSpendToday } from '$lib/server/articles/stats';

type SourceFundingState = {
	id: number;
	name: string;
	approvalStatus: string;
	boostStatus: string;
	boostRouteTargets: string;
	exchangeStatus: string;
	walletBalance: number;
	exchangeCreditBalance: number;
	maxCpc: number;
	dailySpendCap: number;
};

export async function createWalletTopUp(input: {
	sourceId: number;
	sourceName: string;
	amount: number;
	billingName: string;
	billingEmail: string;
}) {
	const invoice = await createSzamlazzInvoice({
		sourceName: input.sourceName,
		amount: input.amount,
		billingName: input.billingName,
		billingEmail: input.billingEmail,
		description: `Hírkereső wallet feltöltés (${input.amount.toLocaleString('hu-HU')} Ft)`
	});

	return db.transaction(async (tx) => {
		const [createdInvoice] = await tx
			.insert(sourceBillingInvoices)
			.values({
				sourceId: input.sourceId,
				amount: input.amount,
				status: invoice.status,
				provider: invoice.provider,
				externalId: invoice.externalId,
				externalNumber: invoice.externalNumber,
				description: 'Wallet feltöltés'
			})
			.returning({ id: sourceBillingInvoices.id });

		await tx
			.update(sources)
			.set({
				walletBalance: sql`${sources.walletBalance} + ${input.amount}`,
				updatedAt: new Date()
			})
			.where(eq(sources.id, input.sourceId));

		await tx.insert(sourceBillingLedger).values({
			sourceId: input.sourceId,
			invoiceId: createdInvoice.id,
			entryType: 'topup',
			fundingType: 'wallet',
			amount: input.amount,
			description: 'Partner wallet feltöltés'
		});

		return createdInvoice;
	});
}

export async function resolveBillableClick(input: {
	sourceId: number;
	articleId: number;
	surface: PublicSurface | null;
	requestedMode: AcquisitionMode;
	isUnique: boolean;
}) {
	if (
		!input.isUnique ||
		!input.surface ||
		input.surface === 'source' ||
		input.surface === 'source_category' ||
		input.requestedMode === 'organic'
	) {
		return {
			acquisitionMode: 'organic' as AcquisitionMode,
			chargeAmount: 0
		};
	}

	const [source] = await db
		.select({
			id: sources.id,
			name: sources.name,
				approvalStatus: sources.approvalStatus,
				boostStatus: sources.boostStatus,
				boostRouteTargets: sources.boostRouteTargets,
				exchangeStatus: sources.exchangeStatus,
			walletBalance: sources.walletBalance,
			exchangeCreditBalance: sources.exchangeCreditBalance,
			maxCpc: sources.maxCpc,
			dailySpendCap: sources.dailySpendCap
		})
		.from(sources)
		.where(eq(sources.id, input.sourceId))
		.limit(1);

	if (
		!source ||
		source.approvalStatus !== 'approved' ||
		source.boostStatus !== 'active' ||
		!hasSurfaceTarget(source.boostRouteTargets, input.surface)
	) {
		return { acquisitionMode: 'organic' as AcquisitionMode, chargeAmount: 0 };
	}

	const dailySpend = await getDailySpend(input.sourceId);
	if (source.maxCpc <= 0 || (source.dailySpendCap > 0 && dailySpend >= source.dailySpendCap)) {
		return { acquisitionMode: 'organic' as AcquisitionMode, chargeAmount: 0 };
	}

	if (
		input.requestedMode === 'exchange' &&
		source.exchangeStatus === 'active' &&
		source.exchangeCreditBalance >= source.maxCpc
	) {
		await recordCharge({
			source,
			articleId: input.articleId,
			surface: input.surface,
			chargeAmount: source.maxCpc,
			acquisitionMode: 'exchange'
		});
		return { acquisitionMode: 'exchange' as AcquisitionMode, chargeAmount: source.maxCpc };
	}

	if (source.walletBalance >= source.maxCpc) {
		await recordCharge({
			source,
			articleId: input.articleId,
			surface: input.surface,
			chargeAmount: source.maxCpc,
			acquisitionMode: 'paid'
		});
		return { acquisitionMode: 'paid' as AcquisitionMode, chargeAmount: source.maxCpc };
	}

	return { acquisitionMode: 'organic' as AcquisitionMode, chargeAmount: 0 };
}

async function getDailySpend(sourceId: number) {
	return getSourceSpendToday(sourceId);
}

async function recordCharge(input: {
	source: SourceFundingState;
	articleId: number;
	surface: PublicSurface | null;
	chargeAmount: number;
	acquisitionMode: 'paid' | 'exchange';
}) {
	const amountColumn =
		input.acquisitionMode === 'exchange'
			? sources.exchangeCreditBalance
			: sources.walletBalance;
	const lifetimeColumn =
		input.acquisitionMode === 'exchange'
			? sources.lifetimeExchangeSpend
			: sources.lifetimeWalletSpend;

	await db.transaction(async (tx) => {
		await tx
			.update(sources)
			.set({
				walletBalance:
					input.acquisitionMode === 'paid'
						? sql`${amountColumn} - ${input.chargeAmount}`
						: sql`${sources.walletBalance}`,
				exchangeCreditBalance:
					input.acquisitionMode === 'exchange'
						? sql`${amountColumn} - ${input.chargeAmount}`
						: sql`${sources.exchangeCreditBalance}`,
				lifetimeBillableClicks: sql`${sources.lifetimeBillableClicks} + 1`,
				lifetimeWalletSpend:
					input.acquisitionMode === 'paid'
						? sql`${lifetimeColumn} + ${input.chargeAmount}`
						: sql`${sources.lifetimeWalletSpend}`,
				lifetimeExchangeSpend:
					input.acquisitionMode === 'exchange'
						? sql`${lifetimeColumn} + ${input.chargeAmount}`
						: sql`${sources.lifetimeExchangeSpend}`,
				updatedAt: new Date()
			})
			.where(eq(sources.id, input.source.id));

		await tx.insert(sourceBillingLedger).values({
			sourceId: input.source.id,
			entryType: 'click_charge',
			fundingType: input.acquisitionMode,
			surface: input.surface,
			articleId: input.articleId,
			amount: -input.chargeAmount,
			description: `${input.acquisitionMode === 'exchange' ? 'Csereprogram' : 'Fizetett'} kattintás`
		});
	});
}

import { env } from '$env/dynamic/private';

export type InvoiceRequest = {
	sourceName: string;
	amount: number;
	billingName: string;
	billingEmail: string;
	description: string;
};

export type InvoiceResponse = {
	provider: 'szamlazz.hu' | 'local';
	status: 'issued' | 'pending';
	externalId: string | null;
	externalNumber: string | null;
};

export async function createSzamlazzInvoice(input: InvoiceRequest): Promise<InvoiceResponse> {
	if (!env.SZAMLAZZHU_AGENT_KEY || !env.SZAMLAZZHU_BASE_URL) {
		return {
			provider: 'local',
			status: 'pending',
			externalId: null,
			externalNumber: `LOCAL-${Date.now()}`
		};
	}

	const response = await fetch(`${env.SZAMLAZZHU_BASE_URL.replace(/\/+$/, '')}/invoices`, {
		method: 'POST',
		headers: {
			authorization: `Bearer ${env.SZAMLAZZHU_AGENT_KEY}`,
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			customer: {
				name: input.billingName,
				email: input.billingEmail
			},
			document: {
				subject: input.description,
				comment: `Forrás: ${input.sourceName}`
			},
			items: [
				{
					name: input.description,
					quantity: 1,
					unit_price: input.amount
				}
			]
		})
	});

	if (!response.ok) {
		throw new Error(`Számlázz invoice creation failed with status ${response.status}`);
	}

	const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

	return {
		provider: 'szamlazz.hu',
		status: 'issued',
		externalId: typeof payload.id === 'string' ? payload.id : null,
		externalNumber: typeof payload.invoiceNumber === 'string' ? payload.invoiceNumber : null
	};
}

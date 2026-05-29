import assert from 'node:assert/strict';
import test from 'node:test';
import {
	normalizeDomain,
	normalizeImpressionPayload,
	normalizeTrackingMetadata,
	validateAdminSourceCreateInput,
	validatePartnerSignupInput,
	validateUtmSettingsInput
} from './input.ts';

test('partner signup validation normalizes canonical identifiers', () => {
	const result = validatePartnerSignupInput({
		partnerName: '  Teszt Partner  ',
		email: 'USER@Example.com ',
		password: 'password1234',
		sourceName: '  Forras  ',
		slug: 'My-Slug',
		domain: 'https://www.Example.com/news/'
	});

	assert.equal(result.ok, true);
	if (!result.ok) return;

	assert.deepEqual(result.data, {
		partnerName: 'Teszt Partner',
		email: 'user@example.com',
		password: 'password1234',
		sourceName: 'Forras',
		slug: 'my-slug',
		domain: 'example.com'
	});
});

test('partner signup validation rejects weak passwords', () => {
	const result = validatePartnerSignupInput({
		partnerName: 'Teszt Partner',
		email: 'user@example.com',
		password: 'alllettersonly',
		sourceName: 'Forras',
		slug: 'my-slug',
		domain: 'example.com'
	});

	assert.equal(result.ok, false);
	if (result.ok) return;

	assert.match(result.fieldErrors.password ?? '', /must be|required/i);
});

test('canonical domain normalization collapses equivalent variants', () => {
	assert.equal(normalizeDomain('https://www.Example.com/news/'), 'example.com');
	assert.equal(normalizeDomain('example.com'), 'example.com');
	assert.equal(normalizeDomain('EXAMPLE.COM/rovat'), 'example.com');
});

test('admin source validation rejects malformed feed URLs', () => {
	const result = validateAdminSourceCreateInput({
		name: 'Forras',
		slug: 'forras',
		domain: 'example.com',
		feedUrl: 'example.com/rss'
	});

	assert.equal(result.ok, false);
	if (result.ok) return;

	assert.ok(result.fieldErrors.feedUrl);
});

test('partner utm validation rejects unsupported characters', () => {
	const result = validateUtmSettingsInput({
		utmSource: 'hirek source',
		utmMedium: 'referral',
		utmCampaign: 'hirek_stream'
	});

	assert.equal(result.ok, false);
	if (result.ok) return;

	assert.ok(result.fieldErrors.utmSource);
});

test('tracking metadata is trimmed and bounded before persistence', () => {
	const longReferrer = `https://example.com/${'a'.repeat(3000)}`;
	const longUserAgent = `agent-${'b'.repeat(600)}`;

	const result = normalizeTrackingMetadata({
		referrer: ` ${longReferrer} `,
		userAgent: ` ${longUserAgent} `
	});

	assert.equal(result.ok, true);
	if (!result.ok) return;

	assert.equal(result.data.referrer?.length, 2048);
	assert.equal(result.data.userAgent?.length, 512);
	assert.ok(result.data.referrer?.startsWith('https://example.com/'));
	assert.ok(result.data.userAgent?.startsWith('agent-'));
});

test('impression payload normalization deduplicates ids and bounds metadata', () => {
	const result = normalizeImpressionPayload({
		articleIds: ['1', '2', '2', '-1', 'abc'],
		pagePath: ` /partner/${'x'.repeat(600)} `,
		referrer: ' https://example.com/path ',
		userAgent: ' test-agent '
	});

	assert.equal(result.ok, true);
	if (!result.ok) return;

	assert.deepEqual(result.data.articleIds, [1, 2]);
	assert.equal(result.data.pagePath?.length, 500);
	assert.equal(result.data.referrer, 'https://example.com/path');
	assert.equal(result.data.userAgent, 'test-agent');
});

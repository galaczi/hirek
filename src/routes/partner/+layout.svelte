<script lang="ts">
	import { page } from '$app/state';
	import InternalShellHeader from '$lib/components/internal/InternalShellHeader.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const csvExportHref = $derived(`/partner/clicks.csv${page.url.search}`);
	const navItems = $derived([
		{ href: '/partner/', label: 'Áttekintés', active: page.url.pathname === '/partner/' },
		{ href: csvExportHref, label: 'CSV export' },
		...(data.isAdmin ? [{ href: '/admin/', label: 'Admin' }] : [])
	]);
</script>

<main class="app-container partner-page internal-shell">
	<InternalShellHeader
		section="Partner"
		title="Partner portál"
		subtitle="Kattintás- és hírcsatorna analitika, UTM követőkódok és kategória-szabályok kezelése."
		navItems={navItems}
	/>

	{@render children()}
</main>

<style>
	.partner-page {
		display: grid;
		gap: 1.5rem;
		margin-top: 1.5rem;
	}
</style>

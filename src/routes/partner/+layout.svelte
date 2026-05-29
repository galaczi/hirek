<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const csvExportHref = $derived(`/partner/clicks.csv${page.url.search}`);
</script>

<main class="app-container admin-page">
	<header class="admin-shell-header">
		<div>
			<p class="section-kicker">Partner</p>
			<h1>Partner portál</h1>
		</div>
		<nav class="admin-shell-nav" aria-label="Partner navigáció">
			<a href="/partner/" class="active">Áttekintés</a>
			<a href={csvExportHref}>CSV export</a>
			{#if data.isAdmin}
				<a href="/admin/">Admin</a>
			{/if}
		</nav>
	</header>

	{@render children()}
</main>

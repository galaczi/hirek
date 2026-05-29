<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const navItems = [
		{ href: '/admin/', label: 'Irányítópult' },
		{ href: '/admin/sites/', label: 'Források' },
		{ href: '/admin/articles/', label: 'Cikkek' },
		{ href: '/admin/ingestion/', label: 'Adatgyűjtés' },
		{ href: '/partner/', label: 'Partner portál' }
	];

	const titles: Record<string, { section: string; title: string }> = {
		'/admin/': { section: 'Admin', title: 'Irányítópult' },
		'/admin/sites/': { section: 'Admin', title: 'Források' },
		'/admin/articles/': { section: 'Admin', title: 'Cikkmoderáció' },
		'/admin/ingestion/': { section: 'Admin', title: 'Adatgyűjtés' }
	};
	const current = $derived(getCurrentTitle(page.url.pathname));

	function isActive(href: string) {
		if (href === '/admin/') return page.url.pathname === href;
		return page.url.pathname === href || page.url.pathname.startsWith(href);
	}

	function getCurrentTitle(pathname: string) {
		if (pathname.startsWith('/admin/sites/')) return titles['/admin/sites/'];
		if (pathname.startsWith('/admin/articles/')) return titles['/admin/articles/'];
		if (pathname.startsWith('/admin/ingestion/')) return titles['/admin/ingestion/'];
		return titles[pathname] ?? titles['/admin/'];
	}
</script>

<main class="app-container admin-page">
	<header class="admin-shell-header">
		<div>
			<p class="section-kicker">{current.section}</p>
			<h1>{current.title}</h1>
		</div>
		<nav class="admin-shell-nav" aria-label="Admin navigáció">
			{#each navItems as item (item.href)}
				<a href={item.href} class:active={isActive(item.href)}>{item.label}</a>
			{/each}
		</nav>
	</header>

	{@render children()}
</main>

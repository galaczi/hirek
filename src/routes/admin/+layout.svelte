<script lang="ts">
	import { page } from '$app/state';
	import InternalShellHeader from '$lib/components/internal/InternalShellHeader.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const navItemsSource = [
		{ href: '/admin/', label: 'Irányítópult' },
		{ href: '/admin/sites/', label: 'Források' },
		{ href: '/admin/articles/', label: 'Cikkek' },
		{ href: '/admin/ingestion/', label: 'Adatgyűjtés' },
		{ href: '/partner/', label: 'Partner portál' }
	];

	const titles: Record<string, { section: string; title: string; subtitle: string }> = {
		'/admin/': {
			section: 'Admin',
			title: 'Irányítópult',
			subtitle:
				'A napi állapotkép, az indítási készültség és a legfontosabb operatív döntési pontok egy felületen.'
		},
		'/admin/sites/': {
			section: 'Admin',
			title: 'Források',
			subtitle:
				'Forrásidentitás, feedek, jóváhagyási állapotok és szerkesztői karbantartás rendezett belső nézetben.'
		},
		'/admin/articles/': {
			section: 'Admin',
			title: 'Cikkmoderáció',
			subtitle:
				'A legfrissebb cikkek állapotkezelése, gyors szűrés és rangsorolható ellenőrzési nézet.'
		},
		'/admin/ingestion/': {
			section: 'Admin',
			title: 'Adatgyűjtés',
			subtitle:
				'A feed- és feldolgozófolyamatok vezérlése, queue állapotok és hibakeresési belépési pontok.'
		}
	};
	const current = $derived(getCurrentTitle(page.url.pathname));
	const navItems = $derived(
		navItemsSource.map((item) => ({
			...item,
			active: isActive(item.href)
		}))
	);

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

<main class="app-container admin-page internal-shell">
	<InternalShellHeader
		section={current.section}
		title={current.title}
		subtitle={current.subtitle}
		navItems={navItems}
	/>

	{@render children()}
</main>

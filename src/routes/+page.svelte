<script lang="ts">
	import { browser } from '$app/environment';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import HomeHeader from '$lib/components/home/HomeHeader.svelte';
	import HomeRail from '$lib/components/home/HomeRail.svelte';
	import HomeSidebar from '$lib/components/home/HomeSidebar.svelte';
	import NewsFeed from '$lib/components/home/NewsFeed.svelte';
	import Toast from '$lib/components/home/Toast.svelte';
	import {
		exchangeRates,
		horoscopeTexts,
		timeFilters,
		weatherData
	} from '$lib/home/data';
	import { matchesTimeFilter } from '$lib/home/utils';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let searchQuery = $derived(data.searchQuery);
	let weatherCity = $state('Budapest');
	let horoscopeSign = $state('kos');
	let visibleCount = $state(18);
	let bookmarks = $state<number[]>([]);
	let revealedLiveArticles = $state<typeof data.streamArticles>([]);
	let pendingLiveArticles = $state<typeof data.streamArticles>([]);
	let toastMessage = $state('');
	let toastVisible = $state(false);
	let toastAction = $state<(() => void) | undefined>(undefined);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	const articles = $derived([...revealedLiveArticles, ...data.streamArticles]);
	const topArticles = $derived(data.topArticles.length > 0 ? data.topArticles : data.articles.slice(0, 10));
	const categoryNames = $derived(
		Object.fromEntries(data.categories.map((category) => [category.slug, category.name]))
	);
	const filteredArticles = $derived(articles);
	const visibleArticles = $derived(filteredArticles.slice(0, visibleCount));
	const savedArticles = $derived(articles.filter((article) => bookmarks.includes(article.id)));

	afterNavigate(() => {
		visibleCount = 18;
		revealedLiveArticles = [];
		pendingLiveArticles = [];
	});

	onMount(() => {
		const saved = localStorage.getItem('hirek_bookmarks');
		if (saved) {
			try {
				bookmarks = JSON.parse(saved);
			} catch {
				bookmarks = [];
			}
		}

		const events = new EventSource('/api/hirek/live');
		events.addEventListener('article', (event) => {
			let article: (typeof data.streamArticles)[number];
			try {
				article = JSON.parse((event as MessageEvent).data);
			} catch {
				return;
			}
			if (!matchesActiveFilters(article)) return;
			if (articles.some((item) => item.id === article.id)) return;
			if (pendingLiveArticles.some((item) => item.id === article.id)) return;

			pendingLiveArticles = [article, ...pendingLiveArticles];
			showToast(`${pendingLiveArticles.length} új hír érkezett`, revealPendingArticles, 8000);
		});

		return () => events.close();
	});

	function categoryCount(slug: string) {
		const category = data.categories.find((item) => item.slug === slug);
		return category?.count ?? 0;
	}

	function selectCategory(slug: string) {
		updateFilter('category', slug);
	}

	function selectTimeFilter(value: string) {
		updateFilter('time', value);
	}

	function togglePublisher(slug: string) {
		const next = data.activePublisher === slug ? 'all' : slug;
		updateFilter('source', next);
	}

	function toggleBookmark(id: number) {
		const article = articles.find((item) => item.id === id);
		const exists = bookmarks.includes(id);

		bookmarks = exists ? bookmarks.filter((item) => item !== id) : [...bookmarks, id];
		if (browser) localStorage.setItem('hirek_bookmarks', JSON.stringify(bookmarks));
		showToast(exists ? 'Eltávolítva a könyvjelzők közül!' : `${article?.sourceName ?? 'Hír'} mentve.`);
	}

	function revealPendingArticles() {
		const uniquePending = pendingLiveArticles.filter(
			(article) => !revealedLiveArticles.some((item) => item.id === article.id)
		);
		revealedLiveArticles = [...uniquePending, ...revealedLiveArticles];
		pendingLiveArticles = [];
		visibleCount += uniquePending.length;
		toastVisible = false;
		toastAction = undefined;
	}

	function matchesActiveFilters(article: (typeof data.streamArticles)[number]) {
		if (data.activeCategory !== 'all' && !article.categorySlugs.includes(data.activeCategory)) return false;
		if (data.activePublisher !== 'all' && article.source !== data.activePublisher) return false;
		if (!matchesTimeFilter(article, data.activeTimeFilter)) return false;
		return true;
	}

	function updateFilter(name: 'category' | 'source' | 'time', value: string) {
		if (!browser) return;
		const params = new URLSearchParams(page.url.searchParams);
		if (value === 'all') {
			params.delete(name);
		} else {
			params.set(name, value);
		}
		const query = params.toString();
		void goto(query ? `/?${query}` : '/', { keepFocus: true, noScroll: true });
	}

	function showToast(message: string, action?: () => void, duration = 2400) {
		toastMessage = message;
		toastAction = action;
		toastVisible = true;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toastVisible = false;
			toastAction = undefined;
		}, duration);
	}
</script>

<svelte:head>
	<title>hirek.hu - Friss magyar hírek</title>
	<meta
		name="description"
		content="Magyar hírek gyors, letisztult hírfolyama forrás, rovat és idő szerinti szűréssel."
	/>
</svelte:head>

<HomeHeader
	bind:searchQuery
	todayLabel={data.todayLabel}
	activeCategory={data.activeCategory}
	activePublisher={data.activePublisher}
	activeTimeFilter={data.activeTimeFilter}
/>

<main class="app-container">
	{#if data.loadError}
		<div class="empty-state">
			<strong>Az adatbázis még nem ad híreket.</strong>
			<span>{data.loadError}</span>
		</div>
	{/if}

	<div class="main-grid">
		<HomeSidebar
			categories={data.categories}
			activeCategory={data.activeCategory}
			bind:weatherCity
			bind:horoscopeSign
			{weatherData}
			{exchangeRates}
			{horoscopeTexts}
			{categoryCount}
			onCategoryChange={selectCategory}
		/>

		<NewsFeed
			publishers={data.publishers}
			{timeFilters}
			activeTimeFilter={data.activeTimeFilter}
			activePublisher={data.activePublisher}
			bind:visibleCount
			{filteredArticles}
			{visibleArticles}
			{categoryNames}
			{bookmarks}
			searchQuery={data.searchQuery}
			searchTotal={data.searchTotal}
			searchEngine={data.searchEngine}
			searchError={data.searchError}
			onPublisherToggle={togglePublisher}
			onTimeFilterChange={selectTimeFilter}
			onBookmarkToggle={toggleBookmark}
		/>

		<HomeRail {topArticles} {savedArticles} onBookmarkToggle={toggleBookmark} />
	</div>
</main>

<Toast visible={toastVisible} message={toastMessage} onClick={toastAction} />

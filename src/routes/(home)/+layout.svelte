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
	import type { Article } from '$lib/home/data';
	import { matchesTimeFilter } from '$lib/home/utils';
	import { onMount } from 'svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	let searchQuery = $derived(data.searchQuery);
	let weatherCity = $state('Budapest');
	let showExcerpt = $state(false);
	let fontSize = $state(14);
	let horoscopeSign = $state('kos');
	let visibleCount = $state(18);
	let bookmarks = $state<Article[]>([]);
	let revealedLiveArticles = $state<typeof data.streamArticles>([]);
	let freshArticleIds = $state<number[]>([]);
	let liveToastCount = $state(0);
	let toastMessage = $state('');
	let toastVisible = $state(false);
	let toastAction = $state<(() => void) | undefined>(undefined);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	let freshArticleTimers: ReturnType<typeof setTimeout>[] = [];
	let impressionPageKey = '';
	const loggedImpressionIds = new Set<number>();

	const BOOKMARK_STORAGE_KEY = 'hirek_bookmarks';
	const BOOKMARK_LIMIT = 100;
	const FRESH_ARTICLE_WINDOW_MS = 60_000;

	const articles = $derived([...revealedLiveArticles, ...data.streamArticles]);
	const topArticles = $derived(data.topArticles.length > 0 ? data.topArticles : data.articles.slice(0, 10));
	const categoryNames = $derived(
		Object.fromEntries(data.categories.map((category) => [category.slug, category.name]))
	);
	const filteredArticles = $derived(articles);
	const visibleArticles = $derived(filteredArticles.slice(0, visibleCount));
	const bookmarkedIds = $derived(bookmarks.map((article) => article.id));
	const savedArticles = $derived(bookmarks.slice(0, 8));
	const liveUrl = $derived.by(() => {
		const params = new URLSearchParams();
		if (data.activePublisher !== 'all') params.set('source', data.activePublisher);
		if (data.activeCategory !== 'all') params.set('category', data.activeCategory);
		if (data.activeTimeFilter !== 'all') params.set('time', data.activeTimeFilter);
		if (data.searchQuery) params.set('q', data.searchQuery);
		const query = params.toString();
		return query ? `/api/hirek/live?${query}` : '/api/hirek/live';
	});

	afterNavigate(() => {
		visibleCount = 18;
		revealedLiveArticles = [];
		freshArticleIds = [];
		liveToastCount = 0;
		toastVisible = false;
		toastAction = undefined;
		if (toastTimer) clearTimeout(toastTimer);
		clearFreshArticleTimers();
	});

	onMount(() => {
		bookmarks = loadBookmarks();

		return () => {
			clearFreshArticleTimers();
			if (toastTimer) clearTimeout(toastTimer);
		};
	});

	$effect(() => {
		if (!browser) return;

		const events = new EventSource(liveUrl);
		events.addEventListener('article', handleLiveArticle);

		return () => {
			events.removeEventListener('article', handleLiveArticle);
			events.close();
		};
	});

	$effect(() => {
		if (!browser) return;

		const pagePath = `${page.url.pathname}${page.url.search}`;
		const visibleIds = visibleArticles.map((article) => article.id);
		if (pagePath !== impressionPageKey) {
			loggedImpressionIds.clear();
			impressionPageKey = pagePath;
		}

		const articleIds = visibleIds.filter((id) => !loggedImpressionIds.has(id));
		if (articleIds.length === 0) return;
		for (const id of articleIds) loggedImpressionIds.add(id);

		void fetch('/event/impression', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ articleIds, pagePath }),
			keepalive: true
		}).catch(() => {
			for (const id of articleIds) loggedImpressionIds.delete(id);
		});
	});

	function loadBookmarks() {
		const saved = localStorage.getItem(BOOKMARK_STORAGE_KEY);
		if (!saved) return [];

		try {
			const parsed = JSON.parse(saved);
			if (!Array.isArray(parsed)) return [];

			if (parsed.every((item) => typeof item === 'number')) {
				const migrated = parsed
					.map((id) => articles.find((article) => article.id === id))
					.filter((article): article is Article => Boolean(article))
					.slice(0, BOOKMARK_LIMIT);
				localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(migrated));
				return migrated;
			}

			return parsed.filter(isSavedArticle).slice(0, BOOKMARK_LIMIT);
		} catch {
			return [];
		}
	}

	function isSavedArticle(value: unknown): value is Article {
		if (!value || typeof value !== 'object') return false;
		const article = value as Partial<Article>;
		return typeof article.id === 'number' && typeof article.title === 'string';
	}

	function saveBookmarks(nextBookmarks: Article[]) {
		bookmarks = nextBookmarks.slice(0, BOOKMARK_LIMIT);
		if (browser) localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
	}

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

	function toggleBookmark(article: Article) {
		const exists = bookmarks.some((item) => item.id === article.id);

		saveBookmarks(
			exists ? bookmarks.filter((item) => item.id !== article.id) : [article, ...bookmarks]
		);
		liveToastCount = 0;
		showToast(exists ? 'Eltávolítva a könyvjelzők közül.' : 'Cikk mentve a könyvjelzők közé.');
	}

	function markFreshArticles(articleIds: number[]) {
		if (articleIds.length === 0) return;
		const newFreshIds = articleIds.filter((id) => !freshArticleIds.includes(id));
		freshArticleIds = [...newFreshIds, ...freshArticleIds];
		const timer = setTimeout(() => {
			freshArticleIds = freshArticleIds.filter((id) => !articleIds.includes(id));
			freshArticleTimers = freshArticleTimers.filter((item) => item !== timer);
		}, FRESH_ARTICLE_WINDOW_MS);
		freshArticleTimers = [...freshArticleTimers, timer];
	}

	function clearFreshArticleTimers() {
		for (const timer of freshArticleTimers) clearTimeout(timer);
		freshArticleTimers = [];
	}

	function handleLiveArticle(event: MessageEvent) {
		let article: (typeof data.streamArticles)[number];
		try {
			article = JSON.parse(event.data);
		} catch {
			return;
		}
		if (!matchesActiveFilters(article)) return;
		if (articles.some((item) => item.id === article.id)) return;

		markFreshArticles([article.id]);
		revealedLiveArticles = [article, ...revealedLiveArticles];
		visibleCount += 1;
		liveToastCount += 1;
		showToast(`${liveToastCount} új hír érkezett`, undefined, 8000, () => {
			liveToastCount = 0;
		});
	}

	function matchesActiveFilters(article: (typeof data.streamArticles)[number]) {
		if (data.activeCategory !== 'all' && !article.categorySlugs.includes(data.activeCategory)) return false;
		if (data.activePublisher !== 'all' && article.source !== data.activePublisher) return false;
		if (!matchesTimeFilter(article, data.activeTimeFilter)) return false;
		if (data.searchQuery && !articleMatchesQuery(article, data.searchQuery)) return false;
		return true;
	}

	function articleMatchesQuery(article: (typeof data.streamArticles)[number], query: string) {
		const normalizedQuery = query.toLocaleLowerCase('hu-HU');
		return [
			article.title,
			article.excerpt ?? '',
			article.sourceName,
			article.categoryName,
			...article.categorySlugs
		]
			.join(' ')
			.toLocaleLowerCase('hu-HU')
			.includes(normalizedQuery);
	}

	function updateFilter(name: 'category' | 'source' | 'time', value: string) {
		if (!browser) return;
		const params = new URLSearchParams(page.url.searchParams);
		const isSearchRoute = page.url.pathname.startsWith('/kereses');
		let nextSource = data.activePublisher === 'all' ? '' : data.activePublisher;
		let nextCategory = data.activeCategory === 'all' ? '' : data.activeCategory;

		if (name === 'source') nextSource = value === 'all' ? '' : value;
		if (name === 'category') nextCategory = value === 'all' ? '' : value;
		if (name === 'time') {
			if (value === 'all') params.delete('time');
			else params.set('time', value);
		}

		if (isSearchRoute) {
			setFilterParam(params, 'source', nextSource);
			setFilterParam(params, 'category', nextCategory);
			const query = params.toString();
			void goto(query ? `/kereses/?${query}` : '/kereses/', {
				keepFocus: true,
				noScroll: true
			});
			return;
		}

		const query = params.toString();
		const path = getHomePath(nextSource, nextCategory);
		void goto(query ? `${path}?${query}` : path, { keepFocus: true, noScroll: true });
	}

	function setFilterParam(params: URLSearchParams, key: 'source' | 'category', value: string) {
		if (!value) {
			params.delete(key);
			return;
		}
		params.set(key, value);
	}

	function getHomePath(source: string, category: string) {
		if (source && category) return `/${source}/${category}/`;
		if (source) return `/${source}/`;
		if (category) return `/rovat/${category}/`;
		return '/';
	}

	function showToast(
		message: string,
		action?: () => void,
		duration = 2400,
		onTimeout?: () => void
	) {
		toastMessage = message;
		toastAction = action;
		toastVisible = true;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toastVisible = false;
			toastAction = undefined;
			onTimeout?.();
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
	searchActionPath={data.canonicalPath}
	bind:showExcerpt
	bind:fontSize
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
			publishers={data.publishers}
			activePublisher={data.activePublisher}
			onPublisherToggle={togglePublisher}
		/>

		<NewsFeed
			{timeFilters}
			activeTimeFilter={data.activeTimeFilter}
			bind:visibleCount
			{filteredArticles}
			{visibleArticles}
			{freshArticleIds}
			{categoryNames}
			{bookmarkedIds}
			searchQuery={data.searchQuery}
			searchTotal={data.searchTotal}
			searchEngine={data.searchEngine}
			searchError={data.searchError}
			onTimeFilterChange={selectTimeFilter}
			onBookmarkToggle={toggleBookmark}
			{showExcerpt}
			{fontSize}
		/>

		<HomeRail {topArticles} {savedArticles} onBookmarkToggle={toggleBookmark} />
	</div>
</main>

<Toast visible={toastVisible} message={toastMessage} onClick={toastAction} />

{@render children()}

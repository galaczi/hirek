<script lang="ts">
	import type { Article } from '$lib/home/data';
	import { formatTime } from '$lib/home/utils';
	import { onMount } from 'svelte';

	let bookmarks = $state<Article[]>([]);

	const BOOKMARK_STORAGE_KEY = 'hirek_bookmarks';

	onMount(() => {
		bookmarks = loadBookmarks();
	});

	function loadBookmarks() {
		const saved = localStorage.getItem(BOOKMARK_STORAGE_KEY);
		if (!saved) return [];

		try {
			const parsed = JSON.parse(saved);
			if (!Array.isArray(parsed)) return [];
			return parsed.filter(isSavedArticle);
		} catch {
			return [];
		}
	}

	function isSavedArticle(value: unknown): value is Article {
		if (!value || typeof value !== 'object') return false;
		const article = value as Partial<Article>;
		return typeof article.id === 'number' && typeof article.title === 'string';
	}

	function removeBookmark(articleId: number) {
		bookmarks = bookmarks.filter((article) => article.id !== articleId);
		localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
	}

	function articleHref(article: Article) {
		const params = new URLSearchParams();
		if (article.surfaceKey) params.set('surface', article.surfaceKey);
		if (article.deliveryMode && article.deliveryMode !== 'organic') params.set('mode', article.deliveryMode);
		const query = params.toString();
		return query ? `/go/${article.id}?${query}` : `/go/${article.id}`;
	}
</script>

<svelte:head>
	<title>Könyvjelzők - hirek.hu</title>
</svelte:head>

<main class="app-container admin-page">
	<section class="search-panel">
		<p class="section-kicker">Saját lista</p>
		<h1>Könyvjelzők</h1>
		<div class="top-meta">
			<span>{bookmarks.length} mentett cikk</span>
			<span>legfeljebb 100 cikk marad meg ezen az eszközön</span>
		</div>
	</section>

	<section class="feed-column simple-stream" aria-label="Könyvjelzők">
		<div class="news-feed-list">
			{#if bookmarks.length === 0}
				<div class="empty-state">
					<div class="empty-state-title">Még nincsenek könyvjelzőid</div>
					<div class="empty-state-desc">A hírfolyamban a könyvjelző ikon menti ide az egyes cikkeket.</div>
				</div>
			{:else}
				{#each bookmarks as article (article.id)}
					<article class="news-item">
						<div class="news-item-left">
							<span class="news-time">{formatTime(article.publishedAt)}</span>
							<a class="news-title" href={articleHref(article)} target="_blank" rel="noopener">{article.title}</a>
						</div>
						<div class="news-item-right">
							<a class="source-badge" href={`/${article.source}/`}>{article.sourceName}</a>
							<a class="item-cat-badge" href={`/rovat/${article.category}/`}>{article.categoryName}</a>
							<button
								type="button"
								class="remove-bookmark-btn"
								onclick={() => removeBookmark(article.id)}
								aria-label="Könyvjelző törlése"
							>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</article>
				{/each}
			{/if}
		</div>
	</section>
</main>

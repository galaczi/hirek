<script lang="ts">
	import type { Article } from '$lib/home/data';

	let {
		topArticles,
		savedArticles,
		onBookmarkToggle
	}: {
		topArticles: Article[];
		savedArticles: Article[];
		onBookmarkToggle: (article: Article) => void;
	} = $props();

	function articleHref(article: Article) {
		const params = new URLSearchParams();
		if (article.surfaceKey) params.set('surface', article.surfaceKey);
		if (article.deliveryMode && article.deliveryMode !== 'organic') params.set('mode', article.deliveryMode);
		const query = params.toString();
		return query ? `/go/${article.id}?${query}` : `/go/${article.id}`;
	}
</script>

<aside class="sidebar-right">
	<section class="panel">
		<h2 class="panel-title">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
			</svg>
			TOP 24 Hírek
		</h2>
		<div class="top-news-list">
			{#each topArticles as article, index (article.id)}
				<div class="top-news-item">
					<span class="top-rank">{index + 1}</span>
					<div class="top-content">
						<a class="top-title" href={articleHref(article)} target="_blank" rel="noopener">{article.title}</a>
						<div class="top-meta">
							<span class={`top-source source-badge ${article.source}`}>{article.sourceName}</span>
							<span>{article.clicks.toLocaleString('hu-HU')} kattintás</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="panel">
		<h2 class="panel-title">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
			</svg>
			Mentett híreid
		</h2>
		<div class="bookmark-list">
			{#if savedArticles.length === 0}
				<div class="bookmark-empty">Még nincsenek elmentett híreid.</div>
			{:else}
				{#each savedArticles as article (article.id)}
					<div class="bookmark-item">
						<a class="bookmark-item-title" href={articleHref(article)} target="_blank" rel="noopener">{article.title}</a>
						<button
							type="button"
							class="remove-bookmark-btn"
							onclick={() => onBookmarkToggle(article)}
							aria-label="Könyvjelző törlése"
						>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{/each}
			{/if}
		</div>
	</section>
</aside>

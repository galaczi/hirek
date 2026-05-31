<script lang="ts">
	import type { Article } from '$lib/home/data';
	import { formatTime, recencyClass } from '$lib/home/utils';

	let {
		timeFilters,
		activeTimeFilter = $bindable('all'),
		visibleCount = $bindable(18),
		filteredArticles,
		visibleArticles,
		freshArticleIds = [],
		categoryNames,
		bookmarkedIds,
		searchQuery = '',
		searchTotal = null,
		searchEngine = null,
		searchError = null,
		onTimeFilterChange,
		onBookmarkToggle,
		showExcerpt = false,
		fontSize = 14
	}: {
		timeFilters: Array<{ value: string; label: string }>;
		activeTimeFilter: string;
		visibleCount: number;
		filteredArticles: Article[];
		visibleArticles: Article[];
		freshArticleIds?: number[];
		categoryNames: Record<string, string>;
		bookmarkedIds: number[];
		searchQuery?: string;
		searchTotal?: number | null;
		searchEngine?: 'meilisearch' | 'postgres' | null;
		searchError?: string | null;
		onTimeFilterChange: (value: string) => void;
		onBookmarkToggle: (article: Article) => void;
		showExcerpt?: boolean;
		fontSize?: number;
	} = $props();

	function articleHref(article: Article) {
		const params = new URLSearchParams();
		if (article.surfaceKey) params.set('surface', article.surfaceKey);
		if (article.deliveryMode && article.deliveryMode !== 'organic') params.set('mode', article.deliveryMode);
		const query = params.toString();
		return query ? `/go/${article.id}?${query}` : `/go/${article.id}`;
	}
</script>

<section
	class="feed-column"
	aria-label="Hírfolyam"
	style={`--news-title-size: ${fontSize}px; --news-excerpt-size: ${Math.max(12, fontSize - 1)}px;`}
>
	<div class="feed-header">
		<div class="time-filters" role="group" aria-label="Időbeli szűrés">
			{#each timeFilters as filter (filter.value)}
				<button
					type="button"
					class:active={activeTimeFilter === filter.value}
					class="time-btn"
					onclick={() => onTimeFilterChange(filter.value)}
				>
					{filter.label}
				</button>
			{/each}
		</div>

		{#if searchQuery}
			<div class="feed-search-status">
				<span>{searchTotal ?? filteredArticles.length} találat</span>
				<span>{searchEngine === 'postgres' ? 'Postgres fallback' : 'Meilisearch'}</span>
				{#if searchError}
					<span title={searchError}>Fallback aktív</span>
				{/if}
			</div>
		{/if}
	</div>

	<div class="news-feed-list">
		{#if visibleArticles.length === 0}
			<div class="empty-state">
				<svg xmlns="http://www.w3.org/2000/svg" class="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<div class="empty-state-title">Nincs találat</div>
				<div class="empty-state-desc">Próbáld megváltoztatni a szűrést vagy a keresési kulcsszót.</div>
			</div>
		{:else}
			{#each visibleArticles as article (article.id)}
				<article
					class:fresh-arrival={freshArticleIds.includes(article.id)}
					class="news-item"
					class:has-excerpt={showExcerpt && Boolean(article.excerpt?.trim())}
				>
					<div class="news-item-main">
						<div class="news-item-left">
							<span class={`recency-indicator ${recencyClass(article)}`} title="Frissesség"></span>
							<span class="news-time">{formatTime(article.publishedAt)}</span>
							<a class="news-title" href={articleHref(article)} target="_blank" rel="noopener">{article.title}</a>
						</div>
						<div class="news-item-right">
							<span class={`source-badge ${article.source}`}>{article.sourceName}</span>
							<span class="item-cat-badge">{categoryNames[article.category]}</span>
							<button
								type="button"
								class:saved={bookmarkedIds.includes(article.id)}
								class="bookmark-btn"
								onclick={() => onBookmarkToggle(article)}
								aria-label={bookmarkedIds.includes(article.id) ? 'Könyvjelző eltávolítása' : 'Könyvjelző hozzáadása'}
							>
								<svg xmlns="http://www.w3.org/2000/svg" fill={bookmarkedIds.includes(article.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
								</svg>
							</button>
						</div>
					</div>
					{#if showExcerpt && article.excerpt?.trim()}
						<p class="news-excerpt">
							{article.excerpt}
						</p>
					{/if}
				</article>
			{/each}
		{/if}
	</div>

	{#if filteredArticles.length > visibleCount}
		<div class="loader-container">
			<button type="button" class="load-more-btn" onclick={() => (visibleCount += 18)}>
				További hírek betöltése
			</button>
		</div>
	{/if}
</section>

<style>
	.news-title {
		font-size: var(--news-title-size);
	}

	.news-item.has-excerpt {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 8px;
	}

	.news-item-main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		width: 100%;
	}

	.news-excerpt {
		color: var(--text-muted);
		line-height: 1.5;
		font-size: var(--news-excerpt-size);
		margin-left: 56px;
		padding-top: 6px;
		border-top: 1px dashed var(--border);
		margin-top: 0;
		margin-bottom: 0;
	}

	@media (max-width: 900px) {
		.news-excerpt {
			margin-left: 0;
			padding-left: 18px;
		}
	}

	@media (max-width: 600px) {
		.news-item-main {
			flex-direction: column;
			align-items: stretch;
			gap: 8px;
		}

		.news-item-right {
			width: 100%;
			justify-content: space-between;
		}

		.news-excerpt {
			padding-left: 0;
		}
	}
</style>

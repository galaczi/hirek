<script lang="ts">
	import type { Article } from '$lib/home/data';
	import { formatTime } from '$lib/home/utils';

	let {
		articles,
		categoryNames = {}
	}: {
		articles: Article[];
		categoryNames?: Record<string, string>;
	} = $props();
</script>

<section class="feed-column simple-stream" aria-label="Hírfolyam">
	<div class="news-feed-list">
		{#if articles.length === 0}
			<div class="empty-state">
				<div class="empty-state-title">Nincs találat</div>
				<div class="empty-state-desc">Ehhez a nézethez még nincs aktív hír.</div>
			</div>
		{:else}
			{#each articles as article (article.id)}
				<article class="news-item">
					<div class="news-item-left">
						<span class="news-time">{formatTime(article.publishedAt)}</span>
						<a class="news-title" href={`/go/${article.id}`} target="_blank" rel="noopener">{article.title}</a>
					</div>
					<div class="news-item-right">
						<a class="source-badge" href={`/${article.source}/`}>{article.sourceName}</a>
						<a class="item-cat-badge" href={`/rovat/${article.category}/`}>{categoryNames[article.category] ?? article.categoryName}</a>
					</div>
				</article>
			{/each}
		{/if}
	</div>
</section>

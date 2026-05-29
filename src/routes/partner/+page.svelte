<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('hu-HU', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(value));
	}
</script>

<svelte:head>
	<title>Partner dashboard - hirek.hu</title>
</svelte:head>

<main class="app-container admin-page">
	<section class="search-panel">
		<p class="section-kicker">Partner</p>
		<h1>Traffic dashboard</h1>
	</section>

	<section class="panel">
		<h2 class="panel-title">Sources</h2>
		<div class="admin-table">
			<div class="admin-row admin-row-head">
				<span>Source</span><span>Domain</span><span>Articles</span><span>Clicks</span>
			</div>
			{#each data.sourceStats as source (source.sourceId)}
				<div class="admin-row">
					<span>{source.sourceName}</span>
					<span>{source.sourceDomain}</span>
					<span>{source.articleCount}</span>
					<span>{source.clickCount}</span>
				</div>
			{/each}
		</div>
	</section>

	{#if data.partnerSourceId}
		<section class="admin-grid">
			<form class="panel admin-form" method="POST" action="?/addUrlRule">
				<h2 class="panel-title">URL category rules</h2>
				<input name="urlPattern" placeholder="portfolio.hu/global/*" required />
				<select name="categorySlug" required>
					{#each data.categories as category (category.slug)}
						<option value={category.slug}>{category.name}</option>
					{/each}
				</select>
				<button class="load-more-btn" type="submit">Save rule</button>
			</form>

			<section class="panel">
				<h2 class="panel-title">Current rules</h2>
				<div class="admin-table">
					<div class="admin-row admin-row-head"><span>Pattern</span><span>Category</span><span></span></div>
					{#each data.sourceRules as rule (rule.id)}
						<div class="admin-row">
							<span>{rule.urlPattern}</span>
							<span>{rule.categoryName}</span>
							<form method="POST" action="?/deleteUrlRule">
								<input type="hidden" name="ruleId" value={rule.id} />
								<button type="submit">Delete</button>
							</form>
						</div>
					{/each}
				</div>
			</section>
		</section>
	{/if}

	<section class="admin-grid">
		<div class="panel">
			<h2 class="panel-title">Top articles</h2>
			<div class="top-news-list">
				{#each data.topArticles as article (article.id)}
					<div class="top-news-item">
						<div class="top-content">
							<a class="top-title" href={`/go/${article.id}`} target="_blank" rel="noopener">{article.title}</a>
							<div class="top-meta">
								<span>{article.sourceName}</span>
								<span>{article.clickCount} tracked clicks</span>
								<span>{formatDate(article.publishedAt)}</span>
							</div>
							<form class="inline-form" method="POST" action="?/overrideCategory">
								<input type="hidden" name="articleId" value={article.id} />
								<select name="categorySlug" aria-label="Kategória felülírása">
									{#each data.categories as category (category.slug)}
										<option value={category.slug}>{category.name}</option>
									{/each}
								</select>
								<button type="submit">Mentés</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="panel">
			<h2 class="panel-title">Recent clicks</h2>
			<div class="top-news-list">
				{#each data.recentClicks as click (click.id)}
					<div class="top-news-item">
						<div class="top-content">
							<div class="top-title">{click.articleTitle}</div>
							<div class="top-meta">
								<span>{click.sourceName}</span>
								<span>{formatDate(click.createdAt)}</span>
								<span>{click.referrer ?? 'direct'}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>
</main>

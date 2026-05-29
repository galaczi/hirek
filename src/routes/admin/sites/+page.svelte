<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Site rules - hirek.hu</title>
</svelte:head>

<main class="app-container admin-page">
	<section class="search-panel">
		<p class="section-kicker">Admin</p>
		<h1>Sites and URL rules</h1>
		{#if form}
			<pre class="admin-result">{JSON.stringify(form, null, 2)}</pre>
		{/if}
	</section>

	<section class="admin-grid">
		<form class="panel admin-form" method="POST" action="?/addSource">
			<h2 class="panel-title">Add site</h2>
			<p class="form-hint">Create or update the source and feed first. Add URL categorization rules below after the site exists.</p>
			<input name="name" placeholder="Name" required />
			<input name="slug" placeholder="slug" required />
			<input name="domain" placeholder="domain.hu" required />
			<input name="feedUrl" placeholder="https://domain.hu/rss" required />
			<button class="load-more-btn" type="submit">Save site</button>
		</form>

		<form class="panel admin-form" method="POST" action="?/addRule">
			<h2 class="panel-title">Add URL categorization rule</h2>
			<p class="form-hint">Map a source URL pattern to a category, for example portfolio.hu/global/* -> Külföld.</p>
			<select name="sourceId" required>
				{#each data.sources as source (source.id)}
					<option value={source.id}>{source.name} ({source.domain})</option>
				{/each}
			</select>
			<select name="categoryId" required>
				{#each data.categories as category (category.id)}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>
			<input name="urlPattern" placeholder="portfolio.hu/global/*" required />
			<button class="load-more-btn" type="submit">Save rule</button>
		</form>
	</section>

	<section class="panel">
		<h2 class="panel-title">URL rules</h2>
		<div class="admin-table">
			<div class="admin-row admin-row-head">
				<span>Site</span><span>Pattern</span><span>Category</span><span></span>
			</div>
			{#each data.rules as rule (rule.id)}
				<div class="admin-row">
					<span>{rule.sourceName}</span>
					<span>{rule.urlPattern}</span>
					<span>{rule.categoryName}</span>
					<form method="POST" action="?/deleteRule">
						<input type="hidden" name="ruleId" value={rule.id} />
						<button type="submit">Delete</button>
					</form>
				</div>
			{/each}
		</div>
	</section>
</main>

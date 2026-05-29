<script lang="ts">
	import type { PageProps } from './$types';
	import InternalCollectionFrame from '$lib/components/internal/InternalCollectionFrame.svelte';
	import InternalEmptyState from '$lib/components/internal/InternalEmptyState.svelte';
	import StatusBadge from '$lib/components/internal/StatusBadge.svelte';

	let { data, form }: PageProps = $props();

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('hu-HU', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(value));
	}

	function hrefWith(updates: Record<string, string | number | null>) {
		const params = new URLSearchParams();
		setParam(params, 'q', data.filters.q);
		setParam(params, 'source', data.filters.source);
		setParam(params, 'category', data.filters.category);
		setParam(params, 'status', data.filters.status);
		setParam(params, 'sort', data.sort.key);
		setParam(params, 'dir', data.sort.direction);
		setParam(params, 'page', data.pagination.page);

		for (const [key, value] of Object.entries(updates)) {
			setParam(params, key, value);
		}

		const query = params.toString();
		return query ? `/admin/articles?${query}` : '/admin/articles';
	}

	function setParam(params: URLSearchParams, key: string, value: string | number | null) {
		if (value === null || value === '' || value === 'all') {
			params.delete(key);
			return;
		}
		params.set(key, String(value));
	}

	function sortHref(key: string) {
		const direction = data.sort.key === key && data.sort.direction === 'desc' ? 'asc' : 'desc';
		return hrefWith({ sort: key, dir: direction, page: null });
	}

	function sortIndicator(key: string) {
		if (data.sort.key !== key) return '';
		return data.sort.direction === 'desc' ? '↓' : '↑';
	}

	function rangeStart() {
		if (data.pagination.total === 0) return 0;
		return (data.pagination.page - 1) * data.pagination.pageSize + 1;
	}

	function rangeEnd() {
		return Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total);
	}
</script>

<svelte:head>
	<title>Cikkmoderáció - hirek.hu</title>
</svelte:head>

{#if form}
	<div class="result-toast">
		<pre class="admin-result">{JSON.stringify(form, null, 2)}</pre>
	</div>
{/if}

<InternalCollectionFrame
	title="Cikkek moderálása"
	subtitle="A legfrissebb cikkek állapota, gyors szűrés és rangsorolható ellenőrzési nézet."
	class="articles-collection"
>
	{#snippet meta()}
		<span class="range-indicator">{rangeStart()}-{rangeEnd()} / {data.pagination.total}</span>
	{/snippet}

	{#snippet toolbar()}
		<form class="moderation-filters articles-index-filters" method="GET" action="/admin/articles">
			<input type="hidden" name="sort" value={data.sort.key} />
			<input type="hidden" name="dir" value={data.sort.direction} />
			
			<label class="search-label">
				<span>Keresés</span>
				<input
					name="q"
					type="search"
					value={data.filters.q}
					placeholder="Cím, forrás, rovat vagy URL"
				/>
			</label>
			
			<label class="select-label">
				<span>Forrás</span>
				<select name="source" value={data.filters.source || 'all'}>
					<option value="all">Összes forrás</option>
					{#each data.sources as source (source.slug)}
						<option value={source.slug}>{source.name}</option>
					{/each}
				</select>
			</label>
			
			<label class="select-label">
				<span>Rovat</span>
				<select name="category" value={data.filters.category || 'all'}>
					<option value="all">Összes rovat</option>
					{#each data.categories as category (category.slug)}
						<option value={category.slug}>{category.name}</option>
					{/each}
				</select>
			</label>
			
			<label class="select-label">
				<span>Állapot</span>
				<select name="status" value={data.filters.status || 'all'}>
					<option value="all">Összes állapot</option>
					<option value="active">Aktív</option>
					<option value="hidden">Rejtett</option>
				</select>
			</label>
			
			<div class="filter-actions">
				<button class="filter-submit" type="submit">Szűrés</button>
				<a class="filter-clear" href="/admin/articles">Törlés</a>
			</div>
		</form>
	{/snippet}

	<div class="moderation-table">
		<div class="moderation-grid moderation-head">
			<a class="sort-header" class:active={data.sort.key === 'title'} href={sortHref('title')}>Cím {sortIndicator('title')}</a>
			<a class="sort-header" class:active={data.sort.key === 'sourceName'} href={sortHref('sourceName')}>Forrás {sortIndicator('sourceName')}</a>
			<a class="sort-header" class:active={data.sort.key === 'publishedAt'} href={sortHref('publishedAt')}>Időpont {sortIndicator('publishedAt')}</a>
			<a class="sort-header" class:active={data.sort.key === 'categoryName'} href={sortHref('categoryName')}>Rovat {sortIndicator('categoryName')}</a>
			<a class="sort-header numeric" class:active={data.sort.key === 'clickScore'} href={sortHref('clickScore')}>Katt. {sortIndicator('clickScore')}</a>
			<a class="sort-header" class:active={data.sort.key === 'status'} href={sortHref('status')}>Állapot {sortIndicator('status')}</a>
			<span>Művelet</span>
		</div>
		{#each data.moderationArticles as article (article.id)}
			<div class:inactive={!article.active} class="moderation-grid moderation-row">
				<div class="moderation-title-cell">
					<strong class="article-title-text">{article.title}</strong>
				</div>
				<div class="moderation-cell">
					<span class="cell-label">Forrás</span>
					<span class="source-cell-text">{article.sourceName}</span>
				</div>
				<div class="moderation-cell">
					<span class="cell-label">Időpont</span>
					<span class="date-cell-text">{formatDate(article.publishedAt)}</span>
				</div>
				<div class="moderation-cell">
					<span class="cell-label">Rovat</span>
					<span class="category-cell-text">{article.categoryName}</span>
				</div>
				<div class="moderation-cell numeric">
					<span class="cell-label">Katt.</span>
					<span class="click-score-text">{article.clickScore}</span>
				</div>
				<div class="status-cell">
					<StatusBadge
						label={article.active ? 'Aktív' : 'Rejtett'}
						tone={article.active ? 'success' : 'danger'}
					/>
				</div>
				<form class="inline-form moderation-action" method="POST" action="?/moderateArticle">
					<input type="hidden" name="articleId" value={article.id} />
					<input type="hidden" name="active" value={article.active ? 'false' : 'true'} />
					<input type="hidden" name="returnTo" value={hrefWith({})} />
					<button class="action-btn" class:hide-btn={article.active} type="submit">
						{article.active ? 'Elrejtés' : 'Aktiválás'}
					</button>
				</form>
			</div>
		{/each}
	</div>

	{#if data.moderationArticles.length === 0}
		<InternalEmptyState
			title="Nincsenek moderálható cikkek"
			description="A megadott szűrési feltételek mellett nem található cikk a moderációs listában. Próbálj meg módosítani a szűrőkön."
			tone="neutral"
		/>
	{/if}

	{#snippet pagination()}
		<nav class="pagination-row" aria-label="Cikkmoderáció lapozás">
			{#if data.pagination.page > 1}
				<a class="pagination-link" href={hrefWith({ page: data.pagination.page - 1 })}>Előző</a>
			{:else}
				<span class="pagination-link disabled">Előző</span>
			{/if}
			<span class="pagination-current">{data.pagination.page} / {data.pagination.totalPages}</span>
			{#if data.pagination.page < data.pagination.totalPages}
				<a class="pagination-link" href={hrefWith({ page: data.pagination.page + 1 })}>Következő</a>
			{:else}
				<span class="pagination-link disabled">Következő</span>
			{/if}
		</nav>
	{/snippet}
</InternalCollectionFrame>

<style>
	.result-toast {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: #f8fafc;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		max-height: 15rem;
		overflow: auto;
	}
	.admin-result {
		font-family: monospace;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.range-indicator {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--text-muted);
		background: var(--bg-base);
		border: 1px solid var(--border);
		padding: 0.25rem 0.625rem;
		border-radius: var(--radius-pill);
	}

	.articles-index-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: flex-end;
		background: var(--bg-base);
		padding: 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
	}
	.search-label {
		flex: 2;
		min-width: 15rem;
	}
	.select-label {
		flex: 1;
		min-width: 9.5rem;
	}

	label {
		display: grid;
		gap: 0.25rem;
	}
	label span {
		font-size: 0.6875rem;
		font-weight: 800;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	input, select {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: var(--text-main);
		background: var(--bg-alt);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0.5rem 0.75rem;
		outline: none;
		transition: var(--transition);
		width: 100%;
	}
	input:focus, select:focus {
		background: var(--bg-card);
		border-color: var(--border-focus);
		box-shadow: 0 0 0 2px rgba(255, 78, 58, 0.12);
	}

	.filter-actions {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}
	.filter-submit {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 700;
		color: white;
		background: var(--text-main);
		border-radius: var(--radius-md);
		padding: 0.5rem 1rem;
		transition: var(--transition);
		cursor: pointer;
	}
	.filter-submit:hover {
		background: hsl(215, 24%, 27%);
	}
	.filter-clear {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-muted);
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0.5rem 1rem;
		transition: var(--transition);
		text-decoration: none;
	}
	.filter-clear:hover {
		background: var(--bg-alt);
		color: var(--text-main);
	}

	.moderation-table {
		display: grid;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.moderation-grid {
		display: grid;
		grid-template-columns: 4fr 1.5fr 1.5fr 1.5fr 1fr 1fr 1fr;
		gap: 1rem;
		align-items: center;
		padding: 0.75rem 1rem;
	}
	@media (max-width: 1024px) {
		.moderation-grid {
			grid-template-columns: 2fr 1fr 1fr 1fr;
			gap: 0.75rem;
		}
		.moderation-cell:not(.numeric), .moderation-head .sort-header:nth-child(2), .moderation-head .sort-header:nth-child(4) {
			display: none;
		}
	}
	@media (max-width: 640px) {
		.moderation-grid {
			grid-template-columns: 1fr;
			gap: 0.5rem;
			padding: 1rem;
		}
		.moderation-head {
			display: none !important;
		}
	}

	.moderation-head {
		font-size: 0.6875rem;
		font-weight: 800;
		color: var(--text-light);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid var(--border);
		padding-bottom: 0.5rem;
	}
	.sort-header {
		text-decoration: none;
		color: var(--text-muted);
		transition: var(--transition);
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.sort-header:hover, .sort-header.active {
		color: var(--primary);
	}

	.moderation-row {
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-card);
		color: var(--text-main);
		transition: var(--transition);
	}
	.moderation-row:hover {
		border-color: var(--border-focus);
		box-shadow: var(--shadow-sm);
	}
	.moderation-row.inactive {
		opacity: 0.75;
		background: var(--bg-base);
	}

	.moderation-title-cell {
		display: grid;
		gap: 0.125rem;
	}
	.article-title-text {
		font-family: var(--font-body);
		font-weight: 700;
		font-size: 0.875rem;
		line-height: 1.4;
	}

	.source-cell-text, .category-cell-text {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-muted);
	}
	.date-cell-text {
		font-size: 0.75rem;
		color: var(--text-light);
	}
	.click-score-text {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 0.9375rem;
		color: var(--primary);
	}

	.action-btn {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: var(--bg-base);
		color: var(--text-main);
		transition: var(--transition);
		width: 100%;
		cursor: pointer;
	}
	.action-btn:hover {
		background: var(--primary-light);
		color: var(--primary);
		border-color: var(--primary);
	}
	.action-btn.hide-btn {
		background: #fef2f2;
		color: #b42318;
		border-color: rgba(220, 38, 38, 0.15);
	}
	.action-btn.hide-btn:hover {
		background: #b42318;
		color: white;
	}

	.pagination-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 1rem;
	}
	.pagination-link {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--text-main);
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0.375rem 0.75rem;
		text-decoration: none;
		transition: var(--transition);
	}
	.pagination-link:hover:not(.disabled) {
		background: var(--bg-alt);
		border-color: var(--text-main);
	}
	.pagination-link.disabled {
		color: var(--text-light);
		background: var(--bg-alt);
		border-color: var(--border);
		cursor: not-allowed;
		pointer-events: none;
	}
	.pagination-current {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-muted);
	}
</style>

<script lang="ts">
	import type { PageProps } from './$types';

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
	<pre class="admin-result">{JSON.stringify(form, null, 2)}</pre>
{/if}

<section class="panel">
	<div class="panel-heading-row">
		<div>
			<h2 class="panel-title">Cikkek moderálása</h2>
			<p class="panel-subtitle">A legfrissebb cikkek elrejtése vagy visszaállítása.</p>
		</div>
		<span>{rangeStart()}-{rangeEnd()} / {data.pagination.total}</span>
	</div>

	<form class="moderation-filters" method="GET" action="/admin/articles">
		<input type="hidden" name="sort" value={data.sort.key} />
		<input type="hidden" name="dir" value={data.sort.direction} />
		<label>
			<span>Keresés</span>
			<input
				name="q"
				type="search"
				value={data.filters.q}
				placeholder="Cím, forrás, rovat vagy URL"
			/>
		</label>
		<label>
			<span>Forrás</span>
			<select name="source" value={data.filters.source || 'all'}>
				<option value="all">Összes forrás</option>
				{#each data.sources as source (source.slug)}
					<option value={source.slug}>{source.name}</option>
				{/each}
			</select>
		</label>
		<label>
			<span>Rovat</span>
			<select name="category" value={data.filters.category || 'all'}>
				<option value="all">Összes rovat</option>
				{#each data.categories as category (category.slug)}
					<option value={category.slug}>{category.name}</option>
				{/each}
			</select>
		</label>
		<label>
			<span>Állapot</span>
			<select name="status" value={data.filters.status || 'all'}>
				<option value="all">Összes állapot</option>
				<option value="active">Aktív</option>
				<option value="hidden">Rejtett</option>
			</select>
		</label>
		<button type="submit">Szűrés</button>
		<a class="secondary-link" href="/admin/articles">Törlés</a>
	</form>

	<div class="moderation-table">
		<div class="moderation-grid moderation-head">
			<a class:active={data.sort.key === 'title'} href={sortHref('title')}>Cím {sortIndicator('title')}</a>
			<a class:active={data.sort.key === 'sourceName'} href={sortHref('sourceName')}>Forrás {sortIndicator('sourceName')}</a>
			<a class:active={data.sort.key === 'publishedAt'} href={sortHref('publishedAt')}>Időpont {sortIndicator('publishedAt')}</a>
			<a class:active={data.sort.key === 'categoryName'} href={sortHref('categoryName')}>Rovat {sortIndicator('categoryName')}</a>
			<a class:active={data.sort.key === 'clickScore'} href={sortHref('clickScore')}>Katt. {sortIndicator('clickScore')}</a>
			<a class:active={data.sort.key === 'status'} href={sortHref('status')}>Állapot {sortIndicator('status')}</a>
			<span>Művelet</span>
		</div>
		{#each data.moderationArticles as article (article.id)}
			<div class:inactive={!article.active} class="moderation-grid moderation-row">
				<div class="moderation-title-cell">
					<strong>{article.title}</strong>
				</div>
				<div class="moderation-cell">
					<span class="cell-label">Forrás</span>
					<span>{article.sourceName}</span>
				</div>
				<div class="moderation-cell">
					<span class="cell-label">Időpont</span>
					<span>{formatDate(article.publishedAt)}</span>
				</div>
				<div class="moderation-cell">
					<span class="cell-label">Rovat</span>
					<span>{article.categoryName}</span>
				</div>
				<div class="moderation-cell numeric">
					<span class="cell-label">Katt.</span>
					<span>{article.clickScore}</span>
				</div>
				<span class:active={article.active} class="moderation-status">{article.active ? 'Aktív' : 'Rejtett'}</span>
				<form class="inline-form moderation-action" method="POST" action="?/moderateArticle">
					<input type="hidden" name="articleId" value={article.id} />
					<input type="hidden" name="active" value={article.active ? 'false' : 'true'} />
					<input type="hidden" name="returnTo" value={hrefWith({})} />
					<button type="submit">{article.active ? 'Elrejtés' : 'Visszaállítás'}</button>
				</form>
			</div>
		{/each}
	</div>

	{#if data.moderationArticles.length === 0}
		<div class="empty-state">
			<strong>Nincs találat.</strong>
			<span>Próbálj másik címet, forrást, rovatot vagy URL-részletet.</span>
		</div>
	{/if}

	<nav class="pagination-row" aria-label="Cikkmoderáció lapozás">
		{#if data.pagination.page > 1}
			<a class="secondary-link" href={hrefWith({ page: data.pagination.page - 1 })}>Előző</a>
		{:else}
			<span class="secondary-link disabled">Előző</span>
		{/if}
		<span>{data.pagination.page} / {data.pagination.totalPages}</span>
		{#if data.pagination.page < data.pagination.totalPages}
			<a class="secondary-link" href={hrefWith({ page: data.pagination.page + 1 })}>Következő</a>
		{:else}
			<span class="secondary-link disabled">Következő</span>
		{/if}
	</nav>
</section>

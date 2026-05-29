<script lang="ts">
	import type { PageProps } from './$types';
	import InternalCollectionFrame from '$lib/components/internal/InternalCollectionFrame.svelte';
	import InternalEmptyState from '$lib/components/internal/InternalEmptyState.svelte';
	import StatusBadge from '$lib/components/internal/StatusBadge.svelte';

	let { data, form }: PageProps = $props();

	const sourceStatusLabels: Record<string, string> = {
		ingesting: 'Gyűjtés alatt',
		needs_rss: 'RSS szükséges',
		needs_adapter: 'Adapter szükséges',
		blocked: 'Blokkolt',
		pending: 'Függőben',
		disabled: 'Kikapcsolva'
	};

	function formatOptionalDate(value: string | null) {
		if (!value) return 'nincs adat';
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
		setParam(params, 'status', data.filters.status);
		setParam(params, 'page', data.pagination.page);

		for (const [key, value] of Object.entries(updates)) {
			setParam(params, key, value);
		}

		const query = params.toString();
		return query ? `/admin/sites/?${query}` : '/admin/sites/';
	}

	function setParam(params: URLSearchParams, key: string, value: string | number | null) {
		if (value === null || value === '' || value === 'all') {
			params.delete(key);
			return;
		}
		params.set(key, String(value));
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
	<title>Források - hirek.hu</title>
</svelte:head>

{#if form}
	<div class="result-toast">
		<pre class="admin-result">{JSON.stringify(form, null, 2)}</pre>
	</div>
{/if}

<details class="panel admin-disclosure">
	<summary>Új forrás hozzáadása</summary>
	<div class="admin-disclosure-body">
		<form class="admin-form-box" method="POST" action="?/addSource">
			<h3 class="form-box-title">Forrás mentése</h3>
			<p class="form-hint">Először a forrást és a feedet hozd létre. URL kategóriaszabályt ezután a forrás saját oldalán adj hozzá.</p>
			
			<div class="form-grid-2col">
				<label>
					<span>Név</span>
					<input name="name" placeholder="Például: Index" required />
				</label>
				<label>
					<span>Slug</span>
					<input name="slug" placeholder="Például: index" required />
				</label>
				<label>
					<span>Domain</span>
					<input name="domain" placeholder="Például: index.hu" required />
				</label>
				<label>
					<span>Kezdő Feed URL</span>
					<input name="feedUrl" placeholder="https://index.hu/24ora/rss/" required />
				</label>
			</div>
			
			<button class="save-button" type="submit">Forrás mentése</button>
		</form>
	</div>
</details>

<InternalCollectionFrame
	title="Források"
	subtitle="Regisztrált hírcsatorna források, adapter állapotok és feldolgozási gyakoriságok."
	class="sites-collection"
>
	{#snippet meta()}
		<span class="range-indicator">{rangeStart()}-{rangeEnd()} / {data.pagination.total}</span>
	{/snippet}

	{#snippet toolbar()}
		<form class="moderation-filters source-index-filters" method="GET" action="/admin/sites/">
			<label class="search-label">
				<span>Keresés</span>
				<input
					name="q"
					type="search"
					value={data.filters.q}
					placeholder="Név, domain, slug vagy megjegyzés"
				/>
			</label>
			<label class="status-label">
				<span>Állapot</span>
				<select name="status" value={data.filters.status || 'all'}>
					<option value="all">Összes állapot</option>
					{#each data.statuses as status (status)}
						<option value={status}>{sourceStatusLabels[status] ?? status}</option>
					{/each}
				</select>
			</label>
			<div class="filter-actions">
				<button class="filter-submit" type="submit">Szűrés</button>
				<a class="filter-clear" href="/admin/sites/">Törlés</a>
			</div>
		</form>
	{/snippet}

	<div class="source-index-table">
		<div class="source-index-grid source-index-head">
			<span>Forrás</span>
			<span>Állapot</span>
			<span>Feedek</span>
			<span>Utolsó lekérés</span>
			<span>Megjegyzés / hiba</span>
			<span></span>
		</div>
		{#each data.sources as source (source.id)}
			<a class="source-index-grid source-index-row" href={`/admin/sites/${source.id}/`}>
				<div class="source-index-main">
					<strong class="source-name-text">{source.name}</strong>
					<span class="source-meta-text">{source.domain} · {source.slug}</span>
				</div>
				<div class="status-badge-cell">
					<StatusBadge
						label={sourceStatusLabels[source.status] ?? source.status}
						tone={source.status === 'ingesting' ? 'success' : source.status === 'blocked' ? 'danger' : source.status === 'pending' ? 'warning' : 'muted'}
					/>
				</div>
				<span class="source-index-count">{source.activeFeedCount}/{source.totalFeedCount} aktív</span>
				<span class="last-fetched-cell">{formatOptionalDate(source.lastFetchedAt)}</span>
				<span class="error-cell-text" class:error-text={Boolean(source.lastError)}>{source.statusNote ?? source.lastError ?? '-'}</span>
				<strong class="source-index-open">Megnyitás &rarr;</strong>
			</a>
		{/each}
	</div>

	{#if data.sources.length === 0}
		<InternalEmptyState
			title="Nincs találat"
			description="Nem található a szűrési feltételeknek megfelelő forrás. Próbálj módosítani a megadott keresési kifejezésen vagy állapoton."
			tone="warning"
		/>
	{/if}

	{#snippet pagination()}
		<nav class="pagination-row" aria-label="Források lapozás">
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

	.admin-disclosure {
		background: var(--bg-card);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-sm);
		margin-bottom: 1.5rem;
		transition: var(--transition);
		overflow: hidden;
	}
	.admin-disclosure summary {
		padding: 1rem 1.25rem;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1rem;
		color: var(--text-main);
		cursor: pointer;
		outline: none;
		user-select: none;
	}
	.admin-disclosure[open] summary {
		border-bottom: 1px solid var(--border);
	}
	.admin-disclosure-body {
		padding: 1.25rem;
		background: var(--bg-base);
	}

	.admin-form-box {
		display: grid;
		gap: 1.125rem;
		padding: 1.25rem;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}
	.form-box-title {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1.125rem;
	}
	.form-hint {
		font-size: 0.75rem;
		color: var(--text-muted);
		line-height: 1.5;
	}

	.form-grid-2col {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.875rem;
	}
	@media (max-width: 640px) {
		.form-grid-2col {
			grid-template-columns: 1fr;
		}
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

	.save-button {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 700;
		color: white;
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		border-radius: var(--radius-md);
		padding: 0.5rem 1rem;
		box-shadow: 0 2px 6px rgba(255, 78, 58, 0.15);
		transition: var(--transition);
		width: fit-content;
	}
	.save-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(255, 78, 58, 0.25);
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

	.source-index-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: flex-end;
		background: var(--bg-base);
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
	}
	.search-label {
		flex: 1;
		min-width: 15rem;
	}
	.status-label {
		min-width: 10rem;
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
	}
	.filter-clear:hover {
		background: var(--bg-alt);
		color: var(--text-main);
	}

	.source-index-table {
		display: grid;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.source-index-grid {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1.5fr 3fr 1fr;
		gap: 1rem;
		align-items: center;
		padding: 0.75rem 1rem;
	}
	@media (max-width: 1024px) {
		.source-index-grid {
			grid-template-columns: 2fr 1fr 1.5fr 1fr;
		}
		.source-index-count, .last-fetched-cell {
			display: none;
		}
	}
	@media (max-width: 640px) {
		.source-index-grid {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
		.source-index-head {
			display: none !important;
		}
	}

	.source-index-head {
		font-size: 0.6875rem;
		font-weight: 800;
		color: var(--text-light);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid var(--border);
		padding-bottom: 0.5rem;
	}

	.source-index-row {
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-card);
		color: var(--text-main);
		transition: var(--transition);
		text-decoration: none;
	}
	.source-index-row:hover {
		border-color: var(--border-focus);
		transform: translateX(2px);
		box-shadow: var(--shadow-sm);
	}

	.source-index-main {
		display: grid;
		gap: 0.125rem;
	}
	.source-name-text {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.9375rem;
	}
	.source-meta-text {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.source-index-count {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.last-fetched-cell {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.error-cell-text {
		font-size: 0.75rem;
		color: var(--text-muted);
		max-width: 15rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.error-text {
		color: #b42318;
		font-weight: 500;
	}

	.source-index-open {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--primary);
		text-align: right;
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

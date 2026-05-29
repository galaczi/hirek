<script lang="ts">
	import type { PageProps } from './$types';

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
	<pre class="admin-result">{JSON.stringify(form, null, 2)}</pre>
{/if}

<details class="panel admin-disclosure">
	<summary>Új forrás hozzáadása</summary>
	<div class="admin-disclosure-body">
		<form class="panel admin-form" method="POST" action="?/addSource">
			<h2 class="panel-title">Forrás mentése</h2>
			<p class="form-hint">Először a forrást és a feedet hozd létre. URL kategóriaszabályt ezután a forrás saját oldalán adj hozzá.</p>
			<input name="name" placeholder="Név" required />
			<input name="slug" placeholder="slug" required />
			<input name="domain" placeholder="domain.hu" required />
			<input name="feedUrl" placeholder="https://domain.hu/rss" required />
			<button class="load-more-btn" type="submit">Forrás mentése</button>
		</form>
	</div>
</details>

<section class="panel">
	<div class="panel-heading-row">
		<div>
			<h2 class="panel-title">Források</h2>
			<p class="panel-subtitle">Lapozható, szűrhető forráslista. A szerkesztéshez nyisd meg a forrás adatlapját.</p>
		</div>
		<span>{rangeStart()}-{rangeEnd()} / {data.pagination.total}</span>
	</div>

	<form class="moderation-filters source-index-filters" method="GET" action="/admin/sites/">
		<label>
			<span>Keresés</span>
			<input
				name="q"
				type="search"
				value={data.filters.q}
				placeholder="Név, domain, slug vagy megjegyzés"
			/>
		</label>
		<label>
			<span>Állapot</span>
			<select name="status" value={data.filters.status || 'all'}>
				<option value="all">Összes állapot</option>
				{#each data.statuses as status (status)}
					<option value={status}>{sourceStatusLabels[status] ?? status}</option>
				{/each}
			</select>
		</label>
		<button type="submit">Szűrés</button>
		<a class="secondary-link" href="/admin/sites/">Törlés</a>
	</form>

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
					<strong>{source.name}</strong>
					<span>{source.domain} · {source.slug}</span>
				</div>
				<span class:active={source.status === 'ingesting'} class="moderation-status">
					{sourceStatusLabels[source.status] ?? source.status}
				</span>
				<span class="source-index-count">{source.activeFeedCount}/{source.totalFeedCount}</span>
				<span>{formatOptionalDate(source.lastFetchedAt)}</span>
				<span class:error-text={Boolean(source.lastError)}>{source.statusNote ?? source.lastError ?? '-'}</span>
				<strong class="source-index-open">Megnyitás</strong>
			</a>
		{/each}
	</div>

	{#if data.sources.length === 0}
		<div class="empty-state">
			<strong>Nincs találat.</strong>
			<span>Próbálj másik nevet, domaint vagy állapotot.</span>
		</div>
	{/if}

	<nav class="pagination-row" aria-label="Források lapozás">
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

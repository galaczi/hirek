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
	const feedStatusLabels: Record<string, string> = {
		active: 'Aktív',
		error: 'Hibás',
		inactive: 'Inaktív'
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
</script>

<svelte:head>
	<title>{data.selectedSource.name} - forrás - hirek.hu</title>
</svelte:head>

{#if form}
	<pre class="admin-result">{JSON.stringify(form, null, 2)}</pre>
{/if}

<section class="panel source-detail-hero">
	<div class="panel-heading-row">
		<div>
			<a class="secondary-link" href="/admin/sites/">Vissza a forrásokhoz</a>
			<p class="section-kicker">Forrás</p>
			<h2 class="panel-title">{data.selectedSource.name}</h2>
			<p class="panel-subtitle">{data.selectedSource.domain} · {data.selectedSource.slug}</p>
		</div>
		<a class="load-more-btn" href={`/${data.selectedSource.slug}/`}>Stream</a>
	</div>
</section>

<section class="admin-grid source-detail-grid">
	<form class="panel admin-form" method="POST" action="?/updateSourceDetails">
		<h2 class="panel-title">Forrás adatai</h2>
		<p class="form-hint">Itt a forrás alapadatait módosítod. Új feedet és URL szabályt külön űrlapon adj hozzá.</p>
		<label>
			<span>Név</span>
			<input name="name" value={data.selectedSource.name} required />
		</label>
		<label>
			<span>Slug</span>
			<input name="slug" value={data.selectedSource.slug} required />
		</label>
		<label>
			<span>Domain</span>
			<input name="domain" value={data.selectedSource.domain} required />
		</label>
		<button class="load-more-btn" type="submit">Adatok mentése</button>
	</form>

	<section class="panel source-health-panel">
		<div class="panel-heading-row">
			<div>
				<p class="section-kicker">Forrás állapota</p>
				<h3 class="compact-title">
					<span class:active={data.selectedSource.status === 'ingesting'} class="moderation-status">
						{sourceStatusLabels[data.selectedSource.status] ?? data.selectedSource.status}
					</span>
					<span>{data.selectedSource.activeFeedCount}/{data.selectedSource.totalFeedCount} aktív feed</span>
				</h3>
			</div>
			<span>{formatOptionalDate(data.selectedSource.lastFetchedAt)}</span>
		</div>

		{#if data.selectedSource.statusNote || data.selectedSource.lastError}
			<p class="form-hint">
				{data.selectedSource.statusNote ?? data.selectedSource.lastError}
			</p>
		{/if}

		<form class="source-health-form" method="POST" action="?/updateSourceStatus">
			<label>
				<span>Állapot</span>
				<select name="status" required>
					{#each data.sourceStatuses as status (status)}
						<option value={status} selected={data.selectedSource.status === status}>
							{sourceStatusLabels[status] ?? status}
						</option>
					{/each}
				</select>
			</label>
			<label>
				<span>Megjegyzés</span>
				<input name="statusNote" value={data.selectedSource.statusNote ?? ''} placeholder="Miért blokkolt, mi hiányzik, mi a következő lépés?" />
			</label>
			<button class="load-more-btn" type="submit">Állapot mentése</button>
		</form>
	</section>
</section>

<section class="panel">
	<div class="panel-heading-row">
		<div>
			<p class="section-kicker">Feedek</p>
			<h2 class="panel-title">Feed beállítások</h2>
		</div>
	</div>

	<form class="admin-form rule-inline-form" method="POST" action="?/addFeed">
		<input name="feedUrl" placeholder="https://domain.hu/rss" required />
		<select name="categoryId">
			<option value="none">Nincs fix rovat</option>
			{#each data.categories as category (category.id)}
				<option value={category.id}>{category.name}</option>
			{/each}
		</select>
		<button class="load-more-btn" type="submit">Feed hozzáadása</button>
	</form>

	<div class="feed-editor-list">
		<div class="feed-editor-row feed-editor-head">
			<span>Feed URL</span><span>Állapot</span><span>Fix rovat</span><span>Utolsó lekérés</span><span>Hiba</span><span></span>
		</div>
		{#if data.selectedFeeds.length === 0}
			<div class="empty-state compact-empty">
				<strong>Nincs feed rögzítve.</strong>
				<span>Adj hozzá legalább egy RSS vagy Atom URL-t.</span>
			</div>
		{:else}
			{#each data.selectedFeeds as feed (feed.id)}
				<form class="feed-editor-row" method="POST" action="?/updateFeed">
					<input type="hidden" name="feedId" value={feed.id} />
					<span title={feed.feedUrl}>{feed.feedUrl}</span>
					<select name="status" aria-label="Feed állapot">
						{#each data.feedStatuses as status (status)}
							<option value={status} selected={feed.status === status}>
								{feedStatusLabels[status] ?? status}
							</option>
						{/each}
					</select>
					<select name="categoryId" aria-label="Fix rovat">
						<option value="none">Nincs</option>
						{#each data.categories as category (category.id)}
							<option value={category.id} selected={feed.categoryId === category.id}>
								{category.name}
							</option>
						{/each}
					</select>
					<span>{formatOptionalDate(feed.lastFetchedAt)}</span>
					<input name="lastError" value={feed.lastError ?? ''} placeholder="Hibaüzenet" />
					<button type="submit">Mentés</button>
				</form>
			{/each}
		{/if}
	</div>
</section>

<section class="panel rules-detail-panel">
	<div class="panel-heading-row rules-heading">
		<div>
			<p class="section-kicker">URL kategorizálás</p>
			<h2 class="panel-title">Szabályok</h2>
			<p class="panel-subtitle">A minta lehet pontos részlet vagy wildcard végű útvonal, például {data.selectedSource.domain}/sport/*.</p>
		</div>
	</div>

	<form class="admin-form rule-inline-form" method="POST" action="?/addRule">
		<input name="urlPattern" placeholder={`${data.selectedSource.domain}/rovat/*`} required />
		<select name="categoryId" required>
			{#each data.categories as category (category.id)}
				<option value={category.id}>{category.name}</option>
			{/each}
		</select>
		<button class="load-more-btn" type="submit">Szabály hozzáadása</button>
	</form>

	<div class="rules-list">
		<div class="rules-row rules-row-head">
			<span>Minta</span><span>Cél rovat</span><span></span>
		</div>
		{#if data.selectedRules.length === 0}
			<div class="empty-state">
				<strong>Nincs URL szabály ehhez a forráshoz.</strong>
				<span>Adj hozzá egy mintát, például {data.selectedSource.domain}/sport/* -> Sport.</span>
			</div>
		{:else}
			{#each data.selectedRules as rule (rule.id)}
				<div class="rules-row">
					<span>{rule.urlPattern}</span>
					<span>{rule.categoryName}</span>
					<form method="POST" action="?/deleteRule">
						<input type="hidden" name="ruleId" value={rule.id} />
						<button type="submit">Törlés</button>
					</form>
				</div>
			{/each}
		{/if}
	</div>
</section>

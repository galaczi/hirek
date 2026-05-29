<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const feedStatusLabels: Record<string, string> = {
		active: 'Aktív',
		inactive: 'Inaktív',
		error: 'Hibás'
	};
	const jobStatusLabels: Record<string, string> = {
		queued: 'Sorban',
		processing: 'Feldolgozás alatt',
		done: 'Kész',
		failed: 'Hibás',
		archived: 'Archivált'
	};
	const jobTypeLabels: Record<string, string> = {
		'ingest-feed': 'Feed feldolgozás',
		'discover-sources': 'Forráskeresés',
		'discover-source-feeds': 'Feedkeresés',
		'reindex-article': 'Cikk újraindexelés'
	};

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
	<title>Adatgyűjtés - hirek.hu</title>
</svelte:head>

<section class="panel">
	<div class="admin-actions">
		<form method="POST" action="?/seed"><button class="load-more-btn">Registry seedelése</button></form>
		<form method="POST" action="?/discover"><button class="load-more-btn">Források keresése</button></form>
		<form method="POST" action="?/discoverFeeds"><button class="load-more-btn">Feedek keresése</button></form>
		<form class="admin-action-with-hint" method="POST" action="?/discoverAllFeeds">
			<button class="load-more-btn">Összes feed felderítése</button>
			<span>Minden feed nélküli forrást jobként vizsgál.</span>
		</form>
		<form method="POST" action="?/enqueueFeeds"><button class="load-more-btn">Feed jobok sorba</button></form>
		<form method="POST" action="?/run"><button class="load-more-btn">Sor futtatása</button></form>
		<form method="POST" action="?/reindex"><button class="load-more-btn">Reindex sorba</button></form>
	</div>
	{#if form}
		<pre class="admin-result">{JSON.stringify(form, null, 2)}</pre>
	{/if}
</section>

<section class="admin-grid">
	<div class="panel">
			<h2 class="panel-title">Feedek</h2>
			<div class="metric-list">
				{#each data.feedStats as stat (stat.status)}
					<div class="metric-row"><span>{feedStatusLabels[stat.status] ?? stat.status}</span><strong>{stat.count}</strong></div>
				{/each}
			</div>
	</div>

	<div class="panel">
			<h2 class="panel-title">Jobok</h2>
			<div class="metric-list">
				{#each data.jobStats as stat (stat.status)}
					<div class="metric-row"><span>{jobStatusLabels[stat.status] ?? stat.status}</span><strong>{stat.count}</strong></div>
				{/each}
			</div>
	</div>
</section>

<section class="panel">
	<h2 class="panel-title">Legutóbbi jobok</h2>
	<div class="admin-table">
		<div class="admin-row admin-row-head">
			<span>ID</span><span>Típus</span><span>Státusz</span><span>Próbák</span><span>Frissítve</span><span>Hiba</span>
		</div>
		{#each data.recentJobs as job (job.id)}
			<div class="admin-row">
				<span>{job.id}</span>
				<span>{jobTypeLabels[job.type] ?? job.type}</span>
				<span>{jobStatusLabels[job.status] ?? job.status}</span>
				<span>{job.attempts}</span>
				<span>{formatDate(job.updatedAt)}</span>
				<span>{job.lastError ?? ''}</span>
			</div>
		{/each}
	</div>
</section>

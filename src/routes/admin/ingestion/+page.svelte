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
</script>

<svelte:head>
	<title>Ingestion admin - hirek.hu</title>
</svelte:head>

<main class="app-container admin-page">
	<section class="search-panel">
		<p class="section-kicker">Admin</p>
		<h1>Ingestion pipeline</h1>
		<div class="admin-actions">
			<form method="POST" action="?/seed"><button class="load-more-btn">Seed registry</button></form>
			<form method="POST" action="?/discover"><button class="load-more-btn">Discover sources</button></form>
			<form method="POST" action="?/enqueueFeeds"><button class="load-more-btn">Queue feed jobs</button></form>
			<form method="POST" action="?/run"><button class="load-more-btn">Run queued jobs</button></form>
			<form method="POST" action="?/reindex"><button class="load-more-btn">Queue reindex</button></form>
		</div>
		{#if form}
			<pre class="admin-result">{JSON.stringify(form, null, 2)}</pre>
		{/if}
	</section>

	<section class="admin-grid">
		<div class="panel">
			<h2 class="panel-title">Feeds</h2>
			<div class="metric-list">
				{#each data.feedStats as stat (stat.status)}
					<div class="metric-row"><span>{stat.status}</span><strong>{stat.count}</strong></div>
				{/each}
			</div>
		</div>

		<div class="panel">
			<h2 class="panel-title">Jobs</h2>
			<div class="metric-list">
				{#each data.jobStats as stat (stat.status)}
					<div class="metric-row"><span>{stat.status}</span><strong>{stat.count}</strong></div>
				{/each}
			</div>
		</div>
	</section>

	<section class="panel">
		<h2 class="panel-title">Recent jobs</h2>
		<div class="admin-table">
			<div class="admin-row admin-row-head">
				<span>ID</span><span>Type</span><span>Status</span><span>Attempts</span><span>Updated</span><span>Error</span>
			</div>
			{#each data.recentJobs as job (job.id)}
				<div class="admin-row">
					<span>{job.id}</span>
					<span>{job.type}</span>
					<span>{job.status}</span>
					<span>{job.attempts}</span>
					<span>{formatDate(job.updatedAt)}</span>
					<span>{job.lastError ?? ''}</span>
				</div>
			{/each}
		</div>
	</section>
</main>

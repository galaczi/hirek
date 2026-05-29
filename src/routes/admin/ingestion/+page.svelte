<script lang="ts">
	import type { PageProps } from './$types';
	import InternalSectionHeader from '$lib/components/internal/InternalSectionHeader.svelte';
	import InternalMetricCard from '$lib/components/internal/InternalMetricCard.svelte';
	import StatusBadge from '$lib/components/internal/StatusBadge.svelte';

	let { data, form }: PageProps = $props();

	const feedStatusLabels: Record<string, string> = {
		active: 'Aktív feedek',
		inactive: 'Inaktív feedek',
		error: 'Hibás feedek'
	};
	const jobStatusLabels: Record<string, string> = {
		queued: 'Sorban áll',
		processing: 'Feldolgozás alatt',
		done: 'Sikeresen lefutott',
		failed: 'Meghiúsult',
		archived: 'Archiválva'
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

{#if form}
	<div class="result-toast">
		<pre class="admin-result">{JSON.stringify(form, null, 2)}</pre>
	</div>
{/if}

<section class="panel operations-panel">
	<InternalSectionHeader
		title="Adatgyűjtési és háttér-műveletek"
		subtitle="Futtatható manuális feladatok, feedek importálása, és a feladatsor (queue) vezérlése."
	/>
	
	<div class="admin-actions">
		<form method="POST" action="?/seed"><button class="action-btn seed-btn">Registry seedelése</button></form>
		<form method="POST" action="?/discover"><button class="action-btn">Források keresése</button></form>
		<form method="POST" action="?/discoverFeeds"><button class="action-btn">Feedek keresése</button></form>
		<form class="admin-action-with-hint" method="POST" action="?/discoverAllFeeds">
			<button class="action-btn primary-action-btn">Összes feed felderítése</button>
			<span class="action-hint">Minden feed nélküli forrást jobként vizsgál.</span>
		</form>
		<form method="POST" action="?/enqueueFeeds"><button class="action-btn">Feed jobok sorba</button></form>
		<form method="POST" action="?/run"><button class="action-btn queue-btn">Sor futtatása</button></form>
		<form method="POST" action="?/reindex"><button class="action-btn">Reindex sorba</button></form>
	</div>
</section>

<section class="admin-grid stats-grid">
	<div class="panel stats-panel">
		<InternalSectionHeader title="Feed csatornák" subtitle="Feedek jelenlegi állapota a rendszerben." />
		<div class="metrics-subgrid">
			{#each data.feedStats as stat (stat.status)}
				<InternalMetricCard
					label={feedStatusLabels[stat.status] ?? stat.status}
					value={stat.count}
					tone={stat.status === 'active' ? 'success' : stat.status === 'error' ? 'danger' : 'neutral'}
				/>
			{/each}
		</div>
	</div>

	<div class="panel stats-panel">
		<InternalSectionHeader title="Queue feladatok" subtitle="A feladatsor elemeinek eloszlása állapot szerint." />
		<div class="metrics-subgrid">
			{#each data.jobStats as stat (stat.status)}
				<InternalMetricCard
					label={jobStatusLabels[stat.status] ?? stat.status}
					value={stat.count}
					tone={stat.status === 'failed' ? 'danger' : stat.status === 'processing' ? 'accent' : stat.status === 'done' ? 'success' : 'neutral'}
				/>
			{/each}
		</div>
	</div>
</section>

<section class="panel jobs-panel">
	<InternalSectionHeader
		kicker="Audit napló"
		title="Legutóbbi háttérfeladatok (Jobok)"
		subtitle="A legfrissebb queue feladatok végrehajtási adatai és hibaüzenetei."
	/>
	
	<div class="admin-table">
		<div class="admin-row admin-row-head">
			<span>ID</span>
			<span>Típus</span>
			<span>Státusz</span>
			<span>Próbák</span>
			<span>Frissítve</span>
			<span>Hibaüzenet</span>
		</div>
		{#each data.recentJobs as job (job.id)}
			<div class="admin-row">
				<span class="job-id-cell">{job.id}</span>
				<span class="job-type-cell">{jobTypeLabels[job.type] ?? job.type}</span>
				<div class="job-status-cell">
					<StatusBadge
						label={jobStatusLabels[job.status] ?? job.status}
						tone={job.status === 'done' ? 'success' : job.status === 'failed' ? 'danger' : job.status === 'processing' ? 'accent' : 'warning'}
					/>
				</div>
				<span class="job-attempts-cell">{job.attempts}</span>
				<span class="job-date-cell">{formatDate(job.updatedAt)}</span>
				<span class="job-error-cell" class:error-text={Boolean(job.lastError)} title={job.lastError}>{job.lastError ?? '-'}</span>
			</div>
		{/each}
	</div>
</section>

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

	.operations-panel {
		margin-bottom: 1.5rem;
	}

	.admin-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1.25rem;
		background: var(--bg-base);
		padding: 1.25rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
	}
	.admin-actions form {
		display: inline-block;
	}
	.admin-action-with-hint {
		display: flex !important;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 20rem;
	}

	.action-btn {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--text-main);
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0.5rem 1rem;
		transition: var(--transition);
		cursor: pointer;
		white-space: nowrap;
	}
	.action-btn:hover {
		background: var(--bg-alt);
		border-color: var(--text-main);
		transform: translateY(-1px);
	}
	.primary-action-btn {
		color: white;
		background: var(--text-main);
		border-color: transparent;
	}
	.primary-action-btn:hover {
		background: hsl(215, 24%, 27%);
		color: white;
	}
	.seed-btn {
		background: var(--primary-light);
		color: var(--primary);
		border-color: rgba(255, 78, 58, 0.15);
	}
	.seed-btn:hover {
		background: var(--primary);
		color: white;
	}
	.queue-btn {
		background: hsl(145, 63%, 94%);
		color: var(--success);
		border-color: rgba(20, 180, 100, 0.15);
	}
	.queue-btn:hover {
		background: var(--success);
		color: white;
	}
	.action-hint {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 500;
	}

	.admin-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}
	@media (max-width: 1024px) {
		.admin-grid {
			grid-template-columns: 1fr;
		}
	}

	.metrics-subgrid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.jobs-panel {
		margin-bottom: 1.5rem;
	}

	.admin-table {
		display: grid;
		gap: 0.5rem;
		margin-top: 1.25rem;
	}
	.admin-row {
		display: grid;
		grid-template-columns: 80px 2fr 1.5fr 80px 1.5fr 3fr;
		gap: 1rem;
		align-items: center;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-card);
	}
	@media (max-width: 1024px) {
		.admin-row {
			grid-template-columns: 80px 2fr 1.5fr 1.5fr;
		}
		.job-attempts-cell, .job-error-cell, .admin-row-head span:nth-child(4), .admin-row-head span:nth-child(6) {
			display: none;
		}
	}
	@media (max-width: 640px) {
		.admin-row {
			grid-template-columns: 1fr;
			gap: 0.375rem;
		}
		.admin-row-head {
			display: none !important;
		}
	}

	.admin-row-head {
		font-size: 0.6875rem;
		font-weight: 800;
		color: var(--text-light);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: none;
		background: transparent;
		padding-bottom: 0.25rem;
	}

	.job-id-cell {
		font-family: monospace;
		font-size: 0.75rem;
		color: var(--text-light);
		font-weight: 700;
	}
	.job-type-cell {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--text-main);
	}
	.job-attempts-cell {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--text-muted);
	}
	.job-date-cell {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.job-error-cell {
		font-size: 0.75rem;
		color: var(--text-muted);
		max-width: 18rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.job-error-cell.error-text {
		color: #b42318;
		font-weight: 500;
	}
</style>

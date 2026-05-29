<script lang="ts">
	import type { PageProps } from './$types';
	import InternalMetricCard from '$lib/components/internal/InternalMetricCard.svelte';
	import InternalSectionHeader from '$lib/components/internal/InternalSectionHeader.svelte';
	import StatusBadge from '$lib/components/internal/StatusBadge.svelte';

	let { data, form }: PageProps = $props();

	const sourceStatuses = ['ingesting', 'needs_rss', 'needs_adapter', 'blocked', 'pending', 'disabled'];
	const partnerPackages = ['free', 'partner', 'growth'];
	const partnerStatuses = ['none', 'trial', 'active', 'paused', 'cancelled'];
	const approvalStatusLabels: Record<string, string> = {
		pending: 'Jóváhagyásra vár',
		approved: 'Jóváhagyott',
		rejected: 'Elutasított'
	};
	const sourceStatusLabels: Record<string, string> = {
		ingesting: 'Gyűjtés alatt',
		needs_rss: 'RSS szükséges',
		needs_adapter: 'Adapter szükséges',
		blocked: 'Blokkolt',
		pending: 'Függőben',
		disabled: 'Kikapcsolva'
	};
	const partnerPackageLabels: Record<string, string> = {
		free: 'Ingyenes',
		partner: 'Partner',
		growth: 'Növekedési'
	};
	const partnerStatusLabels: Record<string, string> = {
		none: 'Nincs',
		trial: 'Próbaidőszak',
		active: 'Aktív',
		paused: 'Szüneteltetve',
		cancelled: 'Lemondva'
	};

	const launchPercent = $derived(
		data.launchGate.expectedSources
			? Math.round((data.launchGate.liveSources / data.launchGate.expectedSources) * 100)
			: 0
	);
	const launchState = $derived(
		launchPercent >= 90 ? 'Indítható' : launchPercent >= 50 ? 'Közelít' : 'Nem indítható'
	);

	function formatDate(value: string | null) {
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
	<title>Admin - hirek.hu</title>
</svelte:head>

{#if form}
	<div class="result-toast">
		<pre class="admin-result">{JSON.stringify(form, null, 2)}</pre>
	</div>
{/if}

<section class="panel launch-gate-panel">
	<div class="launch-gate-header">
		<InternalSectionHeader
			kicker="Indítási feltételek"
			title="Hírkereső forrásuniverzum lefedettség"
			subtitle="A rendszer aktiválásához szükséges minimális forráslefedettségi szint nyomon követése."
		/>
		<div class="launch-state" class:ready={launchPercent >= 90} class:warning={launchPercent >= 50 && launchPercent < 90}>
			<strong>{launchPercent}%</strong>
			<span>{launchState}</span>
		</div>
	</div>

	<div class="launch-progress" aria-label={`Indítási készültség ${launchPercent}%`}>
		<span style={`width: ${Math.min(100, launchPercent)}%`}></span>
	</div>

	<div class="launch-metrics">
		<InternalMetricCard label="Célforrások" value={data.launchGate.expectedSources} tone="accent" />
		<InternalMetricCard label="Regisztrált" value={data.launchGate.registeredSources} tone="neutral" />
		<InternalMetricCard label="Éles források" value={data.launchGate.liveSources} tone="success" />
		<InternalMetricCard label="Aktív feedek" value={data.launchGate.activeFeedSources} tone="success" />
		<InternalMetricCard label="Beavatkozást igényel" value={data.launchGate.needsWork} tone={data.launchGate.needsWork > 0 ? 'danger' : 'neutral'} />
		<InternalMetricCard label="Kizárva indoklással" value={data.launchGate.blockedWithReason} tone="warning" />
	</div>
</section>

<section class="admin-grid">
	<div class="panel">
		<InternalSectionHeader title="Rendszer lefedettség" subtitle="Főbb aggregált adatok a forrásokról és cikkekről." />
		<div class="coverage-grid">
			<InternalMetricCard label="Források" value={data.totals.sources} tone="neutral" />
			<InternalMetricCard label="Összes cikk" value={data.totals.articles} tone="accent" />
			<InternalMetricCard label="Mért kattintások" value={data.totals.clicks} tone="success" />
			<InternalMetricCard label="Partnerek" value={data.totals.partners} tone="warning" />
		</div>
	</div>

	<div class="panel">
		<InternalSectionHeader title="Forrás státuszok" subtitle="Forrásaink eloszlása munkafolyamat-stádiumok szerint." />
		<div class="status-stats-list">
			{#each data.sourceStats as stat (stat.status)}
				<div class="status-stat-row">
					<StatusBadge
						label={sourceStatusLabels[stat.status] ?? stat.status}
						tone={stat.status === 'ingesting' ? 'success' : stat.status === 'blocked' ? 'danger' : stat.status === 'pending' ? 'warning' : 'muted'}
					/>
					<strong class="stat-count">{stat.count}</strong>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="panel registry-panel">
	<InternalSectionHeader
		title="Forrás registry állapot"
		subtitle="Források listája, alapbeállítások és csomagok közvetlen szerkesztése."
	/>
	<div class="source-registry-list">
		{#each data.sourceRegistry as source (source.id)}
			<form class="source-registry-row" method="POST" action="?/updateSource">
				<input type="hidden" name="sourceId" value={source.id} />
				<div class="source-registry-main">
					<div class="source-title-row">
						<a class="top-title" href={`/admin/sites/${source.id}/`}>{source.name}</a>
						<span class="source-badge-wrap">
							<StatusBadge
								label={approvalStatusLabels[source.approvalStatus] ?? source.approvalStatus}
								tone={source.approvalStatus === 'approved' ? 'success' : source.approvalStatus === 'rejected' ? 'danger' : 'warning'}
							/>
							<StatusBadge
								label={sourceStatusLabels[source.status] ?? source.status}
								tone={source.status === 'ingesting' ? 'success' : source.status === 'blocked' ? 'danger' : source.status === 'pending' ? 'warning' : 'muted'}
							/>
						</span>
					</div>
					<div class="top-meta">
						<span>{source.domain}</span>
						<span>·</span>
						<span>{source.activeFeedCount}/{source.feedCount} aktív feed</span>
						<span>·</span>
						<span>{source.articleCount} cikk</span>
						<span>·</span>
						<span>{source.clickCount} kattintás</span>
						<span>·</span>
						<span class="last-fetch">utolsó fetch: {formatDate(source.lastFetchedAt)}</span>
					</div>
					{#if source.lastError}
						<p class="form-error">{source.lastError}</p>
					{/if}
				</div>

				<div class="controls-grid">
					<label>
						<span>Státusz</span>
						<select name="status">
							{#each sourceStatuses as status (status)}
								<option value={status} selected={source.status === status}>{sourceStatusLabels[status]}</option>
							{/each}
						</select>
					</label>

					<label>
						<span>Indok / Megjegyzés</span>
						<input name="statusNote" value={source.statusNote ?? ''} placeholder="Hiányzó RSS, adapter kell..." />
					</label>

					<label>
						<span>Csomag</span>
						<select name="partnerPackage">
							{#each partnerPackages as option (option)}
								<option value={option} selected={source.partnerPackage === option}>{partnerPackageLabels[option]}</option>
							{/each}
						</select>
					</label>

					<label>
						<span>Partner</span>
						<select name="partnerStatus">
							{#each partnerStatuses as option (option)}
								<option value={option} selected={source.partnerStatus === option}>{partnerStatusLabels[option]}</option>
							{/each}
						</select>
					</label>

					<label>
						<span>Cél forgalom</span>
						<input name="trafficTarget" type="number" min="0" value={source.trafficTarget} />
					</label>
				</div>

				<button class="save-button" type="submit">Mentés</button>
			</form>
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

	.launch-gate-panel {
		display: grid;
		gap: 1.25rem;
		margin-bottom: 1.5rem;
	}
	.launch-gate-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1.5rem;
	}
	.launch-state {
		text-align: right;
		padding: 0.5rem 1rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: var(--radius-md);
		color: #991b1b;
		min-width: 8rem;
		box-shadow: var(--shadow-sm);
	}
	.launch-state.ready {
		background: hsl(145, 63%, 95%);
		border-color: rgba(20, 180, 100, 0.2);
		color: var(--success);
	}
	.launch-state.warning {
		background: #fffbeb;
		border-color: #fde68a;
		color: #92400e;
	}
	.launch-state strong {
		display: block;
		font-family: var(--font-display);
		font-size: 1.75rem;
		line-height: 1.1;
		font-weight: 800;
	}
	.launch-state span {
		display: block;
		font-size: 0.6875rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: 0.125rem;
	}

	.launch-progress {
		height: 0.625rem;
		background: var(--bg-alt);
		border-radius: var(--radius-pill);
		overflow: hidden;
		border: 1px solid var(--border);
	}
	.launch-progress span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, var(--primary), var(--secondary));
		border-radius: var(--radius-pill);
		transition: width 0.4s ease-out;
	}

	.launch-metrics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
		gap: 0.875rem;
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

	.coverage-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.status-stats-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	.status-stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: var(--bg-base);
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}
	.stat-count {
		font-family: var(--font-display);
		font-size: 1.125rem;
		color: var(--text-main);
	}

	.registry-panel {
		margin-top: 1.5rem;
	}

	.source-registry-list {
		display: grid;
		gap: 1rem;
		margin-top: 1.25rem;
	}

	.source-registry-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.875rem;
		padding: 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--bg-card);
		transition: var(--transition);
	}
	.source-registry-row:hover {
		border-color: var(--border-focus);
		box-shadow: var(--shadow-md);
	}

	.source-registry-main {
		display: grid;
		gap: 0.375rem;
	}
	.source-title-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
	}
	.top-title {
		font-family: var(--font-display);
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-main);
		text-decoration: none;
	}
	.top-title:hover {
		color: var(--primary);
	}
	.source-badge-wrap {
		display: flex;
		gap: 0.375rem;
	}
	.top-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 500;
	}
	.last-fetch {
		color: var(--text-light);
	}
	.form-error {
		margin-top: 0.25rem;
		font-size: 0.75rem;
		color: #b42318;
		background: #fef2f2;
		padding: 0.375rem 0.625rem;
		border-radius: var(--radius-sm);
		border-left: 3px solid #df1c1c;
	}

	.controls-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
		gap: 0.75rem;
		align-items: flex-end;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	label span {
		font-size: 0.6875rem;
		font-weight: 800;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	select, input {
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
	select:focus, input:focus {
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
		justify-self: end;
	}
	.save-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(255, 78, 58, 0.25);
	}
	.save-button:active {
		transform: translateY(0);
	}
</style>

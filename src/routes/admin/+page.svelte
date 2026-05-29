<script lang="ts">
	import type { PageProps } from './$types';

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
	<pre class="admin-result">{JSON.stringify(form, null, 2)}</pre>
{/if}

<section class="panel launch-gate-panel">
	<div class="launch-gate-header">
		<div>
			<p class="section-kicker">Indítási feltételek</p>
			<h2 class="panel-title">Hírkereső forrásuniverzum lefedettség</h2>
		</div>
		<div class="launch-state" class:ready={launchPercent >= 90} class:warning={launchPercent >= 50 && launchPercent < 90}>
			<strong>{launchPercent}%</strong>
			<span>{launchState}</span>
		</div>
	</div>

	<div class="launch-progress" aria-label={`Indítási készültség ${launchPercent}%`}>
		<span style={`width: ${Math.min(100, launchPercent)}%`}></span>
	</div>

	<div class="launch-metrics">
		<div>
			<span>Célforrások száma</span>
			<strong>{data.launchGate.expectedSources}</strong>
		</div>
		<div>
			<span>Regisztrált források</span>
			<strong>{data.launchGate.registeredSources}</strong>
		</div>
		<div>
			<span>Éles források</span>
			<strong>{data.launchGate.liveSources}</strong>
		</div>
		<div>
			<span>Aktív feed-források</span>
			<strong>{data.launchGate.activeFeedSources}</strong>
		</div>
		<div>
			<span>Beavatkozást igényel</span>
			<strong>{data.launchGate.needsWork}</strong>
		</div>
		<div>
			<span>Kizárva indoklással</span>
			<strong>{data.launchGate.blockedWithReason}</strong>
		</div>
	</div>
</section>

<section class="admin-grid">
	<div class="panel">
		<h2 class="panel-title">Lefedettség</h2>
		<div class="metric-list">
			<div class="metric-row"><span>Források</span><strong>{data.totals.sources}</strong></div>
			<div class="metric-row"><span>Cikkek</span><strong>{data.totals.articles}</strong></div>
			<div class="metric-row"><span>Mért kattintások</span><strong>{data.totals.clicks}</strong></div>
			<div class="metric-row"><span>Partner források</span><strong>{data.totals.partners}</strong></div>
		</div>
	</div>

	<div class="panel">
			<h2 class="panel-title">Forrás státuszok</h2>
			<div class="metric-list">
				{#each data.sourceStats as stat (stat.status)}
					<div class="metric-row"><span>{sourceStatusLabels[stat.status] ?? stat.status}</span><strong>{stat.count}</strong></div>
				{/each}
			</div>
	</div>
</section>

<section class="panel">
	<h2 class="panel-title">Forrás registry állapot</h2>
	<div class="source-registry-list">
		{#each data.sourceRegistry as source (source.id)}
			<form class="source-registry-row" method="POST" action="?/updateSource">
				<input type="hidden" name="sourceId" value={source.id} />
				<div class="source-registry-main">
					<a class="top-title" href={`/${source.slug}/`}>{source.name}</a>
					<div class="top-meta">
						<span>{source.domain}</span>
						<span>{approvalStatusLabels[source.approvalStatus] ?? source.approvalStatus}</span>
						<span>{source.activeFeedCount}/{source.feedCount} aktív feed</span>
						<span>{source.articleCount} cikk</span>
						<span>{source.clickCount} kattintás</span>
						<span>utolsó fetch: {formatDate(source.lastFetchedAt)}</span>
					</div>
					{#if source.lastError}
						<p class="form-error">{source.lastError}</p>
					{/if}
				</div>

				<label>
					<span>Státusz</span>
					<select name="status">
						{#each sourceStatuses as status (status)}
							<option value={status} selected={source.status === status}>{sourceStatusLabels[status]}</option>
						{/each}
					</select>
				</label>

				<label>
					<span>Indok</span>
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
					<span>Cél</span>
					<input name="trafficTarget" type="number" min="0" value={source.trafficTarget} />
				</label>

				<button type="submit">Mentés</button>
			</form>
		{/each}
	</div>
</section>

<script lang="ts">
	import { page } from '$app/state';
	import {
		exchangeStatusDescriptions,
		exchangeStatusLabels,
		partnerPackageDescriptions,
		partnerPackageLabels,
		partnerStatusLabels
	} from '$lib/source-commercial';
	import {
		formatMoney,
		publicSurfaceLabels,
		sourceBoostStatusLabels
	} from '$lib/source-acquisition';
	import type { PageProps } from './$types';
	import InternalSectionHeader from '$lib/components/internal/InternalSectionHeader.svelte';
	import InternalMetricCard from '$lib/components/internal/InternalMetricCard.svelte';
	import StatusBadge from '$lib/components/internal/StatusBadge.svelte';
	import InternalEmptyState from '$lib/components/internal/InternalEmptyState.svelte';

	let { data }: PageProps = $props();

	const isAdminSourcePicker = $derived(data.isAdmin && !data.partnerSourceId);
	const commercialSummary = $derived(
		data.commercialSummary ?? {
			partnerPackage: 'free',
			partnerStatus: 'none',
			exchangeStatus: 'none',
			trafficTarget: 0,
			targetClickCount: 0,
			targetRemaining: 0,
			targetProgressPercent: null,
			hasTrafficTarget: false
		}
	);
	const approvalStatusLabels: Record<string, string> = {
		pending: 'Jóváhagyásra vár',
		approved: 'Jóváhagyott',
		rejected: 'Elutasított'
	};
	const csvExportHref = $derived(buildPartnerHref('/partner/clicks.csv', data.reportDays));
	const clicksOverTimeMax = $derived(
		Math.max(1, ...data.clicksOverTime.map((item) => item.clickCount))
	);
	const topCategoriesMax = $derived(
		Math.max(1, ...data.topCategories.map((item) => item.clickCount))
	);
	const trafficSourcesMax = $derived(
		Math.max(1, ...data.trafficSources.map((item) => item.clickCount))
	);

	function buildPartnerHref(pathname: string, range: number, sourceId = data.partnerSourceId) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('range', String(range));
		if (data.isAdmin && sourceId) params.set('sourceId', String(sourceId));
		if (!data.isAdmin) params.delete('sourceId');
		return `${pathname}?${params.toString()}`;
	}

	function sourcePickerHref(sourceId: number) {
		return buildPartnerHref('/partner/', data.reportDays, sourceId);
	}

	function actionUrl(action: string) {
		const params = new URLSearchParams();
		params.set('range', String(data.reportDays));
		if (data.isAdmin && data.partnerSourceId) params.set('sourceId', String(data.partnerSourceId));
		const query = params.toString();
		return query ? `?/${action}&${query}` : `?/${action}`;
	}

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('hu-HU', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(value));
	}

	function formatOptionalDate(value: string | null) {
		return value ? formatDate(value) : 'nincs adat';
	}

	function feedStatusLabel(status: string) {
		if (status === 'active') return 'Aktív';
		if (status === 'error') return 'Hibás';
		if (status === 'inactive') return 'Inaktív';
		return status;
	}

	function barWidth(value: number, max: number) {
		return `${Math.max(3, Math.round((value / max) * 100))}%`;
	}

	function formatTrafficTarget() {
		if (!commercialSummary.hasTrafficTarget) return 'Nincs célforgalom';
		return `${commercialSummary.targetClickCount.toLocaleString('hu-HU')} / ${commercialSummary.trafficTarget.toLocaleString('hu-HU')} kattintás`;
	}

	function formatTrafficTargetSubtitle() {
		if (!commercialSummary.hasTrafficTarget) {
			return 'Ehhez a csomaghoz nincs külön időszakos forgalmi vállalás rögzítve.';
		}

		const percent = commercialSummary.targetProgressPercent ?? 0;
		const remaining = commercialSummary.targetRemaining;
		return remaining > 0
			? `${percent}% teljesítés, még ${remaining.toLocaleString('hu-HU')} kattintás hiányzik a célhoz.`
			: `${percent}% teljesítés, a célérték teljesült vagy meghaladott.`;
	}
</script>

<svelte:head>
	<title>Partner portál - hirek.hu</title>
</svelte:head>

<section class="panel partner-report-toolbar">
	<InternalSectionHeader
		kicker="Riport és elemzés"
		title="Partner analitika"
		subtitle="Kövesd nyomon a cikkek elérését, a látogatók kattintásait és a hírcsatorna állapotát."
	/>
	
	<div class="partner-report-actions">
		<div class="range-tabs" aria-label="Riport időszak">
			{#each data.reportRanges as range (range)}
				<a
					href={buildPartnerHref('/partner/', range)}
					class:active={data.reportDays === range}
					aria-current={data.reportDays === range ? 'page' : undefined}
				>
					{range} nap
				</a>
			{/each}
		</div>
		{#if !isAdminSourcePicker}
			<a class="export-button" href={csvExportHref}>CSV riport letöltése</a>
		{/if}
	</div>
</section>

{#if isAdminSourcePicker}
	<section class="panel picker-panel">
		<InternalSectionHeader
			title="Partnerforrás kiválasztása"
			subtitle="Válassz egy forrást az alábbiak közül, hogy megtekinthesd a hozzá tartozó partner riportokat, UTM beállításokat és kategorizálási szabályokat."
		/>
		
		<div class="partner-source-grid">
			{#each data.availableSources as source (source.id)}
				<a class="partner-source-card" href={sourcePickerHref(source.id)}>
					<div class="source-card-header">
						<strong class="source-card-title">{source.name}</strong>
						<span class="source-card-domain">{source.domain}</span>
					</div>
					
					<div class="partner-source-metrics">
						<span><strong>{source.clickCount.toLocaleString('hu-HU')}</strong> kattintás</span>
						<span><strong>{source.articleCount.toLocaleString('hu-HU')}</strong> cikk</span>
						{#if source.trafficTarget > 0}
							<span><strong>{source.trafficTarget.toLocaleString('hu-HU')}</strong> cél</span>
						{/if}
					</div>
					
					<div class="card-footer-badges">
						<StatusBadge
							label={approvalStatusLabels[source.approvalStatus] ?? source.approvalStatus}
							tone={source.approvalStatus === 'approved' ? 'success' : source.approvalStatus === 'rejected' ? 'danger' : 'warning'}
						/>
						<StatusBadge
							label={partnerPackageLabels[source.partnerPackage] ?? source.partnerPackage}
							tone="accent"
						/>
						<StatusBadge
							label={partnerStatusLabels[source.partnerStatus] ?? source.partnerStatus}
							tone={source.partnerStatus === 'active' ? 'success' : source.partnerStatus === 'paused' ? 'warning' : 'muted'}
						/>
					</div>
				</a>
			{:else}
				<InternalEmptyState
					title="Nincs partnerforrás"
					description="Először a központi adminisztrációs felületen jelölj ki egy forrást partner csomaggal."
					tone="warning"
				/>
			{/each}
		</div>
	</section>
{:else if data.sourceState && !data.sourceState.isApproved}
	<section class="panel pending-approval-panel">
		<InternalSectionHeader
			kicker="Jóváhagyásra vár"
			title={data.sourceState.sourceName}
			subtitle={data.sourceState.sourceDomain}
		/>
		
		<div class="pending-metrics-grid">
			<InternalMetricCard label="Jóváhagyás" value={approvalStatusLabels[data.sourceState.approvalStatus] ?? data.sourceState.approvalStatus} tone="warning" />
			<InternalMetricCard label="Partner csomag" value={partnerPackageLabels[data.sourceState.partnerPackage] ?? data.sourceState.partnerPackage} tone="accent" />
			<InternalMetricCard label="Kereskedelmi státusz" value={partnerStatusLabels[data.sourceState.partnerStatus] ?? data.sourceState.partnerStatus} tone="neutral" />
			<InternalMetricCard label="Csereprogram" value={exchangeStatusLabels[data.sourceState.exchangeStatus] ?? data.sourceState.exchangeStatus} tone="neutral" />
			<InternalMetricCard label="Működési státusz" value={data.sourceState.status} tone="neutral" />
		</div>
		
		<p class="config-warning">
			ℹ️ {data.sourceState.statusNote ?? 'A forrás jelenleg még ellenőrzés alatt áll. Az analitika és a feed beállítások a jóváhagyás után válnak elérhetővé.'}
		</p>
		<p class="config-warning">
			ℹ️ {partnerPackageDescriptions[data.sourceState.partnerPackage] ?? 'A csomag kiosztása előkészíthető, de az aktív partner állapot csak jóváhagyás után lép életbe.'}
		</p>
	</section>
{:else}
	<!-- Redesigned Kereskedelmi összefoglaló és Kampányvezérlő -->
	<section class="panel partner-dashboard-wrapper">
		<InternalSectionHeader 
			kicker="Partner vezérlőpult"
			title="Kereskedelmi összefoglaló és Kampányvezérlő" 
			subtitle="Tekintsd át a partnercsomagodat, a forgalmi vállalások teljesülését és a kiemelt (Boost) forgalomvásárlási kampányok egyenlegét." 
		/>

		<div class="partner-dashboard-grid" class:has-acquisition={Boolean(data.sourceState)}>
			<!-- CARD 1: Kereskedelmi státusz és csomag (Legacy Commercial) -->
			<div class="dashboard-card commercial-card">
				<div class="card-header-row">
					<h3 class="card-title">Kereskedelmi Csomag</h3>
					<span class="package-accent-badge">{partnerPackageLabels[commercialSummary.partnerPackage] ?? commercialSummary.partnerPackage}</span>
				</div>
				
				<div class="commercial-status-row">
					<div class="status-indicator-pill">
						<span class="indicator-label">Monetizáció:</span>
						<StatusBadge
							label={partnerStatusLabels[commercialSummary.partnerStatus] ?? commercialSummary.partnerStatus}
							tone={commercialSummary.partnerStatus === 'active' ? 'success' : 'muted'}
						/>
					</div>
					<div class="status-indicator-pill">
						<span class="indicator-label">Csereprogram:</span>
						<StatusBadge
							label={exchangeStatusLabels[commercialSummary.exchangeStatus] ?? commercialSummary.exchangeStatus}
							tone={commercialSummary.exchangeStatus === 'active' ? 'success' : commercialSummary.exchangeStatus === 'eligible' ? 'accent' : 'muted'}
						/>
					</div>
				</div>

				<div class="commercial-details-list">
					<div class="detail-item">
						<strong>Csomagígéret részletei</strong>
						<p>{partnerPackageDescriptions[commercialSummary.partnerPackage] ?? 'A csomagleírás még nincs rögzítve.'}</p>
					</div>
					<div class="detail-item">
						<strong>Csereprogram szabályzat</strong>
						<p>{exchangeStatusDescriptions[commercialSummary.exchangeStatus] ?? 'A csereprogram állapota még nincs részletezve.'}</p>
					</div>
				</div>
			</div>

			<!-- CARD 2: Célforgalmi vállalás és teljesítés (Progress block) -->
			<div class="dashboard-card progress-card">
				<h3 class="card-title">Forgalmi Vállalás Teljesítése</h3>
				
				{#if commercialSummary.hasTrafficTarget}
					<div class="progress-visual-container">
						<div class="progress-bar-container">
							<div class="progress-bar-track">
								<div class="progress-bar-fill" style="width: {commercialSummary.targetProgressPercent ?? 0}%"></div>
							</div>
							<span class="progress-percentage-bubble">{commercialSummary.targetProgressPercent ?? 0}%</span>
						</div>
						
						<div class="progress-numbers-summary">
							<div class="progress-metric">
								<span class="metric-label">Jelenlegi kattintások</span>
								<strong class="metric-value">{commercialSummary.targetClickCount.toLocaleString('hu-HU')}</strong>
							</div>
							<div class="progress-divider"></div>
							<div class="progress-metric">
								<span class="metric-label">Szerződéses célérték</span>
								<strong class="metric-value">{commercialSummary.trafficTarget.toLocaleString('hu-HU')}</strong>
							</div>
						</div>

						<div class="progress-status-remark">
							{#if commercialSummary.targetRemaining > 0}
								<div class="remark-badge warning-remark">
									⚠️ Még <strong>{commercialSummary.targetRemaining.toLocaleString('hu-HU')}</strong> kattintás hiányzik a célérték eléréséhez.
								</div>
							{:else}
								<div class="remark-badge success-remark">
									✅ A vállalt célforgalom sikeresen teljesítve vagy túlteljesítve!
								</div>
							{/if}
							<p class="remark-helper-text">{formatTrafficTargetSubtitle()}</p>
						</div>
					</div>
				{:else}
					<div class="no-target-state">
						<span class="info-icon">ℹ️</span>
						<strong>Nincs rögzített célforgalom</strong>
						<p>Ehhez a csomaghoz nincs külön időszakos forgalmi vállalás rögzítve a rendszerben.</p>
					</div>
				{/if}
			</div>

			<!-- CARD 3: Forgalomvásárlás & Boost (Traffic Acquisition & Wallet) -->
			{#if data.sourceState}
				<div class="dashboard-card acquisition-card">
					<div class="card-header-row">
						<h3 class="card-title">Paid & Csereprogram Boost</h3>
						<div class="boost-pulse-badge">
							<span class="pulse-dot" class:active={data.sourceState.boostStatus === 'active'}></span>
							<StatusBadge
								label={sourceBoostStatusLabels[data.sourceState.boostStatus as keyof typeof sourceBoostStatusLabels] ?? data.sourceState.boostStatus}
								tone={data.sourceState.boostStatus === 'active' ? 'success' : 'muted'}
							/>
						</div>
					</div>

					<!-- Wallet & Exchange Credit Balances -->
					<div class="balances-metric-grid">
						<div class="balance-pill wallet-pill">
							<span class="balance-label">Wallet egyenleg</span>
							<strong class="balance-value">{formatMoney(data.sourceState.walletBalance)}</strong>
						</div>
						<div class="balance-pill exchange-pill">
							<span class="balance-label">Csereprogram kredit</span>
							<strong class="balance-value">{formatMoney(data.sourceState.exchangeCreditBalance)}</strong>
						</div>
					</div>

					<!-- Trust and Campaign Settings Row -->
					<div class="campaign-parameters-grid">
						<div class="param-item">
							<span class="param-label">Max CPC licit</span>
							<strong class="param-value">{formatMoney(data.sourceState.maxCpc)}</strong>
						</div>
						<div class="param-item">
							<span class="param-label">Napi limit</span>
							<strong class="param-value">{data.sourceState.dailySpendCap > 0 ? formatMoney(data.sourceState.dailySpendCap) : 'Nincs limit'}</strong>
						</div>
						<div class="param-item trust-item">
							<span class="param-label">Bizalmi index: {data.sourceState.trustScore} / 10</span>
							<div class="mini-trust-meter">
								<div class="mini-trust-bar" style="width: {data.sourceState.trustScore * 10}%" class:low={data.sourceState.trustScore < 4} class:mid={data.sourceState.trustScore >= 4 && data.sourceState.trustScore < 8} class:high={data.sourceState.trustScore >= 8}></div>
							</div>
						</div>
					</div>

					<!-- Route targeting surface pills -->
					<div class="targeting-surfaces-section">
						<span class="section-label">Aktív kampány felületek</span>
						<div class="surfaces-pills-row">
							{#each (data.sourceState.boostRouteTargets ?? '').split(',').filter(Boolean) as surface}
								<span class="surface-pill-badge">{publicSurfaceLabels[surface as keyof typeof publicSurfaceLabels] ?? surface}</span>
							{:else}
								<span class="surface-pill-badge empty-pill">Minden felületen fut</span>
							{/each}
						</div>
					</div>

					<!-- Lifetime paid campaign stats -->
					<div class="lifetime-campaign-stats">
						<span class="section-label">Összesített Paid kézbesítési adatok</span>
						<div class="stats-mini-row">
							<span>Fizetett kattintások (Paid):</span>
							<strong>{data.sourceState.lifetimeBillableClicks.toLocaleString('hu-HU')} db</strong>
						</div>
						<div class="stats-mini-row">
							<span>Paid Wallet költés:</span>
							<strong>{formatMoney(data.sourceState.lifetimeWalletSpend)}</strong>
						</div>
						<div class="stats-mini-row">
							<span>Csereprogram költés:</span>
							<strong>{formatMoney(data.sourceState.lifetimeExchangeSpend)}</strong>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<section class="panel totals-panel">
		<InternalSectionHeader title="Összesített adatok" subtitle="Az aktuális időszakra vetített látogatottsági és tartalom-aggregációk." />
		
		<div class="partner-totals-grid">
			{#each data.sourceStats as source (source.sourceId)}
				<InternalMetricCard label="Cikkszám" value={source.articleCount.toLocaleString('hu-HU')} tone="neutral" />
				<InternalMetricCard label="Emberi kattintás" value={source.clickCount.toLocaleString('hu-HU')} tone="success" />
				<InternalMetricCard label="Egyedi látogatók" value={source.uniqueClickCount.toLocaleString('hu-HU')} tone="accent" />
			{/each}
		</div>
	</section>

	<section class="partner-analytics-grid">
		<section class="panel chart-card">
			<InternalSectionHeader kicker="Idősor" title={`Kattintások (Elmúlt ${data.reportDays} nap)`} />
			<div class="partner-bar-list">
				{#each data.clicksOverTime as day (day.day)}
					<div class="partner-bar-row">
						<span class="partner-bar-label">{day.label}</span>
						<div class="partner-bar-track" aria-label={`${day.clickCount} kattintás`}>
							<span class="partner-bar-fill" style={`width: ${barWidth(day.clickCount, clicksOverTimeMax)}`}></span>
						</div>
						<div class="partner-bar-values">
							<strong>{day.clickCount.toLocaleString('hu-HU')}</strong>
							<small>{day.uniqueClickCount.toLocaleString('hu-HU')} egyedi</small>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<section class="panel chart-card">
			<InternalSectionHeader kicker="Kategóriák" title="Népszerű rovatok" />
			<div class="partner-bar-list">
				{#each data.topCategories as category (category.slug)}
					<div class="partner-bar-row">
						<span class="partner-bar-label">{category.name}</span>
						<div class="partner-bar-track" aria-label={`${category.clickCount} kattintás`}>
							<span class="partner-bar-fill accent-fill" style={`width: ${barWidth(category.clickCount, topCategoriesMax)}`}></span>
						</div>
						<div class="partner-bar-values">
							<strong>{category.clickCount.toLocaleString('hu-HU')}</strong>
							<small>{category.uniqueClickCount.toLocaleString('hu-HU')} egyedi</small>
						</div>
					</div>
				{:else}
					<InternalEmptyState
						title="Nincs kategória adat"
						description="Még nem regisztráltunk kattintásokat a rovatokban ebben a riport-időszakban."
						tone="neutral"
						compact
					/>
				{/each}
			</div>
		</section>

		<section class="panel chart-card">
			<InternalSectionHeader kicker="Forgalom" title="Belső forgalmi csatornák" />
			<div class="partner-bar-list">
				{#each data.trafficSources as source (source.label)}
					<div class="partner-bar-row">
						<span class="partner-bar-label">{source.label}</span>
						<div class="partner-bar-track" aria-label={`${source.clickCount} kattintás`}>
							<span class="partner-bar-fill info-fill" style={`width: ${barWidth(source.clickCount, trafficSourcesMax)}`}></span>
						</div>
						<div class="partner-bar-values">
							<strong>{source.clickCount.toLocaleString('hu-HU')}</strong>
							<small>{source.uniqueClickCount.toLocaleString('hu-HU')} egyedi</small>
						</div>
					</div>
				{:else}
					<InternalEmptyState
						title="Nincs forgalmi adat"
						description="Ebben a riport-időszakban még nem érkezett látogató a belső forgalmi csatornákból."
						tone="neutral"
						compact
					/>
				{/each}
			</div>
		</section>
	</section>

	{#if data.partnerSourceId}
		<section class="admin-grid integration-grid">
			{#if data.sourceState}
				<form class="panel admin-form-card" method="POST" action={actionUrl('topupWallet')}>
					<InternalSectionHeader
						title="Wallet feltöltés"
						subtitle="Töltsd fel a fizetett boost egyenleget, és a rendszer számlát készít a feltöltésről."
					/>

					<div class="form-fields">
						<label>
							<span>Összeg (Ft)</span>
							<input name="amount" type="number" min="1" step="1" value="25000" required />
						</label>
						<label>
							<span>Számlázási név</span>
							<input name="billingName" placeholder="Cég vagy kapcsolattartó neve" required />
						</label>
						<label>
							<span>Számlázási email</span>
							<input name="billingEmail" type="email" placeholder="penzugy@pelda.hu" required />
						</label>
						<button class="save-button" type="submit">Wallet feltöltése</button>
					</div>
				</form>

				<form class="panel admin-form-card" method="POST" action={actionUrl('updateBoostSettings')}>
					<InternalSectionHeader
						title="Boost beállítások"
						subtitle="Állítsd be a max CPC értéket, a napi limitet és azt, hogy mely felületeken fusson a boost."
					/>

					<div class="form-fields">
						<label>
							<span>Boost állapot</span>
							<select name="boostStatus">
								<option value="paused" selected={data.sourceState.boostStatus === 'paused'}>Szünetel</option>
								<option value="active" selected={data.sourceState.boostStatus === 'active'}>Aktív</option>
							</select>
						</label>
						<label>
							<span>Max CPC</span>
							<input name="maxCpc" type="number" min="0" value={data.sourceState.maxCpc} required />
						</label>
						<label>
							<span>Napi limit</span>
							<input name="dailySpendCap" type="number" min="0" value={data.sourceState.dailySpendCap} required />
						</label>
					</div>

					<div class="route-target-chooser">
						<span class="route-target-label">Boost felületek</span>
						<div class="route-target-pills">
							{#each Object.entries(publicSurfaceLabels) as [surface, label]}
								<label class="route-target-option">
									<input
										type="checkbox"
										name="boostRouteTargets"
										value={surface}
										checked={(data.sourceState.boostRouteTargets ?? '').split(',').includes(surface)}
									/>
									<span>{label}</span>
								</label>
							{/each}
						</div>
					</div>

					<button class="save-button" type="submit">Boost beállítások mentése</button>
				</form>
			{/if}

			<section class="panel feeds-health-panel">
				<InternalSectionHeader title="Hírcsatornák állapota" subtitle="RSS feedek lekérési adatai és egészsége." />
				<div class="admin-table">
					<div class="admin-row admin-row-head">
						<span>Feed adatai</span>
						<span>Állapot</span>
						<span>Utolsó frissítés</span>
						<span>Hibaüzenet</span>
					</div>
					{#each data.feedHealth as feed (feed.feedId)}
						<div class="admin-row">
							<span class="feed-info-cell">
								<strong>{feed.sourceName}</strong>
								<span class="feed-url-text">{feed.feedUrl}</span>
							</span>
							<div class="feed-status-cell">
								<StatusBadge
									label={feedStatusLabel(feed.status)}
									tone={feed.status === 'active' ? 'success' : feed.status === 'error' ? 'danger' : 'muted'}
								/>
							</div>
							<span class="feed-date-cell">{formatOptionalDate(feed.lastFetchedAt)}</span>
							<span class="feed-error-cell" class:error-text={Boolean(feed.lastError)}>{feed.lastError ?? '-'}</span>
						</div>
					{/each}
				</div>
			</section>

			{#if data.sourceSettings}
				<form class="panel admin-form-card" method="POST" action={actionUrl('updateUtmSettings')}>
					<InternalSectionHeader
						title="UTM paraméterezés"
						subtitle={`${data.sourceSettings.sourceName} kimenő linkjeihez csatolt UTM kampánykódok a Google Analytics követéshez.`}
					/>
					
					<div class="form-fields">
						<label>
							<span>utm_source</span>
							<input name="utmSource" value={data.sourceSettings.utmSource} required />
						</label>
						<label>
							<span>utm_medium</span>
							<input name="utmMedium" value={data.sourceSettings.utmMedium} required />
						</label>
						<label>
							<span>utm_campaign</span>
							<input name="utmCampaign" value={data.sourceSettings.utmCampaign} required />
						</label>
						<button class="save-button" type="submit">Beállítások mentése</button>
					</div>
				</form>
			{/if}
		</section>

		<section class="admin-grid integration-grid">
			<section class="panel list-panel">
				<InternalSectionHeader title="Route és mód teljesítmény" subtitle="Mely felületeken és mely acquisition módban érkeztek a billable kattintások." />
				<div class="admin-table">
					<div class="admin-row admin-row-head">
						<span>Felület</span>
						<span>Mód</span>
						<span>Kattintás</span>
						<span>Költés</span>
					</div>
					{#each data.routePerformance as item (`${item.surface}-${item.acquisitionMode}`)}
						<div class="admin-row">
							<span>{item.surfaceLabel}</span>
							<span>{item.acquisitionModeLabel}</span>
							<span>{item.clickCount.toLocaleString('hu-HU')}</span>
							<span>{formatMoney(item.spendAmount)}</span>
						</div>
					{:else}
						<InternalEmptyState
							title="Nincs route adat"
							description="Még nem érkezett billable kattintás route bontásban ebben az időszakban."
							tone="neutral"
							compact
						/>
					{/each}
				</div>
			</section>

			<section class="panel list-panel">
				<InternalSectionHeader title="Legutóbbi wallet események" subtitle="Feltöltések és kattintásalapú levonások időrendben." />
				<div class="admin-table">
					<div class="admin-row admin-row-head">
						<span>Esemény</span>
						<span>Típus</span>
						<span>Összeg</span>
						<span>Idő</span>
					</div>
					{#each data.recentLedger as entry (entry.id)}
						<div class="admin-row">
							<span>{entry.description}</span>
							<span>{entry.fundingType ?? entry.entryType}</span>
							<span class:negative-amount={entry.amount < 0}>{formatMoney(entry.amount)}</span>
							<span>{formatDate(entry.createdAt)}</span>
						</div>
					{:else}
						<InternalEmptyState
							title="Nincs wallet esemény"
							description="A wallet még nem kapott feltöltést vagy levonást."
							tone="neutral"
							compact
						/>
					{/each}
				</div>
			</section>
		</section>

		<section class="panel list-panel">
			<InternalSectionHeader title="Számlák" subtitle="A legutóbbi wallet feltöltésekhez kapcsolódó számlák és státuszok." />
			<div class="admin-table">
				<div class="admin-row admin-row-head">
					<span>Leírás</span>
					<span>Provider</span>
					<span>Státusz</span>
					<span>Összeg</span>
					<span>Azonosító</span>
				</div>
				{#each data.recentInvoices as invoice (invoice.id)}
					<div class="admin-row">
						<span>{invoice.description}</span>
						<span>{invoice.provider}</span>
						<span>{invoice.status}</span>
						<span>{formatMoney(invoice.amount)}</span>
						<span>{invoice.externalNumber ?? '-'}</span>
					</div>
				{:else}
					<InternalEmptyState
						title="Nincs számla"
						description="Még nem jött létre wallet feltöltéshez tartozó számla."
						tone="neutral"
						compact
					/>
				{/each}
			</div>
		</section>

		<section class="admin-grid rules-grid">
			<form class="panel admin-form-card" method="POST" action={actionUrl('addUrlRule')}>
				<InternalSectionHeader title="Új URL kategóriaszabály" subtitle="Szabály hozzáadása az automatikus rovatba soroláshoz." />
				<div class="form-fields">
					<label>
						<span>URL Minta</span>
						<input name="urlPattern" placeholder="domain.hu/sport/*" required />
					</label>
					<label>
						<span>Cél rovat</span>
						<select name="categorySlug" required>
							{#each data.categories as category (category.slug)}
								<option value={category.slug}>{category.name}</option>
							{/each}
						</select>
					</label>
					<button class="save-button" type="submit">Szabály mentése</button>
				</div>
			</form>

			<section class="panel current-rules-panel">
				<InternalSectionHeader title="Aktuális szabályok" subtitle="Jelenlegi kategorizálási irányelvek a forráshoz." />
				<div class="admin-table">
					<div class="admin-row admin-row-head">
						<span>Minta</span>
						<span>Kategória</span>
						<span>Művelet</span>
					</div>
					{#each data.sourceRules as rule (rule.id)}
						<div class="admin-row rules-list-row">
							<span class="rule-pattern">{rule.urlPattern}</span>
							<span class="rule-category">{rule.categoryName}</span>
							<form class="delete-form" method="POST" action={actionUrl('deleteUrlRule')}>
								<input type="hidden" name="ruleId" value={rule.id} />
								<button class="delete-btn" type="submit">Törlés</button>
							</form>
						</div>
					{:else}
						<InternalEmptyState
							title="Nincsenek egyedi szabályok"
							description="Ez a forrás nem rendelkezik egyedi URL szabályokkal."
							tone="neutral"
							compact
						/>
					{/each}
				</div>
			</section>
		</section>
	{/if}

	<section class="admin-grid analytics-tables-grid">
		<div class="panel list-panel">
			<InternalSectionHeader title="Cikkenkénti kattintások" subtitle="A riport időszak legnépszerűbb cikkei és rovat felülbírálata." />
			
			<div class="articles-list">
				{#each data.topArticles as article (article.id)}
					<div class="article-analytics-row">
						<div class="article-main-copy">
							<a class="article-title" href={`/go/${article.id}`} target="_blank" rel="noopener">{article.title}</a>
							<div class="article-metadata">
								<span class="source-label">{article.sourceName}</span>
								<span>·</span>
								<span class="stats-label"><strong>{article.clickCount.toLocaleString('hu-HU')}</strong> kattintás (<strong>{article.uniqueClickCount.toLocaleString('hu-HU')}</strong> egyedi)</span>
								<span>·</span>
								<span class="date-label">{formatDate(article.publishedAt)}</span>
							</div>
						</div>
						
						<form class="category-override-form" method="POST" action={actionUrl('overrideCategory')}>
							<input type="hidden" name="articleId" value={article.id} />
							<select name="categorySlug" aria-label="Kategória felülírása">
								{#each data.categories as category (category.slug)}
									<option value={category.slug}>{category.name}</option>
								{/each}
							</select>
							<button class="override-save-btn" type="submit">Mentés</button>
						</form>
					</div>
				{/each}
			</div>
		</div>

		<div class="panel list-panel">
			<InternalSectionHeader title="Legutóbbi kattintások" subtitle="Valós idejű látogatói eseménynapló." />
			
			<div class="clicks-log-list">
				{#each data.recentClicks as click (click.id)}
					<div class="click-event-row">
						<div class="click-title">{click.articleTitle}</div>
						<div class="click-meta">
							<span class="click-source">{click.sourceName}</span>
							<span>·</span>
							<span class="click-time">{formatDate(click.createdAt)}</span>
							<span>·</span>
							<span class="click-type" class:is-unique={click.isUnique}>
								{click.isUnique ? 'egyedi látogató' : 'visszatérő látogató'}
							</span>
							{#if click.utmCampaign}
								<span>·</span>
								<span class="click-utm">{click.utmCampaign}</span>
							{/if}
							<span>·</span>
							<span class="click-ref">{click.referrer ?? 'közvetlen belépés'}</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}

<style>
	.partner-report-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}
	.partner-report-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.range-tabs {
		display: flex;
		background: var(--bg-alt);
		padding: 0.25rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}
	.range-tabs a {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--text-muted);
		padding: 0.375rem 0.875rem;
		border-radius: var(--radius-sm);
		text-decoration: none;
		transition: var(--transition);
	}
	.range-tabs a.active {
		background: var(--bg-card);
		color: var(--primary);
		box-shadow: var(--shadow-sm);
	}
	.export-button {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 700;
		color: white;
		background: linear-gradient(135deg, var(--text-main), hsl(215, 24%, 27%));
		border-radius: var(--radius-md);
		padding: 0.5rem 1rem;
		text-decoration: none;
		box-shadow: var(--shadow-sm);
		transition: var(--transition);
	}
	.export-button:hover {
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.picker-panel {
		margin-bottom: 1.5rem;
	}
	.partner-source-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: 1rem;
		margin-top: 1.25rem;
	}
	.partner-source-card {
		display: grid;
		gap: 1rem;
		padding: 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--bg-card);
		text-decoration: none;
		color: var(--text-main);
		transition: var(--transition);
	}
	.partner-source-card:hover {
		border-color: var(--border-focus);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
	.source-card-header {
		display: grid;
		gap: 0.125rem;
	}
	.source-card-title {
		font-family: var(--font-display);
		font-size: 1.125rem;
		font-weight: 800;
	}
	.source-card-domain {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.partner-source-metrics {
		display: flex;
		gap: 1rem;
		font-size: 0.8125rem;
		color: var(--text-muted);
		background: var(--bg-base);
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
	}
	.partner-source-metrics strong {
		color: var(--text-main);
		font-family: var(--font-display);
	}
	.card-footer-badges {
		display: flex;
		gap: 0.375rem;
	}

	.pending-approval-panel {
		margin-bottom: 1.5rem;
	}
	.pending-metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: 0.875rem;
		margin-top: 1.25rem;
		margin-bottom: 1.25rem;
	}
	.config-warning {
		font-size: 0.8125rem;
		color: #92400e;
		background: #fffbeb;
		border: 1px solid #fde68a;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
	}


	.totals-panel {
		margin-bottom: 1.5rem;
	}
	.partner-totals-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: 0.875rem;
		margin-top: 1.25rem;
	}

	/* Redesigned Partner Dashboard & Campaign Overview styling */
	.partner-dashboard-wrapper {
		margin-bottom: 2rem;
		background: linear-gradient(180deg, var(--bg-card) 0%, rgba(255, 255, 255, 0.7) 100%);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-sm);
	}
	.partner-dashboard-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-top: 1.5rem;
	}
	.partner-dashboard-grid.has-acquisition {
		grid-template-columns: 1fr 1fr 1.2fr;
	}
	@media (max-width: 1024px) {
		.partner-dashboard-grid, .partner-dashboard-grid.has-acquisition {
			grid-template-columns: 1fr;
		}
	}
	
	.dashboard-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		box-shadow: var(--shadow-sm);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		transition: var(--transition);
	}
	.dashboard-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		border-color: var(--border-focus);
	}
	.card-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	.card-title {
		font-family: var(--font-display);
		font-size: 1.0625rem;
		font-weight: 800;
		color: var(--text-main);
		margin: 0;
	}
	.package-accent-badge {
		font-family: var(--font-display);
		font-size: 0.75rem;
		font-weight: 850;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--primary);
		background: var(--primary-light);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-pill);
		border: 1px solid rgba(255, 78, 58, 0.15);
	}

	.commercial-status-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		background: var(--bg-base);
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}
	.status-indicator-pill {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.indicator-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.commercial-details-list {
		display: grid;
		gap: 1rem;
	}
	.detail-item {
		font-size: 0.78125rem;
		line-height: 1.45;
	}
	.detail-item strong {
		display: block;
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin-bottom: 0.25rem;
	}
	.detail-item p {
		margin: 0;
		color: var(--text-main);
		font-weight: 550;
	}

	/* Progress card elements */
	.progress-visual-container {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.progress-bar-container {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.progress-bar-track {
		flex: 1;
		height: 12px;
		background: var(--bg-alt);
		border-radius: var(--radius-pill);
		overflow: hidden;
		border: 1px solid var(--border);
	}
	.progress-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--primary), var(--secondary));
		border-radius: var(--radius-pill);
		transition: width 0.4s ease-out;
	}
	.progress-percentage-bubble {
		font-family: var(--font-display);
		font-size: 0.8125rem;
		font-weight: 800;
		color: var(--primary);
		background: var(--primary-light);
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		border: 1px solid rgba(255, 78, 58, 0.12);
	}
	.progress-numbers-summary {
		display: flex;
		align-items: center;
		justify-content: space-around;
		background: var(--bg-base);
		padding: 0.75rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}
	.progress-metric {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}
	.metric-label {
		font-size: 0.6875rem;
		font-weight: 700;
		color: var(--text-muted);
	}
	.metric-value {
		font-family: var(--font-display);
		font-size: 1.125rem;
		font-weight: 800;
		color: var(--text-main);
	}
	.progress-divider {
		width: 1px;
		height: 24px;
		background: var(--border);
	}
	.progress-status-remark {
		display: grid;
		gap: 0.5rem;
	}
	.remark-badge {
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-sm);
		width: fit-content;
	}
	.warning-remark {
		background: #fffbeb;
		color: #92400e;
		border: 1px solid #fde68a;
	}
	.success-remark {
		background: hsl(145, 63%, 94%);
		color: var(--success);
		border: 1px solid rgba(20, 180, 100, 0.2);
	}
	.remark-helper-text {
		margin: 0;
		font-size: 0.75rem;
		color: var(--text-muted);
		line-height: 1.4;
		font-weight: 500;
	}
	.no-target-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		background: var(--bg-base);
		border: 1px dashed var(--border);
		border-radius: var(--radius-md);
		padding: 2rem 1.5rem;
		flex: 1;
	}
	.no-target-state .info-icon {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}
	.no-target-state strong {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin-bottom: 0.25rem;
	}
	.no-target-state p {
		margin: 0;
		font-size: 0.75rem;
		color: var(--text-light);
		line-height: 1.4;
	}

	/* Paid Campaign & Boost card elements */
	.acquisition-card {
		background:
			radial-gradient(circle at bottom right, rgba(255, 78, 58, 0.03), transparent 50%),
			var(--bg-card);
		border-color: rgba(255, 78, 58, 0.14);
	}
	.boost-pulse-badge {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.pulse-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--text-light);
		position: relative;
	}
	.pulse-dot.active {
		background: var(--success);
	}
	.pulse-dot.active::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: var(--success);
		animation: pulse 1.6s infinite ease-in-out;
	}
	@keyframes pulse {
		0% { transform: scale(1); opacity: 1; }
		100% { transform: scale(2.4); opacity: 0; }
	}

	.balances-metric-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.balance-pill {
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.wallet-pill {
		background: linear-gradient(135deg, rgba(255, 78, 58, 0.02), rgba(255, 78, 58, 0.05));
		border-color: rgba(255, 78, 58, 0.16);
	}
	.wallet-pill .balance-value {
		color: var(--primary);
	}
	.exchange-pill {
		background: linear-gradient(135deg, rgba(255, 185, 120, 0.06), rgba(255, 185, 120, 0.12));
		border-color: rgba(255, 185, 120, 0.3);
	}
	.exchange-pill .balance-value {
		color: hsl(30, 95%, 45%);
	}
	.balance-label {
		font-size: 0.625rem;
		font-weight: 850;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--text-muted);
	}
	.balance-value {
		font-family: var(--font-display);
		font-size: 1.125rem;
		font-weight: 800;
	}

	.campaign-parameters-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem 1rem;
		background: var(--bg-base);
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}
	.param-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.param-label {
		font-size: 0.6875rem;
		font-weight: 700;
		color: var(--text-light);
	}
	.param-value {
		font-size: 0.8125rem;
		font-weight: 800;
		color: var(--text-main);
	}
	.trust-item {
		grid-column: span 2;
		margin-top: 0.25rem;
	}
	.mini-trust-meter {
		height: 6px;
		background: var(--bg-alt);
		border-radius: var(--radius-pill);
		overflow: hidden;
		border: 1px solid var(--border);
		margin-top: 0.125rem;
	}
	.mini-trust-bar {
		height: 100%;
		border-radius: var(--radius-pill);
	}
	.mini-trust-bar.low { background: #ef4444; }
	.mini-trust-bar.mid { background: var(--secondary); }
	.mini-trust-bar.high { background: var(--success); }

	.targeting-surfaces-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.section-label {
		font-size: 0.6875rem;
		font-weight: 850;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-light);
	}
	.surfaces-pills-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.surface-pill-badge {
		font-size: 0.6875rem;
		font-weight: 750;
		color: var(--primary);
		background: var(--primary-light);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		border: 1px solid rgba(255, 78, 58, 0.12);
	}
	.surface-pill-badge.empty-pill {
		color: var(--text-muted);
		background: var(--bg-alt);
		border-color: var(--border);
	}

	.lifetime-campaign-stats {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		border-top: 1px solid var(--border);
		padding-top: 0.75rem;
	}
	.stats-mini-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
	}
	.stats-mini-row span {
		color: var(--text-muted);
		font-weight: 500;
	}
	.stats-mini-row strong {
		color: var(--text-main);
		font-weight: 750;
	}

	/* Existing visual sections */
	.partner-analytics-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}
	@media (max-width: 1024px) {
		.partner-analytics-grid {
			grid-template-columns: 1fr;
		}
	}
	.chart-card {
		display: flex;
		flex-direction: column;
		gap: 1.125rem;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		box-shadow: var(--shadow-sm);
	}
	.partner-bar-list {
		display: grid;
		gap: 0.75rem;
		flex: 1;
	}
	.partner-bar-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.partner-bar-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
		width: 5.5rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.partner-bar-track {
		flex: 1;
		height: 0.5rem;
		background: var(--bg-alt);
		border-radius: var(--radius-pill);
		overflow: hidden;
	}
	.partner-bar-fill {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, var(--primary), var(--secondary));
		border-radius: var(--radius-pill);
		transition: width 0.3s ease-in-out;
	}
	.partner-bar-fill.accent-fill {
		background: linear-gradient(90deg, hsl(270, 70%, 45%), hsl(290, 75%, 55%));
	}
	.partner-bar-fill.info-fill {
		background: linear-gradient(90deg, var(--info), hsl(198, 93%, 41%));
	}
	.partner-bar-values {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		width: 4.5rem;
		line-height: 1.2;
	}
	.partner-bar-values strong {
		font-family: var(--font-display);
		font-size: 0.8125rem;
		color: var(--text-main);
	}
	.partner-bar-values small {
		font-size: 0.625rem;
		color: var(--text-light);
		white-space: nowrap;
	}

	.integration-grid, .rules-grid {
		display: grid;
		grid-template-columns: 2.2fr 1fr;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}
	@media (max-width: 1024px) {
		.integration-grid, .rules-grid {
			grid-template-columns: 1fr;
		}
	}

	.feeds-health-panel, .current-rules-panel {
		overflow: hidden;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		box-shadow: var(--shadow-sm);
	}

	.admin-table {
		display: grid;
		gap: 0.5rem;
		margin-top: 1.125rem;
	}
	.admin-row {
		display: grid;
		grid-template-columns: 2fr 100px 1.5fr 3fr;
		gap: 1rem;
		align-items: center;
		padding: 0.625rem 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-card);
		transition: var(--transition);
	}
	.admin-row:hover:not(.admin-row-head) {
		border-color: var(--text-light);
	}
	.rules-list-row {
		grid-template-columns: 3fr 2fr 80px;
	}
	.admin-row-head {
		font-size: 0.6875rem;
		font-weight: 850;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: none;
		background: transparent;
		padding-bottom: 0.25rem;
	}
	
	.feed-info-cell {
		display: grid;
		gap: 0.125rem;
		min-width: 0;
	}
	.feed-info-cell strong {
		font-size: 0.8125rem;
		color: var(--text-main);
	}
	.feed-url-text {
		font-size: 0.75rem;
		color: var(--text-light);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 15rem;
	}
	.feed-status-cell {
		display: flex;
		align-items: center;
	}
	.feed-date-cell {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 500;
	}
	.feed-error-cell {
		font-size: 0.75rem;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.feed-error-cell.error-text {
		color: #b42318;
		font-weight: 600;
	}

	.rule-pattern {
		font-family: monospace;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-main);
		background: var(--bg-alt);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		width: fit-content;
	}
	.rule-category {
		font-size: 0.8125rem;
		font-weight: 750;
		color: var(--primary);
	}
	.delete-form {
		width: 100%;
	}
	.delete-btn {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 750;
		color: #b42318;
		background: #fef2f2;
		border: 1px solid rgba(220, 38, 38, 0.15);
		border-radius: var(--radius-md);
		padding: 0.375rem;
		transition: var(--transition);
		width: 100%;
		cursor: pointer;
		text-align: center;
	}
	.delete-btn:hover {
		background: #b42318;
		color: white;
	}

	/* Form layouts */
	.admin-form-card {
		display: grid;
		gap: 1.25rem;
		align-content: start;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		box-shadow: var(--shadow-sm);
	}
	.form-fields {
		display: grid;
		gap: 1rem;
	}
	label {
		display: grid;
		gap: 0.25rem;
	}
	label span {
		font-size: 0.6875rem;
		font-weight: 850;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	input, select {
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: var(--text-main);
		background: var(--bg-alt);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0.5625rem 0.875rem;
		outline: none;
		transition: var(--transition);
		width: 100%;
	}
	input:focus, select:focus {
		background: var(--bg-card);
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(255, 78, 58, 0.12);
	}
	.save-button {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 750;
		color: white;
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		border-radius: var(--radius-md);
		padding: 0.625rem 1.25rem;
		box-shadow: 0 2px 6px rgba(255, 78, 58, 0.15);
		transition: var(--transition);
		width: fit-content;
		border: none;
		cursor: pointer;
	}
	.save-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(255, 78, 58, 0.25);
	}

	.analytics-tables-grid {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: 1.5rem;
		margin-top: 1.5rem;
	}
	@media (max-width: 1024px) {
		.analytics-tables-grid {
			grid-template-columns: 1fr;
		}
	}
	.list-panel {
		display: flex;
		flex-direction: column;
		gap: 1.125rem;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		box-shadow: var(--shadow-sm);
	}

	/* Articles list */
	.articles-list {
		display: grid;
		gap: 0.625rem;
	}
	.article-analytics-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1.25rem;
		padding: 0.875rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--bg-card);
		transition: var(--transition);
	}
	.article-analytics-row:hover {
		border-color: var(--border-focus);
		box-shadow: var(--shadow-sm);
	}
	@media (max-width: 640px) {
		.article-analytics-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}
		.category-override-form {
			width: 100%;
		}
	}
	.article-main-copy {
		display: grid;
		gap: 0.375rem;
		flex: 1;
		min-width: 0;
	}
	.article-title {
		font-family: var(--font-body);
		font-weight: 750;
		font-size: 0.875rem;
		line-height: 1.45;
		color: var(--text-main);
		text-decoration: none;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.article-title:hover {
		color: var(--primary);
	}
	.article-metadata {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		align-items: center;
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.source-label {
		color: var(--primary);
		font-weight: 700;
	}
	.stats-label strong {
		color: var(--text-main);
	}
	.date-label {
		color: var(--text-light);
	}
	.category-override-form {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.category-override-form select {
		padding: 0.375rem 0.5rem;
		min-width: 8rem;
		font-size: 0.8125rem;
	}
	.override-save-btn {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 750;
		color: var(--text-main);
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0.375rem 0.625rem;
		transition: var(--transition);
		cursor: pointer;
		text-align: center;
	}
	.override-save-btn:hover {
		background: var(--primary-light);
		color: var(--primary);
		border-color: var(--primary);
	}
	.route-target-chooser {
		display: grid;
		gap: 0.75rem;
		margin-top: 0.75rem;
		margin-bottom: 0.75rem;
	}
	.route-target-label {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.route-target-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
	}
	.route-target-option {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		background: var(--bg-base);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-main);
	}
	.route-target-option input {
		accent-color: var(--primary);
	}
	.negative-amount {
		color: #b42318;
		font-weight: 700;
	}

	/* Click logs */
	.clicks-log-list {
		display: grid;
		gap: 0.5rem;
		max-height: 38rem;
		overflow-y: auto;
		padding-right: 0.25rem;
	}
	.click-event-row {
		display: grid;
		gap: 0.25rem;
		padding: 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-card);
		transition: var(--transition);
	}
	.click-event-row:hover {
		border-color: var(--text-light);
	}
	.click-title {
		font-size: 0.8125rem;
		font-weight: 750;
		color: var(--text-main);
		line-height: 1.4;
	}
	.click-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		align-items: center;
		font-size: 0.75rem;
		color: var(--text-light);
	}
	.click-source {
		color: var(--text-muted);
		font-weight: 600;
	}
	.click-type {
		font-weight: 700;
		color: var(--text-muted);
	}
	.click-type.is-unique {
		color: var(--success);
	}
	.click-utm {
		color: var(--primary);
		font-weight: 600;
	}
	.click-ref {
		font-style: italic;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 10rem;
	}
</style>

<script lang="ts">
	import {
		EXCHANGE_STATUS_VALUES,
		PARTNER_PACKAGE_VALUES,
		PARTNER_STATUS_VALUES,
		exchangeStatusDescriptions,
		exchangeStatusLabels,
		partnerPackageDescriptions,
		partnerPackageLabels,
		partnerStatusLabels
	} from '$lib/source-commercial';
	import {
		PUBLIC_SURFACE_VALUES,
		SOURCE_BOOST_STATUS_VALUES,
		formatMoney,
		publicSurfaceLabels,
		sourceBoostStatusLabels
	} from '$lib/source-acquisition';
	import type { PageProps } from './$types';
	import StatusBadge from '$lib/components/internal/StatusBadge.svelte';
	import InternalEmptyState from '$lib/components/internal/InternalEmptyState.svelte';
	import InternalSectionHeader from '$lib/components/internal/InternalSectionHeader.svelte';

	let { data, form }: PageProps = $props();

	// Reactive state for visual Trust Score representation
	function getInitialTrustScore() {
		return data.selectedSource.trustScore ?? 0;
	}
	let trustScore = $state(getInitialTrustScore());

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
	const approvalStatusLabels: Record<string, string> = {
		pending: 'Jóváhagyásra vár',
		approved: 'Jóváhagyott',
		rejected: 'Elutasított'
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

	function formatTrafficTarget(value: number) {
		return value > 0 ? `${value.toLocaleString('hu-HU')} kattintás / időszak` : 'Nincs célérték';
	}

	function getPartnerStatusOptions() {
		return data.selectedSource.approvalStatus === 'approved' ? PARTNER_STATUS_VALUES : ['none'];
	}

	function getExchangeStatusOptions() {
		return data.selectedSource.approvalStatus === 'approved'
			? EXCHANGE_STATUS_VALUES
			: ['none', 'eligible'];
	}

	function selectedBoostTargets() {
		return new Set((data.selectedSource.boostRouteTargets ?? '').split(',').filter(Boolean));
	}
</script>

<svelte:head>
	<title>{data.selectedSource.name} - forrás - hirek.hu</title>
</svelte:head>

{#if form}
	<div class="result-toast">
		<div class="result-toast-header">
			<span class="toast-indicator"></span>
			<strong>Szerver válasza</strong>
		</div>
		<pre class="admin-result">{JSON.stringify(form, null, 2)}</pre>
	</div>
{/if}

<section class="panel source-detail-hero">
	<div class="hero-header-row">
		<div class="hero-left">
			<a class="back-link" href="/admin/sites/">&larr; Vissza a forrásokhoz</a>
			<div class="hero-title-wrap">
				<p class="section-kicker-brand">Központi Adminisztráció</p>
				<h1 class="hero-title">{data.selectedSource.name}</h1>
				<p class="hero-subtitle">{data.selectedSource.domain} · <span class="slug-badge">{data.selectedSource.slug}</span></p>
			</div>
		</div>
		<div class="hero-actions">
			<a class="stream-button" href={`/${data.selectedSource.slug}/`} target="_blank" rel="noopener">Publikus Stream &rarr;</a>
		</div>
	</div>
</section>

<!-- SECTION 1: Core & Rendszerintegráció -->
<div class="admin-section-container">
	<h2 class="admin-section-heading">Alapadatok és Rendszerintegráció</h2>
	<div class="admin-grid source-detail-grid">
		<form class="panel admin-form-card core-info-card" method="POST" action="?/updateSourceDetails">
			<InternalSectionHeader
				title="Forrás alapadatok"
				subtitle="A forrás név, slug és domain értékeinek módosítása."
			/>
			
			<div class="form-vertical-fields">
				<label class="premium-input-label">
					<span>Név</span>
					<input name="name" value={data.selectedSource.name} required placeholder="Példa Híroldal" />
				</label>
				<label class="premium-input-label">
					<span>Slug</span>
					<input name="slug" value={data.selectedSource.slug} required placeholder="pelda-hiroidal" />
				</label>
				<label class="premium-input-label">
					<span>Domain</span>
					<input name="domain" value={data.selectedSource.domain} required placeholder="peldahiroldal.hu" />
				</label>
				
				<button class="save-button" type="submit">Adatok mentése</button>
			</div>
		</form>

		<section class="panel source-health-panel">
			<div class="health-header-row">
				<InternalSectionHeader
					kicker="Státusz és egészség"
					title="Rendszerintegráció"
				/>
				<span class="last-fetched-indicator">Fetch: {formatOptionalDate(data.selectedSource.lastFetchedAt)}</span>
			</div>

			<div class="badges-row">
				<StatusBadge
					label={approvalStatusLabels[data.selectedSource.approvalStatus] ?? data.selectedSource.approvalStatus}
					tone={data.selectedSource.approvalStatus === 'approved' ? 'success' : data.selectedSource.approvalStatus === 'rejected' ? 'danger' : 'warning'}
				/>
				<StatusBadge
					label={sourceStatusLabels[data.selectedSource.status] ?? data.selectedSource.status}
					tone={data.selectedSource.status === 'ingesting' ? 'success' : data.selectedSource.status === 'blocked' ? 'danger' : data.selectedSource.status === 'pending' ? 'warning' : 'muted'}
				/>
				<StatusBadge
					label={`${data.selectedSource.activeFeedCount}/${data.selectedSource.totalFeedCount} aktív feed`}
					tone="accent"
				/>
			</div>

			{#if data.selectedSource.statusNote || data.selectedSource.lastError}
				<div class="status-note-box" class:has-error={Boolean(data.selectedSource.lastError)}>
					<strong>Státusz megjegyzés / Hibaüzenet:</strong>
					<p>{data.selectedSource.statusNote ?? data.selectedSource.lastError}</p>
				</div>
			{/if}

			<form class="source-health-form" method="POST" action="?/updateSourceStatus">
				<div class="health-form-grid">
					<label class="premium-input-label">
						<span>Állapot</span>
						<select name="status" required>
							{#each data.sourceStatuses as status (status)}
								<option value={status} selected={data.selectedSource.status === status}>
									{sourceStatusLabels[status] ?? status}
								</option>
							{/each}
						</select>
					</label>
					<label class="premium-input-label">
						<span>Megjegyzés</span>
						<input name="statusNote" value={data.selectedSource.statusNote ?? ''} placeholder="Miért blokkolt, mi hiányzik, mi a következő lépés?" />
					</label>
				</div>
				<button class="save-button secondary-save" type="submit">Állapot mentése</button>
			</form>

			<div class="approval-actions-row">
				<form method="POST" action="?/approveSource">
					<button
						type="submit"
						class="approve-btn"
						disabled={data.selectedSource.approvalStatus === 'approved'}
					>
						Forrás Jóváhagyása
					</button>
				</form>
				<form method="POST" action="?/rejectSource">
					<button
						type="submit"
						class="reject-btn"
						disabled={data.selectedSource.approvalStatus === 'rejected'}
					>
						Forrás Elutasítása
					</button>
				</form>
			</div>
			{#if !data.selectedSource.canConfigure}
				<p class="config-warning-text">
					⚠️ A feed- és URL-szabály kezelés csak jóváhagyott forrásoknál érhető el.
				</p>
			{/if}
		</section>
	</div>
</div>

<!-- SECTION 2: Monetizáció & Kereskedelmi Beállítások -->
<div class="admin-section-container">
	<h2 class="admin-section-heading">Kereskedelmi Csomagok és Monetizáció</h2>
	<form class="panel admin-form-card commercial-settings-panel" method="POST" action="?/updateSourceCommercial">
		<InternalSectionHeader
			kicker="Partner monetizáció"
			title="Kereskedelmi és Csomagbeállítások"
			subtitle="A partner csomagtípusának, értékesítési státuszának és forgalmi vállalásának központi beállítása."
		/>

		<div class="badges-row header-badges">
			<StatusBadge label={partnerPackageLabels[data.selectedSource.partnerPackage] ?? data.selectedSource.partnerPackage} tone="accent" />
			<StatusBadge
				label={partnerStatusLabels[data.selectedSource.partnerStatus] ?? data.selectedSource.partnerStatus}
				tone={data.selectedSource.partnerStatus === 'active' ? 'success' : data.selectedSource.partnerStatus === 'paused' ? 'warning' : 'muted'}
			/>
			<StatusBadge
				label={exchangeStatusLabels[data.selectedSource.exchangeStatus] ?? data.selectedSource.exchangeStatus}
				tone={data.selectedSource.exchangeStatus === 'active' ? 'success' : data.selectedSource.exchangeStatus === 'eligible' ? 'accent' : data.selectedSource.exchangeStatus === 'paused' ? 'warning' : 'muted'}
			/>
		</div>

		<div class="commercial-info-box-grid">
			<div class="info-card">
				<strong>Csomagígéret</strong>
				<p>{partnerPackageDescriptions[data.selectedSource.partnerPackage] ?? 'Nincs külön csomagleírás.'}</p>
			</div>
			<div class="info-card">
				<strong>Csereprogram</strong>
				<p>{exchangeStatusDescriptions[data.selectedSource.exchangeStatus] ?? 'Nincs külön csereprogram leírás.'}</p>
			</div>
		</div>

		<div class="form-vertical-fields">
			<div class="commercial-inputs-grid">
				<label class="premium-input-label">
					<span>Partner csomag</span>
					<select name="partnerPackage" required>
						{#each PARTNER_PACKAGE_VALUES as option (option)}
							<option value={option} selected={data.selectedSource.partnerPackage === option}>
								{partnerPackageLabels[option]}
							</option>
						{/each}
					</select>
				</label>
				<label class="premium-input-label">
					<span>Kereskedelmi státusz</span>
					<select name="partnerStatus" required>
						{#each getPartnerStatusOptions() as option (option)}
							<option value={option} selected={data.selectedSource.partnerStatus === option}>
								{partnerStatusLabels[option]}
							</option>
						{/each}
					</select>
				</label>
				<label class="premium-input-label">
					<span>Csereprogram</span>
					<select name="exchangeStatus" required>
						{#each getExchangeStatusOptions() as option (option)}
							<option value={option} selected={data.selectedSource.exchangeStatus === option}>
								{exchangeStatusLabels[option]}
							</option>
						{/each}
					</select>
				</label>
				<label class="premium-input-label">
					<span>Célforgalom vállalás</span>
					<div class="traffic-target-wrapper">
						<input name="trafficTarget" type="number" min="0" value={data.selectedSource.trafficTarget} />
						<span class="traffic-suffix">kattintás</span>
					</div>
					<small class="traffic-preview">{formatTrafficTarget(data.selectedSource.trafficTarget)}</small>
				</label>
			</div>

			<button class="save-button" type="submit">Kereskedelmi adatok mentése</button>
		</div>

		{#if data.selectedSource.approvalStatus !== 'approved'}
			<p class="config-warning-text">
				⚠️ A kereskedelmi csomag és célforgalom előre konfigurálható, de az aktív partner státusz csak jóváhagyott forrásnál engedélyezett.
			</p>
		{/if}
	</form>
</div>

<!-- SECTION 3: Traffic Acquisition & Wallet (Paid & Csereprogram Boost) -->
<div class="admin-section-container">
	<h2 class="admin-section-heading">Traffic Acquisition & Boost Vezérlőpult</h2>
	<form class="panel admin-form-card acquisition-settings-panel" method="POST" action="?/updateSourceAcquisition">
		<InternalSectionHeader
			kicker="Paid & Csereprogram Boost"
			title="Traffic Acquisition & Wallet paraméterek"
			subtitle="Kezeld a bizalmi pontszámot, a CPC licitet, a napi limitet, a csereprogram krediteket és a felületi route célzást."
		/>

		<!-- Balances and Lifetime Delivery Dashboard -->
		<div class="acquisition-dashboard-grid">
			<div class="dashboard-widget balance-widget wallet-primary">
				<div class="widget-meta">
					<span class="widget-kicker">Wallet egyenleg</span>
					<h3 class="widget-value">{formatMoney(data.selectedSource.walletBalance)}</h3>
				</div>
				<span class="widget-description">Fizetett kiemelésekre (CPC) felhasználható egyenleg</span>
			</div>
			
			<div class="dashboard-widget balance-widget exchange-secondary">
				<div class="widget-meta">
					<span class="widget-kicker">Csereprogram kredit</span>
					<h3 class="widget-value">{formatMoney(data.selectedSource.exchangeCreditBalance)}</h3>
				</div>
				<span class="widget-description">Forgalomcsere programból származó belső keret</span>
			</div>

			<div class="dashboard-widget stats-widget">
				<span class="widget-kicker">Összesített kézbesítési adatok</span>
				<div class="stats-summary-table">
					<div class="stat-row">
						<span>Fizetett kattintás (Billable)</span>
						<strong>{data.selectedSource.lifetimeBillableClicks.toLocaleString('hu-HU')} db</strong>
					</div>
					<div class="stat-row">
						<span>Paid Wallet költés</span>
						<strong>{formatMoney(data.selectedSource.lifetimeWalletSpend)}</strong>
					</div>
					<div class="stat-row">
						<span>Csereprogram költés</span>
						<strong>{formatMoney(data.selectedSource.lifetimeExchangeSpend)}</strong>
					</div>
				</div>
			</div>
		</div>

		<div class="form-vertical-fields">
			<div class="acquisition-fields-grid">
				<!-- Trust Score with Visual Rating Meter -->
				<label class="premium-input-label trust-score-container">
					<div class="trust-label-row">
						<span>Bizalmi pontszám</span>
						<span class="trust-score-badge">{trustScore} / 10</span>
					</div>
					<input name="trustScore" type="number" min="0" max="10" bind:value={trustScore} required />
					<div class="trust-visual-meter">
						<div class="trust-meter-bar" style="width: {trustScore * 10}%" class:low-trust={trustScore < 4} class:mid-trust={trustScore >= 4 && trustScore < 8} class:high-trust={trustScore >= 8}></div>
						<div class="trust-meter-grid-markers">
							{#each Array(11) as _, i}
								<span class="marker" style="left: {i * 10}%"></span>
							{/each}
						</div>
					</div>
				</label>

				<!-- Boost Status -->
				<label class="premium-input-label">
					<span>Boost állapot</span>
					<div class="select-with-indicator">
						<select name="boostStatus" required>
							{#each SOURCE_BOOST_STATUS_VALUES as option (option)}
								<option value={option} selected={data.selectedSource.boostStatus === option}>
									{sourceBoostStatusLabels[option]}
								</option>
							{/each}
						</select>
						<span class="boost-indicator-dot" class:is-active={data.selectedSource.boostStatus === 'active'}></span>
					</div>
				</label>

				<!-- CPC Licit -->
				<label class="premium-input-label">
					<span>Max CPC licit</span>
					<div class="input-with-suffix">
						<input name="maxCpc" type="number" min="0" value={data.selectedSource.maxCpc} placeholder="0" />
						<span class="suffix">Ft</span>
					</div>
				</label>

				<!-- Daily Spend Limit -->
				<label class="premium-input-label">
					<span>Napi költési limit</span>
					<div class="input-with-suffix">
						<input name="dailySpendCap" type="number" min="0" value={data.selectedSource.dailySpendCap} placeholder="Nincs limit" />
						<span class="suffix">Ft / nap</span>
					</div>
				</label>

				<!-- Csereprogram Kredit Editor -->
				<label class="premium-input-label">
					<span>Csereprogram kredit egyenleg</span>
					<div class="input-with-suffix">
						<input name="exchangeCreditBalance" type="number" min="0" value={data.selectedSource.exchangeCreditBalance} />
						<span class="suffix">Ft</span>
					</div>
				</label>
			</div>

			<!-- Route Targeting Checkbox Cards -->
			<fieldset class="route-target-fieldset">
				<legend>Route Célzás és Felületi Kiosztás</legend>
				<p class="fieldset-helper-text">Válaszd ki azokat a hirek.hu felületeket, amelyeken a kiemelt (Boost) forgalom megjelenhet.</p>
				
				<div class="route-cards-grid">
					{#each PUBLIC_SURFACE_VALUES as surface (surface)}
						<label class="route-chip-card">
							<input
								type="checkbox"
								name="boostRouteTargets"
								value={surface}
								checked={selectedBoostTargets().has(surface)}
							/>
							<div class="chip-card-content">
								<div class="chip-card-top">
									<span class="surface-badge">{surface}</span>
									<strong class="chip-card-title">{publicSurfaceLabels[surface]}</strong>
								</div>
								{#if surface === 'home'}
									<p class="chip-card-desc">Főoldali központi stream kiemelések</p>
								{:else if surface === 'top'}
									<p class="chip-card-desc">Legjobb hírek kiemelt toplistái</p>
								{:else if surface === 'category'}
									<p class="chip-card-desc">Tematikus rovatok gyűjtőoldalai</p>
								{:else if surface === 'source'}
									<p class="chip-card-desc">A kiadó saját profiloldala</p>
								{:else if surface === 'source_category'}
									<p class="chip-card-desc">Saját márkás alrovati oldalak</p>
								{:else}
									<p class="chip-card-desc">Aktív forgalomirányítási felület</p>
								{/if}
							</div>
						</label>
					{/each}
				</div>
			</fieldset>

			<button class="save-button action-boost-save" type="submit">Boost beállítások mentése</button>
		</div>
	</form>
</div>

<!-- SECTION 4: Feedek és RSS Csatornák -->
<section class="panel feeds-panel">
	<InternalSectionHeader
		kicker="Hírcsatornák"
		title="RSS / Atom hírcsatornák beállításai"
		subtitle="A forráshoz kapcsolódó feedek. A jóváhagyott forrásból érkező hírcsatornák cikkei automatikusan feldolgozásra kerülnek."
	/>

	<form class="rule-inline-form" method="POST" action="?/addFeed">
		<label class="url-label premium-input-label">
			<span>Feed URL</span>
			<input name="feedUrl" placeholder="https://domain.hu/rss" required />
		</label>
		<label class="category-label premium-input-label">
			<span>Fix rovat (opcionális)</span>
			<select name="categoryId" disabled={!data.selectedSource.canConfigure}>
				<option value="none">Nincs fix rovat (URL kategorizálás dönt)</option>
				{#each data.categories as category (category.id)}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>
		</label>
		<button class="add-button" type="submit" disabled={!data.selectedSource.canConfigure}>
			Feed hozzáadása
		</button>
	</form>

	<div class="feed-editor-list">
		<div class="feed-editor-row feed-editor-head">
			<span>Feed URL</span>
			<span>Állapot</span>
			<span>Fix rovat</span>
			<span>Utolsó lekérés</span>
			<span>Hibaüzenet</span>
			<span></span>
		</div>
		{#if data.selectedFeeds.length === 0}
			<InternalEmptyState
				title="Nincsenek feedek"
				description="Ehhez a forráshoz még nincs rögzített RSS vagy Atom csatorna. Adj hozzá egyet fenti űrlapon."
				tone="warning"
				compact
			/>
		{:else}
			{#each data.selectedFeeds as feed (feed.id)}
				<form class="feed-editor-row" method="POST" action="?/updateFeed">
					<input type="hidden" name="feedId" value={feed.id} />
					<span class="feed-url-cell" title={feed.feedUrl}>{feed.feedUrl}</span>
					
					<select name="status" aria-label="Feed állapot" disabled={!data.selectedSource.canConfigure}>
						{#each data.feedStatuses as status (status)}
							<option value={status} selected={feed.status === status}>
								{feedStatusLabels[status] ?? status}
							</option>
						{/each}
					</select>
					
					<select
						name="categoryId"
						aria-label="Fix rovat"
						disabled={!data.selectedSource.canConfigure}
					>
						<option value="none">Automatikus</option>
						{#each data.categories as category (category.id)}
							<option value={category.id} selected={feed.categoryId === category.id}>
								{category.name}
							</option>
						{/each}
					</select>
					
					<span class="last-fetch-text">{formatOptionalDate(feed.lastFetchedAt)}</span>
					
					<input
						name="lastError"
						value={feed.lastError ?? ''}
						placeholder="Nincs hiba"
						disabled={!data.selectedSource.canConfigure}
					/>
					
					<button class="save-row-btn" type="submit" disabled={!data.selectedSource.canConfigure}>Mentés</button>
				</form>
			{/each}
		{/if}
	</div>
</section>

<!-- SECTION 5: URL Kategorizálás Szabályai -->
<section class="panel rules-detail-panel">
	<InternalSectionHeader
		kicker="Szabályrendszer"
		title="URL-alapú automatikus rovat-hozzárendelés"
		subtitle={`Ha a feed cikkeinek URL címe illeszkedik a mintára, a cikk automatikusan a cél rovatba sorolódik be. Példa: ${data.selectedSource.domain}/sport/*`}
	/>

	<form class="rule-inline-form" method="POST" action="?/addRule">
		<label class="pattern-label premium-input-label">
			<span>URL Minta</span>
			<input name="urlPattern" placeholder={`${data.selectedSource.domain}/rovat/*`} required />
		</label>
		<label class="category-label premium-input-label">
			<span>Cél rovat</span>
			<select name="categoryId" required disabled={!data.selectedSource.canConfigure}>
				{#each data.categories as category (category.id)}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>
		</label>
		<button class="add-button" type="submit" disabled={!data.selectedSource.canConfigure}>
			Szabály hozzáadása
		</button>
	</form>

	<div class="rules-list">
		<div class="rules-row rules-row-head">
			<span>Minta</span>
			<span>Cél rovat</span>
			<span></span>
		</div>
		{#if data.selectedRules.length === 0}
			<InternalEmptyState
				title="Nincsenek URL szabályok"
				description="Nincs megadott szabály ehhez a forráshoz. A cikkek fix rovat nélkül nem kategorizálódnak automatikusan."
				tone="neutral"
				compact
			/>
		{:else}
			{#each data.selectedRules as rule (rule.id)}
				<div class="rules-row">
					<span class="rule-pattern-text">{rule.urlPattern}</span>
					<span class="rule-category-text">{rule.categoryName}</span>
					<form method="POST" action="?/deleteRule">
						<input type="hidden" name="ruleId" value={rule.id} />
						<button class="delete-row-btn" type="submit" disabled={!data.selectedSource.canConfigure}>Törlés</button>
					</form>
				</div>
			{/each}
		{/if}
	</div>
</section>

<style>
	/* Redesigned layout headings */
	.admin-section-container {
		margin-bottom: 2.5rem;
	}
	.admin-section-heading {
		font-family: var(--font-display);
		font-size: 1.125rem;
		font-weight: 800;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 1rem;
		padding-left: 0.25rem;
		border-left: 3px solid var(--primary);
	}

	.result-toast {
		margin-bottom: 1.5rem;
		padding: 1.25rem;
		background: #f8fafc;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		max-height: 15rem;
		overflow: auto;
		box-shadow: var(--shadow-sm);
	}
	.result-toast-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		color: var(--text-muted);
	}
	.toast-indicator {
		width: 8px;
		height: 8px;
		background: var(--success);
		border-radius: 50%;
	}
	.admin-result {
		font-family: monospace;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.source-detail-hero {
		background:
			radial-gradient(circle at top right, rgba(255, 78, 58, 0.08), transparent 45%),
			linear-gradient(135deg, var(--bg-card), rgba(255, 247, 240, 0.6));
		border: 1px solid rgba(255, 78, 58, 0.12);
		padding: 2rem;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		margin-bottom: 2rem;
	}
	.hero-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1.5rem;
	}
	.back-link {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--text-muted);
		text-decoration: none;
		margin-bottom: 0.75rem;
		display: inline-block;
		transition: var(--transition);
	}
	.back-link:hover {
		color: var(--primary);
		transform: translateX(-2px);
	}
	.section-kicker-brand {
		font-size: 0.6875rem;
		font-weight: 850;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--primary);
		margin-bottom: 0.25rem;
	}
	.hero-title {
		font-family: var(--font-display);
		font-size: 2.25rem;
		font-weight: 800;
		line-height: 1.1;
		color: var(--text-main);
		letter-spacing: -0.5px;
	}
	.hero-subtitle {
		font-size: 0.9375rem;
		color: var(--text-muted);
		font-weight: 500;
		margin-top: 0.375rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.slug-badge {
		background: var(--bg-alt);
		padding: 1px 6px;
		border-radius: var(--radius-sm);
		font-family: monospace;
		font-weight: 600;
		font-size: 0.8125rem;
		color: var(--text-main);
	}
	.stream-button {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 700;
		color: white;
		background: linear-gradient(135deg, var(--text-main), hsl(215, 24%, 27%));
		border-radius: var(--radius-md);
		padding: 0.75rem 1.25rem;
		text-decoration: none;
		box-shadow: var(--shadow-sm);
		transition: var(--transition);
	}
	.stream-button:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		background: linear-gradient(135deg, var(--primary), var(--secondary));
	}

	.admin-grid {
		display: grid;
		grid-template-columns: 1fr 1.2fr;
		gap: 1.5rem;
	}
	@media (max-width: 1024px) {
		.admin-grid {
			grid-template-columns: 1fr;
		}
	}

	.admin-form-card {
		display: grid;
		gap: 1.5rem;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1.75rem;
		box-shadow: var(--shadow-sm);
	}
	
	.core-info-card {
		background: linear-gradient(180deg, var(--bg-card) 0%, rgba(255,255,255,0.7) 100%);
	}
	
	.form-vertical-fields {
		display: grid;
		gap: 1.25rem;
	}

	.source-health-panel {
		display: grid;
		gap: 1.25rem;
		align-content: start;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1.75rem;
		box-shadow: var(--shadow-sm);
	}
	.health-header-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.last-fetched-indicator {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 700;
		background: var(--bg-alt);
		padding: 0.25rem 0.625rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}
	.badges-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.header-badges {
		margin-bottom: 0.5rem;
	}
	.status-note-box {
		padding: 1rem;
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-left: 4px solid var(--text-muted);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
		line-height: 1.5;
	}
	.status-note-box.has-error {
		background: hsl(0, 100%, 98.5%);
		border-color: rgba(220, 38, 38, 0.12);
		border-left-color: #df1c1c;
		color: #b42318;
	}
	.status-note-box strong {
		display: block;
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.375rem;
		color: var(--text-muted);
	}
	.status-note-box p {
		margin: 0;
	}

	.source-health-form {
		display: grid;
		gap: 1rem;
		background: var(--bg-base);
		padding: 1.25rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}
	.health-form-grid {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 1rem;
	}
	@media (max-width: 640px) {
		.health-form-grid {
			grid-template-columns: 1fr;
		}
	}

	.approval-actions-row {
		display: flex;
		gap: 1rem;
	}
	.approval-actions-row form {
		flex: 1;
	}
	.approve-btn, .reject-btn {
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: 750;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		transition: var(--transition);
		width: 100%;
		border: 1px solid transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.approve-btn {
		background: hsl(145, 63%, 94%);
		color: var(--success);
		border-color: rgba(20, 180, 100, 0.2);
	}
	.approve-btn:hover:not(:disabled) {
		background: var(--success);
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(20, 180, 100, 0.2);
	}
	.reject-btn {
		background: #fef2f2;
		color: #b42318;
		border-color: rgba(220, 38, 38, 0.15);
	}
	.reject-btn:hover:not(:disabled) {
		background: #b42318;
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
	}
	.approve-btn:disabled, .reject-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.config-warning-text {
		font-size: 0.78125rem;
		font-weight: 600;
		color: #92400e;
		background: #fffbeb;
		border: 1px solid #fde68a;
		padding: 0.625rem 1rem;
		border-radius: var(--radius-md);
		margin: 0;
	}

	/* Premium inputs styling */
	.premium-input-label {
		display: grid;
		gap: 0.375rem;
		position: relative;
	}
	.premium-input-label span {
		font-size: 0.6875rem;
		font-weight: 850;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		display: block;
	}
	input, select {
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: var(--text-main);
		background: var(--bg-alt);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0.625rem 0.875rem;
		outline: none;
		transition: var(--transition);
		width: 100%;
	}
	input:focus, select:focus {
		background: var(--bg-card);
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(255, 78, 58, 0.12);
	}
	input:hover:not(:focus), select:hover:not(:focus) {
		border-color: var(--text-light);
	}
	input:disabled, select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Select custom indicator wrapper */
	.select-with-indicator {
		position: relative;
		display: flex;
		align-items: center;
	}
	.boost-indicator-dot {
		position: absolute;
		right: 1.75rem;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--text-light);
		transition: var(--transition);
	}
	.boost-indicator-dot.is-active {
		background: var(--success);
		box-shadow: 0 0 8px var(--success);
	}

	/* Input with currency suffix styling */
	.input-with-suffix, .traffic-target-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}
	.input-with-suffix input, .traffic-target-wrapper input {
		padding-right: 4.5rem;
	}
	.input-with-suffix .suffix, .traffic-target-wrapper .traffic-suffix {
		position: absolute;
		right: 1rem;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
		pointer-events: none;
		background: var(--bg-alt);
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}

	.save-button {
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: 800;
		color: white;
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		border-radius: var(--radius-md);
		padding: 0.75rem 1.5rem;
		box-shadow: 0 4px 10px rgba(255, 78, 58, 0.2);
		transition: var(--transition);
		width: fit-content;
		border: none;
		cursor: pointer;
	}
	.save-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(255, 78, 58, 0.35);
	}
	.save-button:active {
		transform: translateY(0);
	}
	
	.secondary-save {
		background: linear-gradient(135deg, var(--text-main), hsl(215, 24%, 27%));
		box-shadow: var(--shadow-sm);
	}
	.secondary-save:hover {
		background: var(--text-main);
		box-shadow: var(--shadow-md);
	}

	/* Commercial features styling */
	.commercial-settings-panel {
		background: linear-gradient(180deg, var(--bg-card) 0%, rgba(255, 255, 255, 0.9) 100%);
		border: 1px solid rgba(255, 78, 58, 0.08);
	}
	.commercial-info-box-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
		margin-bottom: 0.5rem;
	}
	@media (max-width: 640px) {
		.commercial-info-box-grid {
			grid-template-columns: 1fr;
		}
	}
	.commercial-info-box-grid .info-card {
		background: var(--bg-base);
		padding: 1rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
		line-height: 1.5;
	}
	.commercial-info-box-grid .info-card strong {
		display: block;
		font-size: 0.75rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--primary);
		margin-bottom: 0.375rem;
	}
	.commercial-info-box-grid .info-card p {
		margin: 0;
		color: var(--text-main);
		font-weight: 500;
	}
	.commercial-inputs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: 1.25rem;
		margin-bottom: 0.5rem;
	}
	.traffic-preview {
		color: var(--primary);
		font-weight: 700;
		margin-top: 0.25rem;
		display: block;
	}

	/* Traffic Acquisition Dashboard styling */
	.acquisition-settings-panel {
		background:
			radial-gradient(circle at bottom left, rgba(255, 78, 58, 0.05), transparent 45%),
			linear-gradient(180deg, var(--bg-card) 0%, rgba(255, 255, 255, 0.95) 100%);
		border: 1px solid rgba(255, 78, 58, 0.16);
		position: relative;
	}
	.acquisition-dashboard-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1.2fr;
		gap: 1.25rem;
		margin-bottom: 1.5rem;
	}
	@media (max-width: 1024px) {
		.acquisition-dashboard-grid {
			grid-template-columns: 1fr;
		}
	}
	.dashboard-widget {
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 1rem;
		transition: var(--transition);
	}
	.dashboard-widget:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
	.wallet-primary {
		background: linear-gradient(135deg, rgba(255, 78, 58, 0.04), rgba(255, 78, 58, 0.08));
		border-color: rgba(255, 78, 58, 0.2);
	}
	.wallet-primary .widget-value {
		color: var(--primary);
	}
	.exchange-secondary {
		background: linear-gradient(135deg, rgba(255, 185, 120, 0.08), rgba(255, 185, 120, 0.15));
		border-color: rgba(255, 185, 120, 0.35);
	}
	.exchange-secondary .widget-value {
		color: hsl(30, 95%, 45%);
	}
	.widget-kicker {
		font-size: 0.6875rem;
		font-weight: 850;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		display: block;
		margin-bottom: 0.25rem;
	}
	.widget-value {
		font-family: var(--font-display);
		font-size: 1.75rem;
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.5px;
	}
	.widget-description {
		font-size: 0.75rem;
		color: var(--text-muted);
		line-height: 1.4;
		font-weight: 500;
	}
	.stats-widget {
		background: linear-gradient(180deg, var(--bg-base) 0%, rgba(240, 240, 240, 0.5) 100%);
		gap: 0.5rem;
	}
	.stats-summary-table {
		display: grid;
		gap: 0.375rem;
		font-size: 0.78125rem;
		width: 100%;
	}
	.stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.375rem 0;
		border-bottom: 1px solid var(--border);
	}
	.stat-row:last-child {
		border: none;
	}
	.stat-row span {
		color: var(--text-muted);
		font-weight: 500;
	}
	.stat-row strong {
		color: var(--text-main);
		font-weight: 700;
	}

	.acquisition-fields-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
		gap: 1.25rem;
		margin-bottom: 0.5rem;
	}
	@media (max-width: 640px) {
		.acquisition-fields-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Trust Score visual meter */
	.trust-score-container {
		grid-column: span 2;
	}
	@media (max-width: 1024px) {
		.trust-score-container {
			grid-column: span 1;
		}
	}
	.trust-label-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.trust-score-badge {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--primary);
		background: var(--primary-light);
		padding: 1px 6px;
		border-radius: var(--radius-sm);
	}
	.trust-visual-meter {
		height: 8px;
		background: var(--bg-alt);
		border-radius: var(--radius-pill);
		position: relative;
		overflow: hidden;
		margin-top: 0.25rem;
		border: 1px solid var(--border);
	}
	.trust-meter-bar {
		height: 100%;
		border-radius: var(--radius-pill);
		transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s;
	}
	.low-trust {
		background: linear-gradient(90deg, #dc2626, #ef4444);
		box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
	}
	.mid-trust {
		background: linear-gradient(90deg, var(--secondary), #f59e0b);
		box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);
	}
	.high-trust {
		background: linear-gradient(90deg, var(--success), #10b981);
		box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
	}
	.trust-meter-grid-markers {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: space-between;
		pointer-events: none;
	}
	.trust-meter-grid-markers .marker {
		width: 1px;
		height: 100%;
		background: rgba(0, 0, 0, 0.08);
	}

	/* Route Targeting Checkbox Cards */
	.route-target-fieldset {
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		margin-top: 0.75rem;
		margin-bottom: 0.75rem;
		background: rgba(250, 250, 250, 0.3);
	}
	.route-target-fieldset legend {
		font-family: var(--font-display);
		font-size: 0.875rem;
		font-weight: 800;
		color: var(--text-main);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0 0.5rem;
	}
	.fieldset-helper-text {
		font-size: 0.78125rem;
		color: var(--text-muted);
		margin-bottom: 1rem;
		margin-top: -0.25rem;
	}
	.route-cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13.5rem, 1fr));
		gap: 0.875rem;
	}
	.route-chip-card {
		position: relative;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-card);
		padding: 1rem;
		cursor: pointer;
		transition: var(--transition);
		display: flex;
		flex-direction: column;
		user-select: none;
	}
	.route-chip-card input {
		position: absolute;
		top: 0.875rem;
		right: 0.875rem;
		width: 16px;
		height: 16px;
		margin: 0;
		accent-color: var(--primary);
		cursor: pointer;
	}
	.chip-card-content {
		display: grid;
		gap: 0.375rem;
	}
	.chip-card-top {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.surface-badge {
		font-family: monospace;
		font-size: 0.625rem;
		font-weight: 800;
		color: var(--text-light);
		text-transform: uppercase;
		background: var(--bg-alt);
		padding: 1px 4px;
		border-radius: var(--radius-sm);
		width: fit-content;
	}
	.chip-card-title {
		font-size: 0.8125rem;
		font-weight: 750;
		color: var(--text-main);
	}
	.chip-card-desc {
		font-size: 0.6875rem;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.35;
	}
	
	/* Pure CSS active card handling using :has */
	.route-chip-card:has(input:checked) {
		border-color: var(--primary);
		background: rgba(255, 78, 58, 0.02);
		box-shadow: 0 0 0 1px var(--primary), var(--shadow-sm);
	}
	.route-chip-card:has(input:checked) .surface-badge {
		background: var(--primary-light);
		color: var(--primary);
	}
	.route-chip-card:has(input:checked) .chip-card-title {
		color: var(--primary-hover);
	}
	.route-chip-card:hover:not(:has(input:checked)) {
		border-color: var(--text-light);
		transform: translateY(-1px);
	}

	.action-boost-save {
		margin-top: 0.5rem;
		min-width: 15rem;
	}

	/* Inline Form layout */
	.rule-inline-form {
		display: flex;
		align-items: flex-end;
		gap: 0.875rem;
		flex-wrap: wrap;
		background: var(--bg-base);
		padding: 1.25rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		margin-top: 1.25rem;
		margin-bottom: 1.25rem;
	}
	.url-label, .pattern-label {
		flex: 2;
		min-width: 15rem;
	}
	.category-label {
		flex: 1;
		min-width: 12rem;
	}
	.add-button {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 700;
		color: white;
		background: var(--text-main);
		border-radius: var(--radius-md);
		padding: 0.625rem 1.25rem;
		transition: var(--transition);
		height: 2.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.add-button:hover:not(:disabled) {
		background: hsl(215, 24%, 27%);
		transform: translateY(-1px);
	}
	.add-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Feeds panel */
	.feeds-panel {
		margin-bottom: 2rem;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		background: var(--bg-card);
		border: 1px solid var(--border);
		padding: 1.75rem;
	}
	.feed-editor-list {
		display: grid;
		gap: 0.5rem;
	}
	.feed-editor-row {
		display: grid;
		grid-template-columns: 2.2fr 1.1fr 1.3fr 1.2fr 2.2fr 85px;
		gap: 0.875rem;
		align-items: center;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-card);
		transition: var(--transition);
	}
	.feed-editor-row:hover:not(.feed-editor-head) {
		border-color: var(--text-light);
	}
	@media (max-width: 1024px) {
		.feed-editor-row {
			grid-template-columns: 2fr 1fr 1.25fr 1fr;
			gap: 0.5rem;
		}
		.last-fetch-text, .feed-editor-head span:nth-child(4), .feed-editor-row input {
			display: none;
		}
	}
	@media (max-width: 640px) {
		.feed-editor-row {
			grid-template-columns: 1fr;
			gap: 0.5rem;
			padding: 1rem;
		}
		.feed-editor-head {
			display: none !important;
		}
	}

	.feed-editor-head {
		font-size: 0.6875rem;
		font-weight: 850;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: none;
		background: transparent;
		padding-bottom: 0.25rem;
		padding-top: 0.25rem;
	}
	.feed-url-cell {
		font-size: 0.8125rem;
		color: var(--text-main);
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.last-fetch-text {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 500;
	}
	.feed-editor-row select, .feed-editor-row input {
		padding: 0.45rem 0.625rem;
		font-size: 0.8125rem;
	}
	.save-row-btn {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 750;
		color: var(--text-main);
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0.45rem;
		transition: var(--transition);
		cursor: pointer;
		text-align: center;
	}
	.save-row-btn:hover:not(:disabled) {
		background: var(--primary-light);
		color: var(--primary);
		border-color: var(--primary);
	}

	/* Rules panel */
	.rules-detail-panel {
		margin-bottom: 2rem;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		background: var(--bg-card);
		border: 1px solid var(--border);
		padding: 1.75rem;
	}
	.rules-list {
		display: grid;
		gap: 0.5rem;
	}
	.rules-row {
		display: grid;
		grid-template-columns: 3.5fr 2.5fr 85px;
		gap: 1rem;
		align-items: center;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-card);
		transition: var(--transition);
	}
	.rules-row:hover:not(.rules-row-head) {
		border-color: var(--text-light);
	}
	.rules-row-head {
		font-size: 0.6875rem;
		font-weight: 850;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: none;
		background: transparent;
		padding-bottom: 0.25rem;
	}
	.rule-pattern-text {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-main);
		font-family: monospace;
		background: var(--bg-alt);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		width: fit-content;
	}
	.rule-category-text {
		font-size: 0.8125rem;
		font-weight: 750;
		color: var(--primary);
	}
	.delete-row-btn {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 750;
		color: #b42318;
		background: #fef2f2;
		border: 1px solid rgba(220, 38, 38, 0.15);
		border-radius: var(--radius-md);
		padding: 0.45rem;
		transition: var(--transition);
		width: 100%;
		cursor: pointer;
		text-align: center;
	}
	.delete-row-btn:hover:not(:disabled) {
		background: #b42318;
		color: white;
	}
</style>

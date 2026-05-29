<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import InternalSectionHeader from '$lib/components/internal/InternalSectionHeader.svelte';
	import InternalMetricCard from '$lib/components/internal/InternalMetricCard.svelte';
	import StatusBadge from '$lib/components/internal/StatusBadge.svelte';
	import InternalEmptyState from '$lib/components/internal/InternalEmptyState.svelte';

	let { data }: PageProps = $props();

	const isAdminSourcePicker = $derived(data.isAdmin && !data.partnerSourceId);
	const approvalStatusLabels: Record<string, string> = {
		pending: 'Jóváhagyásra vár',
		approved: 'Jóváhagyott',
		rejected: 'Elutasított'
	};
	const partnerPackageLabels: Record<string, string> = {
		free: 'Ingyenes csomag',
		partner: 'Partner csomag',
		growth: 'Növekedési csomag'
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
						<span><strong>{source.clickCount}</strong> kattintás</span>
						<span><strong>{source.articleCount}</strong> cikk</span>
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
			<InternalMetricCard label="Működési státusz" value={data.sourceState.status} tone="neutral" />
		</div>
		
		<p class="config-warning">
			ℹ️ {data.sourceState.statusNote ?? 'A forrás jelenleg még ellenőrzés alatt áll. Az analitika és a feed beállítások a jóváhagyás után válnak elérhetővé.'}
		</p>
	</section>
{:else}
	<section class="panel totals-panel">
		<InternalSectionHeader title="Összesített adatok" subtitle="Az aktuális időszakra vetített látogatottsági és tartalom-aggregációk." />
		
		<div class="partner-totals-grid">
			{#each data.sourceStats as source (source.sourceId)}
				<InternalMetricCard label="Cikkszám" value={source.articleCount} tone="neutral" />
				<InternalMetricCard label="Emberi kattintás" value={source.clickCount} tone="success" />
				<InternalMetricCard label="Egyedi látogatók" value={source.uniqueClickCount} tone="accent" />
				<InternalMetricCard label="Robot / Nyers" value={`${source.botClickCount} / ${source.rawClickCount}`} tone="warning" />
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
							<strong>{day.clickCount}</strong>
							<small>{day.uniqueClickCount} egyedi</small>
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
							<strong>{category.clickCount}</strong>
							<small>{category.uniqueClickCount} egyedi</small>
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
							<strong>{source.clickCount}</strong>
							<small>{source.uniqueClickCount} egyedi</small>
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
								<span class="stats-label"><strong>{article.clickCount}</strong> kattintás (<strong>{article.uniqueClickCount}</strong> egyedi)</span>
								<span>·</span>
								<span class="bot-label">Robot: {article.botClickCount} / {article.rawClickCount}</span>
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
							<span class="click-type" class:is-bot={click.isBot} class:is-unique={click.isUnique && !click.isBot}>
								{click.isBot ? (click.botName ?? 'robot') : click.isUnique ? 'egyedi látogató' : 'visszatérő látogató'}
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
		width: 4rem;
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
	}
	.rules-list-row {
		grid-template-columns: 3fr 2fr 80px;
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
	
	.feed-info-cell {
		display: grid;
		gap: 0.125rem;
	}
	.feed-url-text {
		font-size: 0.75rem;
		color: var(--text-light);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 15rem;
	}
	.feed-date-cell {
		font-size: 0.75rem;
		color: var(--text-muted);
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
		font-weight: 550;
	}

	.rule-pattern {
		font-family: monospace;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-main);
	}
	.rule-category {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--primary);
	}
	.delete-form {
		width: 100%;
	}
	.delete-btn {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 700;
		color: #b42318;
		background: #fef2f2;
		border: 1px solid rgba(220, 38, 38, 0.15);
		border-radius: var(--radius-md);
		padding: 0.375rem;
		transition: var(--transition);
		width: 100%;
	}
	.delete-btn:hover {
		background: #b42318;
		color: white;
	}

	/* Form layouts */
	.admin-form-card {
		display: grid;
		gap: 1rem;
		align-content: start;
	}
	.form-fields {
		display: grid;
		gap: 0.875rem;
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
		font-weight: 700;
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
	.bot-label, .date-label {
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
	}
	.override-save-btn {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-main);
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0.375rem 0.625rem;
		transition: var(--transition);
		cursor: pointer;
	}
	.override-save-btn:hover {
		background: var(--primary-light);
		color: var(--primary);
		border-color: var(--primary);
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
	.click-type.is-bot {
		color: #df1c1c;
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
	}
</style>

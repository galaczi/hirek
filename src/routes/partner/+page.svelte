<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const scopedPartnerQuery = $derived(
		data.isAdmin && data.partnerSourceId ? `sourceId=${data.partnerSourceId}` : ''
	);
	const csvExportHref = $derived(
		scopedPartnerQuery ? `/partner/clicks.csv?${scopedPartnerQuery}` : '/partner/clicks.csv'
	);
	const clicksOverTimeMax = $derived(
		Math.max(1, ...data.clicksOverTime.map((item) => item.clickCount))
	);
	const topCategoriesMax = $derived(
		Math.max(1, ...data.topCategories.map((item) => item.clickCount))
	);
	const trafficSourcesMax = $derived(
		Math.max(1, ...data.trafficSources.map((item) => item.clickCount))
	);

	function actionUrl(action: string) {
		return scopedPartnerQuery ? `?/${action}&${scopedPartnerQuery}` : `?/${action}`;
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

<section class="panel">
	<div class="admin-actions">
		<a class="load-more-btn" href={csvExportHref}>CSV export</a>
	</div>
</section>

<section class="panel">
	<h2 class="panel-title">Források</h2>
	<div class="admin-table">
		<div class="admin-row admin-row-head">
			<span>Forrás</span><span>Domain</span><span>Cikkek</span><span>Emberi kattintás</span><span>Egyedi</span><span>Bot/nyers</span>
		</div>
		{#each data.sourceStats as source (source.sourceId)}
			<div class="admin-row">
				<span>{source.sourceName}</span>
				<span>{source.sourceDomain}</span>
				<span>{source.articleCount}</span>
				<span>{source.clickCount}</span>
				<span>{source.uniqueClickCount}</span>
				<span>{source.botClickCount}/{source.rawClickCount}</span>
			</div>
		{/each}
	</div>
</section>

<section class="partner-analytics-grid">
	<section class="panel">
		<div class="panel-heading-row">
			<div>
				<p class="section-kicker">Kattintások</p>
				<h2 class="panel-title">Elmúlt 14 nap</h2>
			</div>
		</div>
		<div class="partner-bar-list">
			{#each data.clicksOverTime as day (day.day)}
				<div class="partner-bar-row">
					<span class="partner-bar-label">{day.label}</span>
					<div class="partner-bar-track" aria-label={`${day.clickCount} kattintás`}>
						<span class="partner-bar-fill" style={`width: ${barWidth(day.clickCount, clicksOverTimeMax)}`}></span>
					</div>
					<strong>{day.clickCount}</strong>
					<small>{day.uniqueClickCount} egyedi</small>
				</div>
			{/each}
		</div>
	</section>

	<section class="panel">
		<div class="panel-heading-row">
			<div>
				<p class="section-kicker">Rovatok</p>
				<h2 class="panel-title">Top kategóriák</h2>
			</div>
		</div>
		<div class="partner-bar-list">
			{#each data.topCategories as category (category.slug)}
				<div class="partner-bar-row">
					<span class="partner-bar-label">{category.name}</span>
					<div class="partner-bar-track" aria-label={`${category.clickCount} kattintás`}>
						<span class="partner-bar-fill" style={`width: ${barWidth(category.clickCount, topCategoriesMax)}`}></span>
					</div>
					<strong>{category.clickCount}</strong>
					<small>{category.uniqueClickCount} egyedi</small>
				</div>
			{:else}
				<div class="empty-state compact-empty">
					<strong>Nincs még kategória adat.</strong>
					<span>A kattintások után itt jelennek meg a legjobb rovatok.</span>
				</div>
			{/each}
		</div>
	</section>

	<section class="panel">
		<div class="panel-heading-row">
			<div>
				<p class="section-kicker">Forgalmi útvonal</p>
				<h2 class="panel-title">Belső források</h2>
			</div>
		</div>
		<div class="partner-bar-list">
			{#each data.trafficSources as source (source.label)}
				<div class="partner-bar-row">
					<span class="partner-bar-label">{source.label}</span>
					<div class="partner-bar-track" aria-label={`${source.clickCount} kattintás`}>
						<span class="partner-bar-fill" style={`width: ${barWidth(source.clickCount, trafficSourcesMax)}`}></span>
					</div>
					<strong>{source.clickCount}</strong>
					<small>{source.uniqueClickCount} egyedi</small>
				</div>
			{:else}
				<div class="empty-state compact-empty">
					<strong>Nincs még forgalmi adat.</strong>
					<span>A belső oldalak kattintásai itt fognak látszani.</span>
				</div>
			{/each}
		</div>
	</section>
</section>

{#if data.partnerSourceId}
	<section class="admin-grid">
		<section class="panel">
			<h2 class="panel-title">Hírcsatornák állapota</h2>
			<div class="admin-table">
				<div class="admin-row admin-row-head">
					<span>Feed</span><span>Állapot</span><span>Utolsó frissítés</span><span>Hiba</span>
				</div>
				{#each data.feedHealth as feed (feed.feedId)}
					<div class="admin-row">
						<span>
							<strong>{feed.sourceName}</strong><br />
							<small>{feed.feedUrl}</small>
						</span>
						<span>{feedStatusLabel(feed.status)}</span>
						<span>{formatOptionalDate(feed.lastFetchedAt)}</span>
						<span>{feed.lastError ?? '-'}</span>
					</div>
				{/each}
			</div>
		</section>

		{#if data.sourceSettings}
			<form class="panel admin-form" method="POST" action={actionUrl('updateUtmSettings')}>
				<h2 class="panel-title">UTM paraméterek</h2>
				<p class="form-hint">{data.sourceSettings.sourceName} kimenő linkjeihez használt követőkódok.</p>
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
				<button class="load-more-btn" type="submit">Beállítások mentése</button>
			</form>
		{/if}
	</section>

	<section class="admin-grid">
		<form class="panel admin-form" method="POST" action={actionUrl('addUrlRule')}>
			<h2 class="panel-title">URL kategóriaszabályok</h2>
			<input name="urlPattern" placeholder="portfolio.hu/global/*" required />
			<select name="categorySlug" required>
				{#each data.categories as category (category.slug)}
					<option value={category.slug}>{category.name}</option>
				{/each}
			</select>
			<button class="load-more-btn" type="submit">Szabály mentése</button>
		</form>

		<section class="panel">
			<h2 class="panel-title">Aktuális szabályok</h2>
			<div class="admin-table">
				<div class="admin-row admin-row-head"><span>Minta</span><span>Kategória</span><span></span></div>
				{#each data.sourceRules as rule (rule.id)}
					<div class="admin-row">
						<span>{rule.urlPattern}</span>
						<span>{rule.categoryName}</span>
						<form method="POST" action={actionUrl('deleteUrlRule')}>
							<input type="hidden" name="ruleId" value={rule.id} />
							<button type="submit">Törlés</button>
						</form>
					</div>
				{/each}
			</div>
		</section>
	</section>
{/if}

<section class="admin-grid">
	<div class="panel">
		<h2 class="panel-title">Top cikkek</h2>
		<div class="top-news-list">
			{#each data.topArticles as article (article.id)}
				<div class="top-news-item">
					<div class="top-content">
						<a class="top-title" href={`/go/${article.id}`} target="_blank" rel="noopener">{article.title}</a>
						<div class="top-meta">
							<span>{article.sourceName}</span>
							<span>{article.clickCount} emberi kattintás</span>
							<span>{article.uniqueClickCount} egyedi</span>
							<span>{formatDate(article.publishedAt)}</span>
						</div>
						<form class="inline-form" method="POST" action={actionUrl('overrideCategory')}>
							<input type="hidden" name="articleId" value={article.id} />
							<select name="categorySlug" aria-label="Kategória felülírása">
								{#each data.categories as category (category.slug)}
									<option value={category.slug}>{category.name}</option>
								{/each}
							</select>
							<button type="submit">Mentés</button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="panel">
		<h2 class="panel-title">Legutóbbi kattintások</h2>
		<div class="top-news-list">
			{#each data.recentClicks as click (click.id)}
				<div class="top-news-item">
					<div class="top-content">
						<div class="top-title">{click.articleTitle}</div>
						<div class="top-meta">
							<span>{click.sourceName}</span>
							<span>{formatDate(click.createdAt)}</span>
							<span>{click.isBot ? (click.botName ?? 'robot') : click.isUnique ? 'egyedi emberi' : 'ismételt emberi'}</span>
							<span>{click.utmCampaign}</span>
							<span>{click.referrer ?? 'közvetlen'}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

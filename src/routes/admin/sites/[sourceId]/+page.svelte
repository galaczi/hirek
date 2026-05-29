<script lang="ts">
	import type { PageProps } from './$types';
	import StatusBadge from '$lib/components/internal/StatusBadge.svelte';
	import InternalEmptyState from '$lib/components/internal/InternalEmptyState.svelte';
	import InternalSectionHeader from '$lib/components/internal/InternalSectionHeader.svelte';

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
</script>

<svelte:head>
	<title>{data.selectedSource.name} - forrás - hirek.hu</title>
</svelte:head>

{#if form}
	<div class="result-toast">
		<pre class="admin-result">{JSON.stringify(form, null, 2)}</pre>
	</div>
{/if}

<section class="panel source-detail-hero">
	<div class="hero-header-row">
		<div class="hero-left">
			<a class="back-link" href="/admin/sites/">&larr; Vissza a forrásokhoz</a>
			<div class="hero-title-wrap">
				<p class="section-kicker-brand">Forrás adatlap</p>
				<h1 class="hero-title">{data.selectedSource.name}</h1>
				<p class="hero-subtitle">{data.selectedSource.domain} · {data.selectedSource.slug}</p>
			</div>
		</div>
		<div class="hero-actions">
			<a class="stream-button" href={`/${data.selectedSource.slug}/`} target="_blank" rel="noopener">Publikus Stream &rarr;</a>
		</div>
	</div>
</section>

<section class="admin-grid source-detail-grid">
	<form class="panel admin-form-card" method="POST" action="?/updateSourceDetails">
		<InternalSectionHeader
			title="Forrás alapadatok"
			subtitle="A forrás név, slug és domain értékeinek módosítása."
		/>
		
		<div class="form-vertical-fields">
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
			<button class="save-button" type="submit">Állapot mentése</button>
		</form>

		<div class="approval-actions-row">
			<form method="POST" action="?/approveSource">
				<button
					type="submit"
					class="approve-btn"
					disabled={data.selectedSource.approvalStatus === 'approved'}
				>
					Jóváhagyás
				</button>
			</form>
			<form method="POST" action="?/rejectSource">
				<button
					type="submit"
					class="reject-btn"
					disabled={data.selectedSource.approvalStatus === 'rejected'}
				>
					Elutasítás
				</button>
			</form>
		</div>
		{#if !data.selectedSource.canConfigure}
			<p class="config-warning-text">
				⚠️ A feed- és URL-szabály kezelés csak jóváhagyott forrásoknál érhető el.
			</p>
		{/if}
	</section>
</section>

<section class="panel feeds-panel">
	<InternalSectionHeader
		kicker="Feedek"
		title="Hírcsatorna (RSS / Atom) beállítások"
		subtitle="A forráshoz csatolt feedek kezelése. A jóváhagyott forrásból érkező feedek automatikusan feldolgozásra kerülnek."
	/>

	<form class="rule-inline-form" method="POST" action="?/addFeed">
		<label class="url-label">
			<span>Feed URL</span>
			<input name="feedUrl" placeholder="https://domain.hu/rss" required />
		</label>
		<label class="category-label">
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

<section class="panel rules-detail-panel">
	<InternalSectionHeader
		kicker="URL kategorizálás"
		title="URL-alapú rovat hozzárendelési szabályok"
		subtitle={`Ha a feed cikkeinek URL-je illeszkedik a mintára, a cikk automatikusan a cél rovatba kerül. Minta: ${data.selectedSource.domain}/sport/*`}
	/>

	<form class="rule-inline-form" method="POST" action="?/addRule">
		<label class="pattern-label">
			<span>URL Minta</span>
			<input name="urlPattern" placeholder={`${data.selectedSource.domain}/rovat/*`} required />
		</label>
		<label class="category-label">
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

	.source-detail-hero {
		background:
			radial-gradient(circle at top right, rgba(255, 185, 120, 0.15), transparent 34%),
			linear-gradient(135deg, var(--bg-card), rgba(255, 247, 240, 0.7));
		border: 1px solid rgba(255, 78, 58, 0.12);
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
		margin-bottom: 0.5rem;
		display: inline-block;
		transition: var(--transition);
	}
	.back-link:hover {
		color: var(--primary);
	}
	.section-kicker-brand {
		font-size: 0.6875rem;
		font-weight: 850;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--primary);
		margin-bottom: 0.125rem;
	}
	.hero-title {
		font-family: var(--font-display);
		font-size: 1.875rem;
		font-weight: 800;
		line-height: 1.1;
		color: var(--text-main);
	}
	.hero-subtitle {
		font-size: 0.875rem;
		color: var(--text-muted);
		font-weight: 500;
	}
	.stream-button {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 700;
		color: white;
		background: linear-gradient(135deg, var(--text-main), hsl(215, 24%, 27%));
		border-radius: var(--radius-md);
		padding: 0.625rem 1.125rem;
		text-decoration: none;
		box-shadow: var(--shadow-sm);
		transition: var(--transition);
	}
	.stream-button:hover {
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.admin-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-top: 1.5rem;
		margin-bottom: 1.5rem;
	}
	@media (max-width: 1024px) {
		.admin-grid {
			grid-template-columns: 1fr;
		}
	}

	.admin-form-card {
		display: grid;
		gap: 1.25rem;
	}
	.form-vertical-fields {
		display: grid;
		gap: 1rem;
	}

	.source-health-panel {
		display: grid;
		gap: 1.125rem;
		align-content: start;
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
		color: var(--text-light);
		font-weight: 600;
	}
	.badges-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.status-note-box {
		padding: 0.75rem 1rem;
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-left: 4px solid var(--text-muted);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
		line-height: 1.5;
	}
	.status-note-box.has-error {
		background: #fff8f8;
		border-color: rgba(220, 38, 38, 0.15);
		border-left-color: #df1c1c;
		color: #b42318;
	}
	.status-note-box strong {
		display: block;
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
	}

	.source-health-form {
		display: grid;
		gap: 0.875rem;
		background: var(--bg-base);
		padding: 1rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
	}

	.approval-actions-row {
		display: flex;
		gap: 0.75rem;
	}
	.approval-actions-row form {
		flex: 1;
	}
	.approve-btn, .reject-btn {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 700;
		padding: 0.5rem 1rem;
		border-radius: var(--radius-md);
		transition: var(--transition);
		width: 100%;
		border: 1px solid transparent;
	}
	.approve-btn {
		background: hsl(145, 63%, 94%);
		color: var(--success);
		border-color: rgba(20, 180, 100, 0.2);
	}
	.approve-btn:hover:not(:disabled) {
		background: var(--success);
		color: white;
		transform: translateY(-1px);
	}
	.reject-btn {
		background: #fef2f2;
		color: #b42318;
		border-color: rgba(220, 38, 38, 0.15);
	}
	.reject-btn:hover:not(:disabled) {
		background: #b42318;
		color: white;
		transform: translateY(-1px);
	}
	.approve-btn:disabled, .reject-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.config-warning-text {
		font-size: 0.75rem;
		font-weight: 600;
		color: #92400e;
		background: #fffbeb;
		border: 1px solid #fde68a;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
	}

	/* Common form controls */
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
	input:disabled, select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
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
	}
	.save-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(255, 78, 58, 0.25);
	}

	/* Inline Form layout */
	.rule-inline-form {
		display: flex;
		align-items: flex-end;
		gap: 0.875rem;
		flex-wrap: wrap;
		background: var(--bg-base);
		padding: 1.125rem;
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
		padding: 0.5625rem 1rem;
		transition: var(--transition);
		height: 2.375rem;
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
		margin-bottom: 1.5rem;
	}
	.feed-editor-list {
		display: grid;
		gap: 0.5rem;
	}
	.feed-editor-row {
		display: grid;
		grid-template-columns: 2.5fr 1fr 1.25fr 1.25fr 2.5fr 80px;
		gap: 0.875rem;
		align-items: center;
		padding: 0.625rem 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-card);
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
			gap: 0.375rem;
		}
		.feed-editor-head {
			display: none !important;
		}
	}

	.feed-editor-head {
		font-size: 0.6875rem;
		font-weight: 800;
		color: var(--text-light);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: none;
		background: transparent;
		padding-bottom: 0.25rem;
	}
	.feed-url-cell {
		font-size: 0.8125rem;
		color: var(--text-main);
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.last-fetch-text {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.feed-editor-row select, .feed-editor-row input {
		padding: 0.375rem 0.5rem;
	}
	.save-row-btn {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-main);
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0.375rem;
		transition: var(--transition);
	}
	.save-row-btn:hover:not(:disabled) {
		background: var(--primary-light);
		color: var(--primary);
		border-color: var(--primary);
	}

	/* Rules panel */
	.rules-list {
		display: grid;
		gap: 0.5rem;
	}
	.rules-row {
		display: grid;
		grid-template-columns: 3fr 2fr 80px;
		gap: 1rem;
		align-items: center;
		padding: 0.625rem 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-card);
	}
	.rules-row-head {
		font-size: 0.6875rem;
		font-weight: 800;
		color: var(--text-light);
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
	}
	.rule-category-text {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--primary);
	}
	.delete-row-btn {
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
	.delete-row-btn:hover:not(:disabled) {
		background: #b42318;
		color: white;
	}
</style>

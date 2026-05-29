<script lang="ts">
	let {
		searchQuery = $bindable(''),
		todayLabel,
		activeCategory = 'all',
		activePublisher = 'all',
		activeTimeFilter = 'all'
	}: {
		searchQuery: string;
		todayLabel: string;
		activeCategory?: string;
		activePublisher?: string;
		activeTimeFilter?: string;
	} = $props();

	type Suggestion = {
		id: number;
		title: string;
		sourceName: string;
		publishedAt: string;
		highlightTitle?: string;
	};

	let suggestions = $state<Suggestion[]>([]);
	let suggestionsOpen = $state(false);
	let suggestionsLoading = $state(false);
	let suggestionsError = $state<string | null>(null);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let requestToken = 0;

	$effect(() => {
		const q = searchQuery.trim();
		if (debounceTimer) clearTimeout(debounceTimer);

		if (q.length < 2) {
			suggestions = [];
			suggestionsOpen = false;
			suggestionsLoading = false;
			suggestionsError = null;
			return;
		}

		suggestionsLoading = true;
		debounceTimer = setTimeout(() => {
			void loadSuggestions(q);
		}, 140);
	});

	async function loadSuggestions(q: string) {
		const token = ++requestToken;

		try {
			const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const result = await response.json();
			if (token !== requestToken) return;

			suggestions = result.suggestions ?? [];
			suggestionsError = result.error ?? null;
			suggestionsOpen = true;
		} catch (error) {
			if (token !== requestToken) return;
			suggestions = [];
			suggestionsError = error instanceof Error ? error.message : 'Suggestion search failed';
			suggestionsOpen = true;
		} finally {
			if (token === requestToken) suggestionsLoading = false;
		}
	}

	function closeSuggestionsSoon() {
		setTimeout(() => {
			suggestionsOpen = false;
		}, 120);
	}

	function formatSuggestionTime(value: string) {
		return new Intl.DateTimeFormat('hu-HU', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(value));
	}

	function titleParts(suggestion: Suggestion) {
		const highlighted = suggestion.highlightTitle ?? suggestion.title;
		const parts: Array<{ text: string; highlighted: boolean }> = [];
		const pattern = /<mark>(.*?)<\/mark>/gi;
		let lastIndex = 0;

		for (const match of highlighted.matchAll(pattern)) {
			if (match.index > lastIndex) {
				parts.push({ text: highlighted.slice(lastIndex, match.index), highlighted: false });
			}
			parts.push({ text: match[1], highlighted: true });
			lastIndex = match.index + match[0].length;
		}

		if (lastIndex < highlighted.length) {
			parts.push({ text: highlighted.slice(lastIndex), highlighted: false });
		}

		return parts.length > 0 ? parts : [{ text: suggestion.title, highlighted: false }];
	}
</script>

<header class="site-header">
	<div class="header-content">
		<a class="logo-section" href="/" target="_blank" rel="noopener" aria-label="hirek.hu főoldal">
			<div class="logo-icon">H</div>
			<div class="logo-text">hírek<span>.hu</span><span class="logo-badge">live</span></div>
		</a>

		<form class="search-container" action="/" method="GET" aria-label="Hírek keresése">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="search-icon"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z"
				/>
			</svg>
			<input
				type="search"
				name="q"
				class="search-input"
				bind:value={searchQuery}
				placeholder="Keress a hírek között..."
				autocomplete="off"
				onfocus={() => {
					if (searchQuery.trim().length >= 2) suggestionsOpen = true;
				}}
				onblur={closeSuggestionsSoon}
			/>
			{#if activeCategory !== 'all'}
				<input type="hidden" name="category" value={activeCategory} />
			{/if}
			{#if activePublisher !== 'all'}
				<input type="hidden" name="source" value={activePublisher} />
			{/if}
			{#if activeTimeFilter !== 'all'}
				<input type="hidden" name="time" value={activeTimeFilter} />
			{/if}

			{#if suggestionsOpen}
				<div class="search-suggestions">
					{#if suggestionsLoading}
						<div class="suggestion-state">Keresés...</div>
					{:else if suggestionsError}
						<div class="suggestion-state">A keresés most nem elérhető.</div>
					{:else if suggestions.length === 0}
						<div class="suggestion-state">Nincs gyors találat.</div>
					{:else}
						{#each suggestions as suggestion (suggestion.id)}
							<a class="suggestion-item" href={`/go/${suggestion.id}`} target="_blank" rel="noopener">
								<span class="suggestion-title">
									{#each titleParts(suggestion) as part, index (index)}
										{#if part.highlighted}
											<mark>{part.text}</mark>
										{:else}
											{part.text}
										{/if}
									{/each}
								</span>
								<span class="suggestion-source">{suggestion.sourceName} · {formatSuggestionTime(suggestion.publishedAt)}</span>
							</a>
						{/each}
					{/if}
				</div>
			{/if}
		</form>

		<div class="header-meta">
			<div class="date-widget">
				<div class="date-today">{todayLabel}</div>
				<div class="nameday">Ma <span>Emil</span> napja van!</div>
			</div>

			<div class="live-badge" title="Automatikus frissítés előkészítve">
				<span class="live-dot"></span>
				<span>LIVE</span>
			</div>
		</div>
	</div>
</header>

<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const timeOptions = [
		{ label: 'Összes', value: '' },
		{ label: '4 óra', value: '4h' },
		{ label: '12 óra', value: '12h' },
		{ label: '24 óra', value: '24h' },
		{ label: '7 nap', value: '7d' }
	];

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('hu-HU', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(value));
	}

	function highlightSegments(value: string | undefined, fallback: string) {
		return (value ?? fallback).split(/(<mark>|<\/mark>)/).reduce(
			(segments, part) => {
				if (part === '<mark>') {
					segments.marked = true;
					return segments;
				}

				if (part === '</mark>') {
					segments.marked = false;
					return segments;
				}

				if (part) segments.parts.push({ key: segments.parts.length, text: part, marked: segments.marked });
				return segments;
			},
			{ marked: false, parts: [] as Array<{ key: number; text: string; marked: boolean }> }
		).parts;
	}
</script>

<svelte:head>
	<title>Keresés - hirek.hu</title>
	<meta
		name="description"
		content="Gyors, typo-toleráns keresés magyar hírekben forrás, rovat és idő szerint."
	/>
</svelte:head>

<main class="app-container search-page">
	<section class="search-shell">
		<div class="search-panel">
			<div>
				<p class="section-kicker">Keresés</p>
				<h1>Hírek keresése</h1>
			</div>

			<form class="search-form" action="/kereses" method="GET">
				<div class="search-container wide">
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
						value={data.q}
						placeholder="Keress címben, összefoglalóban, forrásban..."
						autocomplete="off"
					/>
				</div>

				<div class="filter-row">
					<input name="category" value={data.category ?? ''} placeholder="Rovat" />
					<input name="source" value={data.source ?? ''} placeholder="Forrás" />
					<select name="time" aria-label="Időszak">
						{#each timeOptions as option (option.value)}
							<option value={option.value} selected={(data.time ?? '') === option.value}>
								{option.label}
							</option>
						{/each}
					</select>
					<button class="load-more-btn" type="submit">Keresés</button>
				</div>
			</form>
		</div>

		<div class="search-meta">
			<span>{data.search.total} találat</span>
			<span>{data.search.engine === 'meilisearch' ? 'Meilisearch' : 'Postgres fallback'}</span>
			{#if data.search.error}
				<span title={data.search.error}>Fallback aktív</span>
			{/if}
		</div>

		<div class="news-feed-list">
			{#if data.search.results.length === 0}
				<div class="empty-state">
					<strong>Nincs találat.</strong>
					<span>Próbálj rövidebb keresést vagy más időszakot.</span>
				</div>
			{:else}
				{#each data.search.results as article (article.id)}
					<article class="news-item search-result">
						<div class="news-main">
							<a class="news-title" href={`/go/${article.id}`} target="_blank" rel="noopener">
								{#each highlightSegments(article._highlight?.title, article.title) as segment (segment.key)}
									{#if segment.marked}<mark>{segment.text}</mark>{:else}{segment.text}{/if}
								{/each}
							</a>
							{#if article.excerpt}
								<p class="news-excerpt">
									{#each highlightSegments(article._highlight?.excerpt, article.excerpt) as segment (segment.key)}
										{#if segment.marked}<mark>{segment.text}</mark>{:else}{segment.text}{/if}
									{/each}
								</p>
							{/if}
							<div class="news-meta-row">
								<span class="source-badge">{article.sourceName}</span>
								<span>{article.urlHost}</span>
								<span>{formatDate(article.publishedAt)}</span>
							</div>
						</div>
					</article>
				{/each}
			{/if}
		</div>
	</section>
</main>

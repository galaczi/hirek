<script lang="ts">
	import SimpleArticleStream from '$lib/components/home/SimpleArticleStream.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Top hírek - hirek.hu</title>
</svelte:head>

<main class="app-container admin-page">
	<section class="search-panel">
		<p class="section-kicker">Top50</p>
		<h1>Top hírek</h1>
	</section>

	<SimpleArticleStream articles={data.articles} />
</main>

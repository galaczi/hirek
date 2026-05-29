<script lang="ts">
	import type { Snippet } from 'svelte';
	import InternalSectionHeader from './InternalSectionHeader.svelte';

	let {
		kicker,
		title,
		subtitle,
		meta,
		toolbar,
		pagination,
		children,
		class: className = ''
	}: {
		kicker?: string;
		title: string;
		subtitle?: string;
		meta?: Snippet;
		toolbar?: Snippet;
		pagination?: Snippet;
		children: Snippet;
		class?: string;
	} = $props();
</script>

<section class={`panel internal-collection-frame ${className}`.trim()}>
	<InternalSectionHeader {kicker} {title} {subtitle} {meta} />

	{#if toolbar}
		<div class="internal-collection-frame__toolbar">
			{@render toolbar()}
		</div>
	{/if}

	<div class="internal-collection-frame__body">
		{@render children()}
	</div>

	{#if pagination}
		<div class="internal-collection-frame__pagination">
			{@render pagination()}
		</div>
	{/if}
</section>

<style>
	.internal-collection-frame {
		display: grid;
		gap: 1.125rem;
	}

	.internal-collection-frame__toolbar {
		display: grid;
		gap: 0.875rem;
	}

	.internal-collection-frame__body {
		min-width: 0;
	}

	.internal-collection-frame__pagination {
		display: flex;
		justify-content: flex-end;
	}
</style>

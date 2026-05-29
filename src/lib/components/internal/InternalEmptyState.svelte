<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		tone = 'neutral',
		compact = false,
		action
	}: {
		title: string;
		description: string;
		tone?: 'neutral' | 'success' | 'warning' | 'danger';
		compact?: boolean;
		action?: Snippet;
	} = $props();
</script>

<div
	class={`internal-empty-state internal-empty-state--${tone} ${compact ? 'internal-empty-state--compact' : ''}`.trim()}
>
	<div class="internal-empty-state__eyebrow">Állapot</div>
	<h3 class="internal-empty-state__title">{title}</h3>
	<p class="internal-empty-state__description">{description}</p>
	{#if action}
		<div class="internal-empty-state__action">
			{@render action()}
		</div>
	{/if}
</div>

<style>
	.internal-empty-state {
		display: grid;
		gap: 0.5rem;
		padding: 1.375rem 1.375rem 1.25rem;
		border: 1px dashed rgba(20, 28, 40, 0.12);
		border-radius: 1.25rem;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(249, 246, 241, 0.9));
	}

	.internal-empty-state--compact {
		padding: 1.125rem;
	}

	.internal-empty-state--warning {
		border-color: rgba(234, 179, 8, 0.22);
		background: linear-gradient(180deg, #fffdf4, #fff7da);
	}

	.internal-empty-state--danger {
		border-color: rgba(220, 38, 38, 0.18);
		background: linear-gradient(180deg, #fff8f8, #fef2f2);
	}

	.internal-empty-state--success {
		border-color: rgba(20, 180, 100, 0.18);
		background: linear-gradient(180deg, #f7fffa, #edfdf2);
	}

	.internal-empty-state__eyebrow {
		color: var(--text-light);
		font-size: 0.625rem;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.internal-empty-state__title {
		color: var(--text-main);
		font-family: var(--font-display);
		font-size: 1.25rem;
		line-height: 1.1;
	}

	.internal-empty-state__description {
		color: var(--text-muted);
		font-size: 0.8125rem;
		line-height: 1.6;
	}

	.internal-empty-state__action {
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
		margin-top: 0.375rem;
	}
</style>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		kicker,
		title,
		subtitle,
		meta,
		class: className = ''
	}: {
		kicker?: string;
		title: string;
		subtitle?: string;
		meta?: Snippet;
		class?: string;
	} = $props();
</script>

<div class={`internal-section-header ${className}`.trim()}>
	<div class="internal-section-header__copy">
		{#if kicker}
			<p class="section-kicker">{kicker}</p>
		{/if}
		<h2 class="internal-section-header__title">{title}</h2>
		{#if subtitle}
			<p class="internal-section-header__subtitle">{subtitle}</p>
		{/if}
	</div>
	{#if meta}
		<div class="internal-section-header__meta">
			{@render meta()}
		</div>
	{/if}
</div>

<style>
	.internal-section-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.internal-section-header__copy {
		min-width: 0;
	}

	.internal-section-header__title {
		font-family: var(--font-display);
		font-size: 1.375rem;
		line-height: 1.08;
		letter-spacing: -0.03em;
	}

	.internal-section-header__subtitle {
		margin-top: 0.5rem;
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 650;
		line-height: 1.55;
	}

	.internal-section-header__meta {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.5rem;
		min-width: 7.5rem;
	}

	.internal-section-header__meta > * {
		min-width: 0;
	}

	@media (max-width: 760px) {
		.internal-section-header {
			display: grid;
		}

		.internal-section-header__meta {
			justify-content: flex-start;
		}
	}
</style>

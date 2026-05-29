<script lang="ts">
	let {
		label,
		value,
		supportingText,
		tone = 'neutral',
		class: className = ''
	}: {
		label: string;
		value: string | number;
		supportingText?: string;
		tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' | 'muted';
		class?: string;
	} = $props();
</script>

<article class={`internal-metric-card internal-metric-card--${tone} ${className}`.trim()}>
	<span class="internal-metric-card__label">{label}</span>
	<strong class="internal-metric-card__value">{value}</strong>
	{#if supportingText}
		<p class="internal-metric-card__supporting">{supportingText}</p>
	{/if}
</article>

<style>
	.internal-metric-card {
		position: relative;
		display: grid;
		gap: 0.625rem;
		min-width: 0;
		padding: 1.125rem 1.125rem 1rem;
		border: 1px solid rgba(20, 28, 40, 0.08);
		border-radius: 1.25rem;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 246, 241, 0.94));
		box-shadow:
			0 12px 28px rgba(16, 24, 40, 0.05),
			inset 0 1px 0 rgba(255, 255, 255, 0.85);
	}

	.internal-metric-card::after {
		content: '';
		position: absolute;
		inset: 0 auto auto 0;
		width: 4rem;
		height: 0.1875rem;
		border-radius: 999px;
		background: rgba(255, 78, 58, 0.22);
	}

	.internal-metric-card--accent::after {
		background: linear-gradient(90deg, var(--primary), var(--secondary));
	}

	.internal-metric-card--success::after {
		background: rgba(20, 180, 100, 0.5);
	}

	.internal-metric-card--warning::after {
		background: rgba(234, 179, 8, 0.5);
	}

	.internal-metric-card--danger::after {
		background: rgba(220, 38, 38, 0.45);
	}

	.internal-metric-card__label {
		color: var(--text-muted);
		font-size: 0.6875rem;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.internal-metric-card__value {
		min-width: 0;
		color: var(--text-main);
		font-family: var(--font-display);
		font-size: clamp(1.625rem, 2.6vw, 2.125rem);
		line-height: 1;
		letter-spacing: -0.04em;
	}

	.internal-metric-card__supporting {
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 650;
		line-height: 1.5;
	}
</style>

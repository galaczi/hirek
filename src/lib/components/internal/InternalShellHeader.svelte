<script lang="ts">
	import type { Snippet } from 'svelte';

	type NavItem = {
		href: string;
		label: string;
		active?: boolean;
	};

	let {
		section,
		title,
		subtitle,
		navItems = [],
		actions
	}: {
		section: string;
		title: string;
		subtitle?: string;
		navItems?: NavItem[];
		actions?: Snippet;
	} = $props();
</script>

<header class="internal-shell-header">
	<div class="internal-shell-header__hero">
		<div class="internal-shell-header__copy">
			<p class="section-kicker">{section}</p>
			<h1 class="internal-shell-header__title">{title}</h1>
			{#if subtitle}
				<p class="internal-shell-header__subtitle">{subtitle}</p>
			{/if}
		</div>

		{#if actions}
			<div class="internal-shell-header__actions">
				{@render actions()}
			</div>
		{/if}
	</div>

	{#if navItems.length > 0}
		<nav class="internal-shell-header__nav" aria-label={`${section} navigáció`}>
			{#each navItems as item (item.href)}
				<a href={item.href} class:active={item.active} aria-current={item.active ? 'page' : undefined}>
					{item.label}
				</a>
			{/each}
		</nav>
	{/if}
</header>

<style>
	.internal-shell-header {
		display: grid;
		gap: 0.75rem;
		margin-bottom: 0.125rem;
	}

	.internal-shell-header__hero {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.125rem;
		padding: 1.5rem 1.625rem;
		border: 1px solid rgba(255, 78, 58, 0.14);
		border-radius: 1.625rem;
		background:
			radial-gradient(circle at top right, rgba(255, 185, 120, 0.28), transparent 34%),
			linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 247, 240, 0.96));
		box-shadow:
			0 18px 40px rgba(145, 72, 16, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.7);
	}

	.internal-shell-header__copy {
		max-width: 47.5rem;
	}

	.internal-shell-header__title {
		font-family: var(--font-display);
		font-size: clamp(1.875rem, 3vw, 2.375rem);
		line-height: 1.02;
		letter-spacing: -0.04em;
	}

	.internal-shell-header__subtitle {
		max-width: 62ch;
		margin-top: 0.625rem;
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 650;
		line-height: 1.6;
	}

	.internal-shell-header__actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.625rem;
	}

	.internal-shell-header__nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.internal-shell-header__nav a {
		display: inline-flex;
		align-items: center;
		min-height: 2.375rem;
		padding: 0 0.875rem;
		border: 1px solid rgba(255, 78, 58, 0.12);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.78);
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 850;
		letter-spacing: 0.02em;
		box-shadow: var(--shadow-sm);
	}

	.internal-shell-header__nav a:hover,
	.internal-shell-header__nav a.active {
		border-color: transparent;
		background: linear-gradient(135deg, var(--text-main), hsl(215, 24%, 27%));
		color: white;
	}

	@media (max-width: 760px) {
		.internal-shell-header__hero {
			display: grid;
			padding: 1.25rem;
		}

		.internal-shell-header__actions {
			justify-content: flex-start;
		}
	}

	@media (max-width: 640px) {
		.internal-shell-header__nav {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.internal-shell-header__nav a {
			justify-content: center;
		}
	}
</style>

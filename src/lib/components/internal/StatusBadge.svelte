<script lang="ts">
	let {
		label,
		tone = 'neutral',
		class: className = ''
	}: {
		label: string;
		tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' | 'muted';
		class?: string;
	} = $props();
</script>

<span class={`status-badge status-badge--${tone} ${className}`.trim()}>
	{label}
</span>

<style>
	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		min-height: 1.75rem;
		padding: 0 0.625rem;
		border: 1px solid rgba(20, 28, 40, 0.08);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.84);
		color: var(--text-muted);
		font-size: 0.6875rem;
		font-weight: 850;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.status-badge--success {
		border-color: rgba(20, 180, 100, 0.18);
		background: hsl(145, 63%, 94%);
		color: var(--success);
	}

	.status-badge--warning {
		border-color: rgba(234, 179, 8, 0.22);
		background: #fff8db;
		color: #9a6700;
	}

	.status-badge--danger {
		border-color: rgba(220, 38, 38, 0.18);
		background: #fef2f2;
		color: #b42318;
	}

	.status-badge--accent {
		border-color: rgba(255, 78, 58, 0.18);
		background: rgba(255, 243, 238, 0.96);
		color: var(--primary);
	}

	.status-badge--muted {
		border-color: rgba(102, 112, 133, 0.16);
		background: rgba(243, 244, 246, 0.95);
		color: var(--text-light);
	}
</style>

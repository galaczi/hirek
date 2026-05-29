<script lang="ts">
	let {
		visible,
		message,
		onClick
	}: {
		visible: boolean;
		message: string;
		onClick?: () => void;
	} = $props();
</script>

{#if onClick}
	<button class:show={visible} class="toast toast-action" type="button" onclick={onClick}>
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="toast-success-icon">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
		</svg>
		<span>{message}</span>
	</button>
{:else}
	<div class:show={visible} class="toast" role="alert" aria-live="assertive">
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="toast-success-icon">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
		</svg>
		<span>{message}</span>
	</div>
{/if}

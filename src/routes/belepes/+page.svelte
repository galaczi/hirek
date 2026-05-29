<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Belépés - hirek.hu</title>
</svelte:head>

<main class="app-container admin-page auth-page">
	<section class="search-panel">
		<p class="section-kicker">hirek.hu</p>
		<h1>Belépés</h1>
	</section>

	<form class="panel admin-form auth-form" method="POST">
		<input type="hidden" name="redirectTo" value={data.redirectTo ?? ''} />
		<label>
			<span>Email</span>
			<input name="email" type="email" autocomplete="email" value={form?.email ?? ''} required />
		</label>
		<label>
			<span>Jelszó</span>
			<input name="password" type="password" autocomplete="current-password" required />
		</label>
		{#if form?.error}
			<p class="form-error">{form.error}</p>
		{/if}
		<button class="load-more-btn" type="submit">Belépés</button>
		<p class="form-hint">
			Partner vagy és új forrást szeretnél beküldeni?
			<a class="secondary-link" href="/partner/jelentkezes/">Jelentkezz itt</a>.
		</p>
	</form>
</main>

<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Partner jelentkezés - hirek.hu</title>
</svelte:head>

<main class="app-container admin-page auth-page">
	<section class="search-panel">
		<p class="section-kicker">Partner onboarding</p>
		<h1>Partner jelentkezés</h1>
		<p class="panel-subtitle">
			Hozz létre partnerfiókot, és küldd be a forrásodat admin jóváhagyásra.
		</p>
	</section>

	<form class="panel admin-form auth-form" method="POST">
		<label>
			<span>Kapcsolattartó neve</span>
			<input name="partnerName" autocomplete="name" value={form?.partnerName ?? ''} required />
		</label>
		<label>
			<span>Email</span>
			<input name="email" type="email" autocomplete="email" value={form?.email ?? ''} required />
		</label>
		<label>
			<span>Jelszó</span>
			<input name="password" type="password" autocomplete="new-password" required />
		</label>
		<label>
			<span>Forrás neve</span>
			<input name="sourceName" value={form?.sourceName ?? ''} required />
		</label>
		<label>
			<span>Slug</span>
			<input name="slug" value={form?.slug ?? ''} required />
		</label>
		<label>
			<span>Domain</span>
			<input name="domain" value={form?.domain ?? ''} placeholder="pelda.hu" required />
		</label>
		{#if form?.error}
			<p class="form-error">{form.error}</p>
		{/if}
		<button class="load-more-btn" type="submit">Jelentkezés elküldése</button>
		<p class="form-hint">
			Már van fiókod?
			<a class="secondary-link" href="/belepes/">Lépj be itt</a>.
		</p>
	</form>
</main>

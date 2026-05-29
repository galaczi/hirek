<script lang="ts">
	import type { Category, Weather } from '$lib/home/data';

	type ExchangeRate = {
		code: string;
		name: string;
		icon: string;
		value: string;
		change: string;
		direction: string;
	};

	type HoroscopeTexts = Record<string, string>;

	let {
		categories,
		activeCategory = $bindable('all'),
		weatherCity = $bindable('Budapest'),
		horoscopeSign = $bindable('kos'),
		weatherData,
		exchangeRates,
		horoscopeTexts,
		categoryCount,
		onCategoryChange
	}: {
		categories: Category[];
		activeCategory: string;
		weatherCity: string;
		horoscopeSign: string;
		weatherData: Record<string, Weather>;
		exchangeRates: ExchangeRate[];
		horoscopeTexts: HoroscopeTexts;
		categoryCount: (slug: string) => number;
		onCategoryChange: (slug: string) => void;
	} = $props();

	const currentWeather = $derived(weatherData[weatherCity] ?? weatherData.Budapest);
</script>

<aside class="sidebar-left">
	<nav class="panel" aria-label="Kategóriák">
		<h2 class="panel-title">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25A2.25 2.25 0 0 1 8.25 10.5H6A2.25 2.25 0 0 1 3.75 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
			</svg>
			Rovatok
		</h2>
		<ul class="cat-nav-list">
			{#each categories as category (category.slug)}
				<li class:active={activeCategory === category.slug} class="cat-nav-item">
					<button type="button" onclick={() => onCategoryChange(category.slug)}>
						{category.name}
						<span class="cat-badge">{categoryCount(category.slug)}</span>
					</button>
				</li>
			{/each}
		</ul>
	</nav>

	<section class="panel">
		<h2 class="panel-title">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1.5m0 15V21m-9-9h1.5m15 0H21m-1.5-7.071-.707.707M6.343 17.657l-.707.707m12.728 0-.707-.707M6.343 6.343l-.707-.707m12.728 0A9 9 0 0 1 5.636 18.364 9 9 0 0 1 18.364 5.636Z" />
			</svg>
			Időjárás
		</h2>
		<select class="weather-selector" bind:value={weatherCity} aria-label="Válassz várost">
			{#each Object.keys(weatherData) as city (city)}
				<option value={city}>{city}</option>
			{/each}
		</select>
		<div class="weather-display">
			<div class="weather-temp-box">
				{#if currentWeather.icon === 'sunny'}
					<svg xmlns="http://www.w3.org/2000/svg" class="weather-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
					</svg>
				{:else if currentWeather.icon === 'cloudy'}
					<svg xmlns="http://www.w3.org/2000/svg" class="weather-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M15.9 10.1A5 5 0 0 0 6 13c0 2.8 2.2 5 5 5h5a4 4 0 0 0 0-8h-.1z" />
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="weather-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M16 13a4 4 0 0 0-8 0 4 4 0 0 0 0 8h8a4 4 0 0 0 0-8z" /><path d="M8 15v4M12 17v4M16 15v4" />
					</svg>
				{/if}
				<span class="weather-temp">{currentWeather.temp}°C</span>
			</div>
			<div class="weather-details">
				<div class="weather-desc">{currentWeather.desc}</div>
				<div>Szél: {currentWeather.wind}</div>
			</div>
		</div>
	</section>

	<section class="panel">
		<h2 class="panel-title">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
			</svg>
			Devizaárfolyam
		</h2>
		<div class="currency-list">
			{#each exchangeRates as rate (rate.code)}
				<div class="currency-item">
					<div class="currency-info">
						<div class="currency-icon">{rate.icon}</div>
						<div>
							<span class="currency-code">{rate.code}/HUF</span>
							<span class="currency-name">{rate.name}</span>
						</div>
					</div>
					<div class="currency-values">
						<div class="currency-price">{rate.value}</div>
						<span class={`currency-change ${rate.direction}`}>{rate.change}</span>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="panel">
		<h2 class="panel-title">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499c.153-.433.748-.433.902 0l2.12 5.961a.5.5 0 0 0 .477.34h6.27c.456 0 .646.574.277.838l-5.074 3.619a.5.5 0 0 0-.178.547l2.12 5.96a.5.5 0 0 1-.77.56l-5.073-3.62a.5.5 0 0 0-.577 0l-5.072 3.62a.5.5 0 0 1-.77-.56l2.12-5.96a.5.5 0 0 0-.178-.547L3.477 10.64c-.37-.264-.18-.838.277-.838h6.27a.5.5 0 0 0 .477-.34l2.12-5.961Z" />
			</svg>
			Napi Horoszkóp
		</h2>
		<select class="horoscope-selector" bind:value={horoscopeSign} aria-label="Válassz csillagjegyet">
			<option value="kos">Kos (03.21 - 04.19)</option>
			<option value="bika">Bika (04.20 - 05.20)</option>
			<option value="ikrek">Ikrek (05.21 - 06.21)</option>
			<option value="rak">Rák (06.22 - 07.22)</option>
			<option value="oroszlan">Oroszlán (07.23 - 08.22)</option>
			<option value="szuz">Szűz (08.23 - 09.22)</option>
			<option value="merleg">Mérleg (09.23 - 10.22)</option>
			<option value="skorpio">Skorpió (10.23 - 11.21)</option>
			<option value="nyilas">Nyilas (11.22 - 12.21)</option>
			<option value="bak">Bak (12.22 - 01.19)</option>
			<option value="vizonto">Vízöntő (01.20 - 02.18)</option>
			<option value="halak">Halak (02.19 - 03.20)</option>
		</select>
		<div class="horoscope-text">{horoscopeTexts[horoscopeSign]}</div>
	</section>
</aside>

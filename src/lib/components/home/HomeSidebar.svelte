<script lang="ts">
	import type { Category, Weather, Publisher } from '$lib/home/data';

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
		onCategoryChange,
		publishers = [],
		activePublisher = 'all',
		onPublisherToggle
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
		publishers?: Publisher[];
		activePublisher?: string;
		onPublisherToggle: (slug: string) => void;
	} = $props();

	const currentWeather = $derived(weatherData[weatherCity] ?? weatherData.Budapest);
	type SidebarTab = 'rovatok' | 'oldalak' | 'trending';

	const publisherAccentMap: Record<string, string> = {
		index: 'var(--color-index)',
		telex: 'var(--color-telex)',
		'24-hu': 'var(--color-24)',
		hvg: 'var(--color-hvg)',
		'444': 'var(--color-444)',
		portfolio: 'var(--color-portfolio)',
		blikk: 'var(--color-blikk)',
		qubit: 'var(--color-qubit)',
		g7: 'var(--color-g7)',
		nepszava: 'var(--color-nepszava)',
		mandiner: 'var(--color-mandiner)'
	};

	let activeTab = $state<SidebarTab>('rovatok');

	function publisherAccent(slug: string) {
		return publisherAccentMap[slug] ?? 'var(--text-light)';
	}
</script>

<aside class="sidebar-left">
	<nav class="panel tabbed-panel" aria-label="Fő navigációs widgetek">
		<div class="tabs-header" role="tablist">
			<button
				id="tab-rovatok"
				type="button"
				class="tab-btn"
				class:active={activeTab === 'rovatok'}
				onclick={() => activeTab = 'rovatok'}
				role="tab"
				aria-selected={activeTab === 'rovatok'}
				aria-controls="panel-rovatok"
				tabindex={activeTab === 'rovatok' ? 0 : -1}
			>
				Rovatok
			</button>
			<button
				id="tab-oldalak"
				type="button"
				class="tab-btn"
				class:active={activeTab === 'oldalak'}
				onclick={() => activeTab = 'oldalak'}
				role="tab"
				aria-selected={activeTab === 'oldalak'}
				aria-controls="panel-oldalak"
				tabindex={activeTab === 'oldalak' ? 0 : -1}
			>
				Oldalak
			</button>
			<button
				id="tab-trending"
				type="button"
				class="tab-btn"
				class:active={activeTab === 'trending'}
				onclick={() => activeTab = 'trending'}
				role="tab"
				aria-selected={activeTab === 'trending'}
				aria-controls="panel-trending"
				tabindex={activeTab === 'trending' ? 0 : -1}
			>
				Trending
			</button>
		</div>

		<div class="tab-content">
			{#if activeTab === 'rovatok'}
				<div id="panel-rovatok" role="tabpanel" aria-labelledby="tab-rovatok">
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
				</div>
			{:else if activeTab === 'oldalak'}
				<div id="panel-oldalak" role="tabpanel" aria-labelledby="tab-oldalak">
					<ul class="pub-nav-list">
						<li class:active={activePublisher === 'all'} class="pub-nav-item">
							<button type="button" onclick={() => onPublisherToggle('all')}>
								<span class="pub-dot all"></span>
								<div class="pub-info">
									<span class="pub-name">Összes oldal</span>
									<span class="pub-host">mindegyik forrás</span>
								</div>
							</button>
						</li>
						{#each publishers as publisher (publisher.slug)}
							<li class:active={activePublisher === publisher.slug} class="pub-nav-item">
								<button type="button" onclick={() => onPublisherToggle(publisher.slug)}>
									<span class="pub-dot" style:background-color={publisherAccent(publisher.slug)}></span>
									<div class="pub-info">
										<span class="pub-name">{publisher.name}</span>
										<span class="pub-host">{publisher.host}</span>
									</div>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{:else if activeTab === 'trending'}
				<div id="panel-trending" role="tabpanel" aria-labelledby="tab-trending" class="trending-placeholder">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="trending-icon">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
					</svg>
					<p class="placeholder-text">Hamarosan érkezik.</p>
				</div>
			{/if}
		</div>
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

<style>
	.tabbed-panel {
		padding: 0;
		overflow: hidden;
	}

	.tabs-header {
		display: flex;
		border-bottom: 1px solid var(--border);
		background-color: var(--bg-alt);
		padding: 4px;
		gap: 4px;
	}

	.tab-btn {
		flex: 1;
		padding: 8px 4px;
		font-family: var(--font-display);
		font-size: 13px;
		font-weight: 600;
		color: var(--text-muted);
		border-radius: var(--radius-sm);
		text-align: center;
		transition: var(--transition);
	}

	.tab-btn:hover {
		background-color: rgba(255, 255, 255, 0.5);
		color: var(--text-main);
	}

	.tab-btn.active {
		background-color: var(--bg-card);
		color: var(--primary);
		box-shadow: var(--shadow-sm);
	}

	.tab-content {
		padding: 16px;
	}

	.pub-nav-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-height: 400px;
		overflow-y: auto;
		padding-right: 4px;
		padding-left: 0;
		margin: 0;
	}

	.pub-nav-list::-webkit-scrollbar {
		width: 4px;
	}
	.pub-nav-list::-webkit-scrollbar-track {
		background: transparent;
	}
	.pub-nav-list::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 2px;
	}

	.pub-nav-item button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		border-radius: var(--radius-sm);
		text-align: left;
		transition: var(--transition);
	}

	.pub-nav-item button:hover {
		background-color: var(--bg-base);
	}

	.pub-nav-item.active button {
		background-color: var(--primary-light);
	}

	.pub-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.pub-dot.all {
		background-color: var(--text-light);
	}

	.pub-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.pub-name {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-main);
	}

	.pub-nav-item.active .pub-name {
		color: var(--primary);
	}

	.pub-host {
		font-size: 11px;
		color: var(--text-light);
	}

	.trending-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 16px;
		text-align: center;
		color: var(--text-light);
		gap: 12px;
	}

	.trending-icon {
		width: 32px;
		height: 32px;
		stroke-width: 1.5;
		color: var(--text-light);
	}

	.placeholder-text {
		font-size: 12px;
		font-weight: 500;
		line-height: 1.4;
	}

	@media (max-width: 600px) {
		.tabs-header {
			overflow-x: auto;
		}

		.tab-btn {
			min-width: 90px;
		}
	}
</style>

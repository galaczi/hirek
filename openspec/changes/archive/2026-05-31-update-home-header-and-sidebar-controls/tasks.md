## 1. Stream Data and Shared State

- [x] 1.1 Extend the shared home `Article` type plus home/search/live loader mappings to include nullable `excerpt` content for public stream rows.
- [x] 1.2 Add layout-owned reader preference state in `src/routes/(home)/+layout.svelte` and pass the new excerpt/font-size props and source-filter callbacks into the public home components.

## 2. Header and Feed Reader Controls

- [x] 2.1 Update `src/lib/components/home/HomeHeader.svelte` to render compact excerpt and font-size controls with accessible labels, active states, and shared-shell behavior.
- [x] 2.2 Update `src/lib/components/home/NewsFeed.svelte` to render optional excerpts, apply bounded font-size modes, and remove the duplicate publisher/source bar while preserving time filters and search status.

## 3. Sidebar Navigation Refresh

- [x] 3.1 Update `src/lib/components/home/HomeSidebar.svelte` to convert the top widget into `Rovatok`, `Oldalak`, and `Trending` tabs with the default category view and an empty trending placeholder.
- [x] 3.2 Wire the `Oldalak` tab to the existing publisher/source filtering behavior so site selection replaces the removed center-column source list.

## 4. Styling and Validation

- [x] 4.1 Add scoped styles and responsive states for the new header controls, tabbed sidebar module, excerpt rows, and font-size modes without moving large redesign work into `src/app.css`.
- [x] 4.2 Run `npm run spec:validate` and review the generated change artifacts for the header controls, tab relocation, and excerpt/font-size behavior before implementation.

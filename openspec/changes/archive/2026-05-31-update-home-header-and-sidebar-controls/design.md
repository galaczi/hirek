## Context

The shared `(home)` layout already owns the public header, left sidebar, center feed, and route-driven filtering state for homepage-style public pages. Today the center feed header carries both time filters and a publisher bar, while the left sidebar's top widget is categories-only. The stream also has no client-side reader preference state, and the shared `Article` shape sent to the public UI does not currently include `excerpt`, even though excerpt data already exists in storage and search results.

This change is a coordinated public-surface update across `HomeHeader`, `HomeSidebar`, `NewsFeed`, the `(home)` layout, and the home-route loader mappings. It should stay frontend-first, keep existing route/filter semantics, and follow the repo preference for scoped component styles instead of pushing page-specific redesign work into `src/app.css`.

## Goals / Non-Goals

**Goals:**
- Add compact header controls that let readers toggle stream excerpts and increase or decrease stream font size with immediate feedback.
- Move source/site navigation from the center feed header into a tabbed sidebar module that groups `Rovatok`, `Oldalak`, and `Trending`.
- Keep the existing category, source, time, search, bookmark, and live-update workflows working on homepage-style public routes.
- Extend the public home article payload so default stream rows, search results, and live inserts can all render excerpts consistently when enabled.

**Non-Goals:**
- Implement trending data or ranking logic beyond an empty placeholder state.
- Add server-stored or URL-synchronized reader preferences.
- Redesign the rest of the sidebar widgets, right rail, or public search backend behavior.

## Decisions

### Keep reader preferences in the shared `(home)` layout client state

The `(home)` layout already coordinates public stream state and passes props into `HomeHeader`, `HomeSidebar`, and `NewsFeed`. Adding `showExcerpt` plus a bounded font-size mode there keeps the behavior immediate, shared across homepage-style routes, and independent of backend contracts.

Alternative considered: encoding preferences in query params or persistent storage. Rejected because the request only requires dynamic local behavior, and persistence would add extra routing/state complexity without clear product value yet.

### Extend the shared public `Article` payload to include `excerpt`

The new excerpt toggle is only useful if the stream rows already have excerpt content available. The implementation should add `excerpt` to `src/lib/home/data.ts`, include it in home loader query mappings, and carry it through search-result mapping and live-article payload creation so newly inserted rows behave the same as existing ones.

Alternative considered: showing excerpts only for search results or fetching excerpts on demand. Rejected because that would create inconsistent row behavior and unnecessary extra fetches for a core stream rendering feature.

### Move source filtering into a tabbed sidebar module and remove the feed-header publisher bar

`HomeSidebar` should own the top navigation block and switch between category filters, site filters, and a placeholder trending panel. The `Oldalak` tab will reuse the already-loaded `publishers` dataset and existing source-filter callback, while `NewsFeed` drops the duplicate publisher strip and keeps time filters plus search status.

Alternative considered: keeping both the publisher bar and the new `Oldalak` tab. Rejected because it duplicates the same navigation affordance in two places and adds clutter to the center reading column.

### Keep styling scoped to the affected home components

The layout and interaction changes are specific to the public home components, so the primary styling work should live in scoped `<style>` blocks inside `HomeHeader.svelte`, `HomeSidebar.svelte`, and `NewsFeed.svelte`. Only truly shared tokens belong in `src/app.css`.

Alternative considered: adding all new styles to `src/app.css`. Rejected because the repo explicitly prefers component-scoped styling for page- and component-specific work.

## Risks / Trade-offs

- [Client-state fanout] -> Passing reader preference props through the layout increases coupling between home components. Mitigation: keep the surface small and explicit (`showExcerpt`, `fontSizeMode`, and the existing callbacks).
- [Missing excerpt content] -> Some rows will not have excerpt text even after the payload change. Mitigation: only render the excerpt block when the control is enabled and the article has non-empty excerpt content.
- [Long site list in sidebar] -> Moving publishers into the sidebar can create a taller navigation panel. Mitigation: use compact list styling, clear active states, and a scrollable tab body if needed.
- [Live insert consistency] -> Live article events need the same `excerpt` shape as initial rows for the toggle to behave consistently. Mitigation: update the live-article mapper together with the shared `Article` type and treat `excerpt` as nullable.

## Migration Plan

1. Extend the shared home `Article` type and server-side home/live mappings to include `excerpt`.
2. Add layout-owned reader preference state and pass it to the header, sidebar, and feed.
3. Convert the sidebar's top module to tabs, move source filtering into `Oldalak`, and remove the duplicate publisher bar from `NewsFeed`.
4. Add scoped styles and responsive behavior for the new controls and tabbed widget.
5. Validate the OpenSpec artifacts, then implement and run the repo-required frontend checks.

Rollback is straightforward because this change is limited to public UI composition and payload mapping. Reverting the component/layout updates and article-shape extension returns the homepage to its current behavior.

## Open Questions

None. The initial implementation will treat reader preferences as local UI state only and keep `Trending` as an empty placeholder.

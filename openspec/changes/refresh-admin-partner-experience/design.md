## Context

The current admin and partner routes already share some broad layout primitives such as `app-container`, `panel`, `section-kicker`, and the basic admin shell header, but most screens still rely on page-specific markup and CSS. The homepage, by contrast, has a clearer visual identity, stronger hierarchy, better use of spacing and typography, and more consistent interaction treatments. This change needs to close that gap without destabilizing server-side behavior, form actions, or route structure.

The main stakeholders are admins who use source, moderation, and ingestion tools daily, and partners who judge the product partly through the reporting portal. The implementation therefore needs to balance three constraints: keep the existing data flows intact, reduce repeated frontend structure, and make dense operational screens easier to scan on both desktop and smaller screens.

## Goals / Non-Goals

**Goals:**
- Reuse the existing homepage visual language and CSS tokens across admin and partner surfaces.
- Introduce a small shared internal UI component layer for shells, page heroes, metric cards, filters, empty states, and data sections.
- Improve information hierarchy and action clarity on all primary admin and partner pages.
- Make dense collections and status-heavy views responsive without losing important operational context.
- Preserve existing loaders, actions, routes, and auth boundaries while changing how the data is presented.

**Non-Goals:**
- Rebuild the homepage or merge admin/partner routes into the public shell.
- Change reporting calculations, moderation logic, ingestion workflows, or authorization rules.
- Introduce a third-party component library or CSS framework.
- Redesign every form control in the application outside the admin and partner surfaces.

## Decisions

### Extend the current design system instead of creating a separate internal stylesheet

The implementation will build on the existing global tokens and panel styles in `src/app.css`, adding internal-surface variants and reusable patterns where needed. This keeps homepage and dashboard pages visually related and avoids splitting the product into two unrelated design systems.

Alternative considered: a standalone admin-only stylesheet or route-scoped design language. Rejected because it would duplicate tokens, drift away from the homepage, and make shared refinements harder.

### Introduce a focused shared internal component set

The implementation will create reusable Svelte components for the repeated dashboard patterns already visible across admin and partner routes: a shell header/page hero, summary metric cards, filter/action toolbars, section headers, collection empty states, and responsive data containers. Route pages will assemble these shared blocks instead of maintaining near-duplicate markup.

Alternative considered: keep all markup inline and only restyle with CSS. Rejected because it would preserve structural duplication and keep future UI changes expensive.

### Keep server contracts stable and treat this as a presentation-layer refactor

The redesign will preserve the current page routes, loader outputs, and form actions. Where pages need different grouping or emphasis, the UI will reorganize existing data rather than change backend contracts unless a clearly necessary small addition is discovered during implementation.

Alternative considered: redesign the data shape for each page at the same time. Rejected because it expands scope and adds risk unrelated to the UX objective.

### Use a hybrid responsive strategy for dense data views

Metric summaries and lightweight lists will collapse into cards on narrow screens, while wide operational collections will use shared responsive table wrappers or stacked row layouts depending on the content type. This keeps critical information readable without forcing every dataset into the same mobile pattern.

Alternative considered: convert every table to horizontal scrolling only. Rejected because some current screens contain status/action mixes that become hard to parse when reduced to a single wide scroller.

### Refresh pages route-by-route under one shared shell

The implementation will update `/admin/`, `/admin/sites/`, `/admin/sites/[sourceId]/`, `/admin/articles/`, `/admin/ingestion/`, and `/partner/` within the same change, using the new shared component set. This gives the internal experience one consistent release instead of a partial redesign with mixed patterns.

Alternative considered: start with one flagship page and defer the rest. Rejected because the user request is about the overall admin and partner experience, and partial rollout would leave the inconsistency mostly intact.

## Risks / Trade-offs

- [Visual scope creep] → Keep the shared component set intentionally small and derived from patterns already repeated in the current routes.
- [CSS regressions across unrelated public pages] → Extend existing tokens and selectors carefully, preferring new internal class names over broad overrides.
- [Reusable component abstraction becoming too generic] → Start from concrete admin/partner use cases and extract only the patterns used by multiple screens.
- [Responsive redesign hiding important operational context] → Preserve labels, counts, and status/action visibility in every compact layout and verify key screens in narrow viewports.
- [Perceived change risk because many pages move at once] → Keep backend contracts stable and validate the redesign page by page before handoff.

## Migration Plan

1. Add the shared internal UI components and the supporting CSS extensions in `src/app.css`.
2. Update the admin and partner layouts to use the refreshed shared shell and navigation treatments.
3. Migrate each primary admin/partner page onto the new shared section, metric, filter, and collection patterns.
4. Verify the affected routes visually and run the repo validation commands before handoff.

Rollback is low risk because this change is intended to be presentation-only: reverting the component/CSS changes and route markup restores the previous UI without data migration concerns.

## Open Questions

None. The current plan assumes "more similar to homepage" means shared visual language, hierarchy, and component quality rather than reusing the public header/navigation directly.

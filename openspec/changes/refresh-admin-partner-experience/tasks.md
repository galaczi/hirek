## 1. Shared Internal UI Foundation

- [x] 1.1 Create a shared internal component set for shell headers, section headers, summary cards, empty states, and responsive collection wrappers.
- [x] 1.2 Extend `src/app.css` with the internal dashboard tokens, layout patterns, and responsive states needed to align admin and partner surfaces with the homepage visual language.

## 2. Shared Shell Rollout

- [x] 2.1 Update `src/routes/admin/+layout.svelte` to use the refreshed shared internal shell and navigation treatment.
- [x] 2.2 Update `src/routes/partner/+layout.svelte` to use the same internal shell family with partner-specific actions and context.

## 3. Admin Page Refresh

- [x] 3.1 Redesign `src/routes/admin/+page.svelte` so launch readiness, key metrics, and primary actions lead the page before the registry list.
- [x] 3.2 Migrate `src/routes/admin/sites/+page.svelte` and `src/routes/admin/articles/+page.svelte` onto the shared filter, collection, pagination, and empty-state patterns.
- [x] 3.3 Redesign `src/routes/admin/sites/[sourceId]/+page.svelte` to clarify source identity, approval state, operational state, feeds, and rules within the shared section hierarchy.
- [x] 3.4 Redesign `src/routes/admin/ingestion/+page.svelte` to group queue actions, feed/job summaries, and recent jobs into clearer operational sections.

## 4. Partner Page Refresh

- [x] 4.1 Redesign `src/routes/partner/+page.svelte` so source context, report window controls, export actions, and summary analytics appear before detailed breakdowns.
- [x] 4.2 Refresh the partner source picker, blocked-state, and empty-data views to use the shared dashboard patterns and clearer partner-facing messaging.

## 5. Validation

- [x] 5.1 Run `npm run spec:validate` and `npm run check`.
- [x] 5.2 Review the affected admin and partner pages for responsive behavior, shared component reuse, and homepage-aligned visual consistency before handoff.

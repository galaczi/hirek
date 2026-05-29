## 1. Shared Internal UI Foundation

- [ ] 1.1 Create a shared internal component set for shell headers, section headers, summary cards, empty states, and responsive collection wrappers.
- [ ] 1.2 Extend `src/app.css` with the internal dashboard tokens, layout patterns, and responsive states needed to align admin and partner surfaces with the homepage visual language.

## 2. Shared Shell Rollout

- [ ] 2.1 Update `src/routes/admin/+layout.svelte` to use the refreshed shared internal shell and navigation treatment.
- [ ] 2.2 Update `src/routes/partner/+layout.svelte` to use the same internal shell family with partner-specific actions and context.

## 3. Admin Page Refresh

- [ ] 3.1 Redesign `src/routes/admin/+page.svelte` so launch readiness, key metrics, and primary actions lead the page before the registry list.
- [ ] 3.2 Migrate `src/routes/admin/sites/+page.svelte` and `src/routes/admin/articles/+page.svelte` onto the shared filter, collection, pagination, and empty-state patterns.
- [ ] 3.3 Redesign `src/routes/admin/sites/[sourceId]/+page.svelte` to clarify source identity, approval state, operational state, feeds, and rules within the shared section hierarchy.
- [ ] 3.4 Redesign `src/routes/admin/ingestion/+page.svelte` to group queue actions, feed/job summaries, and recent jobs into clearer operational sections.

## 4. Partner Page Refresh

- [ ] 4.1 Redesign `src/routes/partner/+page.svelte` so source context, report window controls, export actions, and summary analytics appear before detailed breakdowns.
- [ ] 4.2 Refresh the partner source picker, blocked-state, and empty-data views to use the shared dashboard patterns and clearer partner-facing messaging.

## 5. Validation

- [ ] 5.1 Run `npm run spec:validate` and `npm run check`.
- [ ] 5.2 Review the affected admin and partner pages for responsive behavior, shared component reuse, and homepage-aligned visual consistency before handoff.

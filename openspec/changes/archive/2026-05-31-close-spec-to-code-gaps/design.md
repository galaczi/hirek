## Context

The repo already has baseline specs for onboarding, ingestion, partner reporting, public experience, and search, but code still conflates source approval with operational status and keeps the dedicated search page outside the shared public shell. The implementation needs a small data-model expansion plus coordinated route, loader, and UI updates across admin, partner, ingestion, and public surfaces.

## Goals / Non-Goals

**Goals:**
- Separate source approval from operational ingestion readiness.
- Make partner onboarding self-service through a dedicated public route.
- Enforce approval-aware gating in server-side ingestion/configuration code.
- Keep `/kereses/` on the same public shell and make `7d` work consistently in public stream filtering.
- Surface source approval/package state clearly in partner reporting.

**Non-Goals:**
- Replace Better Auth or introduce a new account model.
- Introduce a new commercial/package system beyond the existing `partnerPackage` field.
- Add a new automated test framework in this change.

## Decisions

### Add `approval_status` to `sources`

The new field carries `pending | approved | rejected`, while `status` remains the operational lifecycle. This keeps approval semantics explicit and avoids overloading `pending` in ways that break ingestion and partner reporting.

Alternative considered: reusing `status` alone. Rejected because the codebase already uses `status` for feed readiness and operational health, which makes approval gates ambiguous and brittle.

### Default new non-partner sources to `approved`

Curated/bootstrap/admin-created sources and discovery-created sources remain admin-owned flows, so the migration backfills them to `approved` and direct admin creation keeps that default.

Alternative considered: defaulting all new sources to `pending`. Rejected because it would force approval work onto existing admin/bootstrap flows that the specs treat separately from partner submissions.

### Use a dedicated onboarding route instead of merging into `/belepes/`

`/partner/jelentkezes/` keeps registration and source submission scoped to one clear flow while leaving `/belepes/` as a simple login entrypoint.

Alternative considered: a combined login/sign-up page. Rejected because it would complicate the current auth UX and mix two flows with different validation and copy.

### Make `/kereses/` a child of the shared `(home)` route group

The homepage layout already owns the shared public shell and in-stream search pipeline. Moving `/kereses/` under that route group removes the duplicate standalone shell while preserving a dedicated path.

Alternative considered: keeping a separate `/kereses/` page and restyling it. Rejected because it preserves duplicate routing and state-management logic.

## Risks / Trade-offs

- [Auth onboarding order] Creating the source before sign-up could leave an orphaned row if sign-up fails. → Validate duplicates first and delete the just-created source on auth failure.
- [Search route behavior drift] The homepage layout currently prefers path-based source/category filters while `/kereses/` uses query params. → Add explicit search-route handling so `/kereses/` stays query-param based without breaking existing homepage/source/category routes.
- [Approval/status confusion in admin] Showing both approval and operational status can be confusing. → Present them as separate labeled states in admin and partner UIs.
- [Migration assumptions] Backfilling existing sources to `approved` assumes the current registry is already admin-curated. → Keep the migration explicit and document the assumption in the change.

## Migration Plan

1. Add the schema field and migration with a default of `approved`.
2. Update server logic to read/write `approvalStatus` and gate ingestion/configuration.
3. Add onboarding and partner/admin UI changes.
4. Move `/kereses/` into the shared public route group and remove the standalone version.
5. Run `npm run spec:validate` and `npm run check`.

Rollback is straightforward: revert the code and migration in one change before applying the migration in production.

## Open Questions

None. The implementation will use the approved assumptions from the plan: direct admin/bootstrap flows default to approved, and partner submissions are the only flow that starts pending.

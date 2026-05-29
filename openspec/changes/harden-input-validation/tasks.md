## 1. Validation Foundation

- [x] 1.1 Add the `arktype` dependency and create a shared server-side validation/normalization module for registration, source management, partner attribution settings, and tracking payloads.
- [x] 1.2 Define reusable canonical rules for slug, domain, feed URL, URL pattern, password policy, UTM values, and bounded analytics metadata plus a shared validation-error mapping shape.

## 2. Data Model and Migration

- [x] 2.1 Backfill existing `sources.domain` values into canonical host-only form and identify any normalized-domain collisions that require manual cleanup.
- [x] 2.2 Add the database-level unique constraint/index for canonical source domains and update the Drizzle schema and migration metadata.

## 3. Route Hardening

- [x] 3.1 Apply the shared validators to partner onboarding and enforce the app-owned password policy before calling Better Auth sign-up.
- [x] 3.2 Apply the shared validators and canonical domain handling to admin source create/update, feed, and URL rule actions.
- [x] 3.3 Apply the shared validators to partner UTM settings and to click/impression tracking metadata normalization before persistence.

## 4. Verification

- [x] 4.1 Add or update coverage for valid and invalid registration, canonical-domain conflicts, admin source input rejection, partner UTM validation, and tracking metadata bounds.
- [x] 4.2 Run project validation for the change, including `openspec validate --all` and `npm run check`, and review any migration readiness issues before implementation handoff.

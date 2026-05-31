## Context

Validation is currently distributed across SvelteKit actions and endpoints as manual trimming, ad hoc `Number(...)` checks, and route-local allowlists. That keeps the code simple, but it creates cross-route drift: partner signup and admin source management normalize domains differently, there is no shared definition of a valid slug/domain/feed URL/URL pattern/UTM payload, password acceptance is delegated implicitly to Better Auth, and analytics metadata is stored without app-owned bounds.

This change crosses auth, onboarding, admin management, partner settings, tracking, and the database schema. It also introduces a new dependency and a migration for source-domain uniqueness, so a design document is warranted before implementation.

## Goals / Non-Goals

**Goals:**

- Introduce one shared server-side validation layer for write paths that accept registration, source-management, partner-settings, or tracking payloads.
- Canonicalize source domains and slugs consistently before uniqueness checks and persistence.
- Enforce a visible application password policy before calling Better Auth sign-up.
- Add a database-enforced uniqueness guarantee for canonical source domains.
- Bound and normalize raw tracking metadata before persistence without changing reporting semantics.
- Preserve current route structure and user flows, changing only acceptance/rejection behavior for invalid input.

**Non-Goals:**

- Redesign authentication UX, approval workflows, or partner reporting layout.
- Replace Better Auth or introduce email verification.
- Change the meaning of click/impression analytics or stop storing referrer and user-agent entirely.
- Auto-repair conflicting existing source records beyond the minimum needed to add the unique constraint.

## Decisions

### Use a shared ArkType validation module for server write paths

All server actions and endpoints that persist user-supplied or partner/admin-supplied input will validate through server-only ArkType schemas plus small normalization helpers. Routes will remain responsible for choosing user-facing error copy, but they will no longer define their own acceptance rules independently.

Why this approach:

- It removes drift between partner onboarding, admin management, and partner settings.
- It gives us one typed definition of accepted payload shapes for implementation and tests.
- It satisfies the requested library choice without pushing client-side validation into scope.

Alternative considered: continue route-local validation helpers. Rejected because the existing problem is inconsistency across routes.  
Alternative considered: Zod. Rejected because the requested direction is ArkType and the change does not need dual schema systems.

### Canonicalize source identity before validation, uniqueness checks, and storage

Source identity fields will be normalized into one canonical stored form:

- `slug`: lowercase kebab-case, 1-80 characters, alphanumeric segments separated by single hyphens.
- `domain`: lowercase host only, with no scheme, `www.`, path, query, fragment, or trailing slash.
- `feedUrl`: absolute `http` or `https` URL.
- `urlPattern`: normalized host/path pattern with an optional terminal `*` wildcard only.
- `utmSource`, `utmMedium`, `utmCampaign`: trimmed tokens up to 120 characters using a URL-safe attribution character set, while preserving case to avoid breaking existing campaign naming conventions.

Why this approach:

- A single canonical domain shape makes database uniqueness enforceable and predictable.
- Preserving UTM case avoids silent attribution changes while still tightening format rules.
- Normalizing before validating reduces “looks different but means the same thing” conflicts.

Alternative considered: store raw input and enforce uniqueness with expression indexes. Rejected because the app already treats domains as canonical identifiers and canonical storage keeps the rest of the code simpler.

### Enforce password policy in app code before Better Auth sign-up

The app will reject email/password signup requests unless the password is at least 12 characters long and contains at least one letter and one number. Validation will happen before calling `auth.api.signUpEmail`.

Why this approach:

- The policy becomes explicit in our own code and tests.
- It avoids depending on opaque library defaults that may change independently of product expectations.
- It keeps the rule simple enough to explain in UI copy.

Alternative considered: minimum length only. Rejected because it would still leave very weak passwords acceptable.  
Alternative considered: uppercase/lowercase/symbol complexity rules. Rejected as unnecessary complexity for the first hardening pass.

### Add a schema migration that backfills canonical domains and then adds a unique constraint

The migration will first normalize existing `sources.domain` values into canonical form. After backfill, it will add a unique index/constraint on the `domain` column. If two existing records collapse to the same canonical domain, the rollout must stop for manual resolution rather than auto-merging records.

Why this approach:

- It closes the current gap where partner signup checks uniqueness in app code but the database does not enforce it.
- It keeps the final schema simple because all future writes use canonical values.
- Manual handling of collisions is safer than guessing which source should survive.

Alternative considered: case-insensitive uniqueness only. Rejected because the inconsistency also includes scheme, `www.`, and trailing slash variants.

### Bound raw analytics metadata instead of changing analytics semantics

Tracking writes will normalize blank strings to `null` and cap raw metadata lengths before persistence:

- `pagePath`: max 500 characters
- `referrer`: max 2048 characters
- `userAgent`: max 512 characters

Why this approach:

- It reduces storage abuse and future rendering risk without changing current reporting semantics.
- It avoids a broader privacy redesign while still hardening the write path.

Alternative considered: hash or drop referrer/user-agent. Rejected for now because current reporting and debugging still rely on readable raw values.

## Risks / Trade-offs

- [Stricter validation will reject inputs that used to be accepted] → Keep rules explicit, deterministic, and route-specific in error handling so failures are understandable.
- [Existing source records may conflict after canonical domain backfill] → Audit during migration and require manual cleanup before adding the unique index if collisions appear.
- [One shared validation module can become too monolithic] → Compose small reusable schemas/helpers by input type instead of one giant schema file.
- [Capped analytics metadata may lose some long-tail debugging detail] → Cap only raw strings and keep click/impression classification, UTM, and IP hash semantics unchanged.

## Migration Plan

1. Add the ArkType dependency and server-only validation/normalization helpers.
2. Backfill `sources.domain` to canonical form and identify any normalized-domain collisions.
3. Resolve collisions manually if they exist, then add the unique domain constraint.
4. Switch partner signup, admin source management, partner UTM settings, and tracking endpoints to shared validators.
5. Update route-level error handling and tests to reflect stricter validation outcomes.

Rollback strategy:

- Revert route changes and remove the new dependency if needed.
- Drop the unique constraint only if rollback must restore legacy writes; canonicalized domain values themselves are forward-compatible and can remain.

## Open Questions

- If normalized-domain collisions are present in existing data, should the implementation pause with a clear operator-facing error or include a one-off report/query to help resolve them?
- Should a later follow-up convert raw `referrer` and `userAgent` storage into redacted or hashed representations once current reporting needs are revisited?

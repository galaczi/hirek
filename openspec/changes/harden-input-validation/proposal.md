## Why

The app currently relies on scattered manual trimming, lightweight required checks, and database lookups for critical user and partner inputs. That leaves important gaps around shared schema validation, strong format rules, password policy, consistent normalization, database-enforced domain uniqueness, and safe handling of raw analytics metadata.

## What Changes

- Introduce a shared ArkType-based server-side validation layer for user registration, admin source management, partner settings, and tracking payload normalization.
- Enforce stronger format and normalization rules for source slugs, domains, feed URLs, URL patterns, and UTM settings across all write paths.
- Define and enforce an app-owned password policy for email/password account creation.
- Add a database-level uniqueness constraint for normalized source domains so partner and admin flows cannot create conflicting duplicates.
- Align domain normalization across partner onboarding and admin source management flows.
- Bound and normalize raw analytics metadata such as referrer and user-agent before persistence while preserving current reporting behavior.

## Capabilities

### New Capabilities

- `input-validation`: Shared validation and normalization rules for user-submitted, partner-submitted, and admin-managed input.

### Modified Capabilities

- `source-onboarding`: Strengthen partner signup, source submission validation, normalization, and password requirements.
- `admin`: Require validated and normalized source, feed, and URL rule inputs in admin management flows.
- `partner-reporting`: Require validated and normalized partner-managed attribution settings.
- `tracking`: Bound and normalize raw tracking metadata before storage without changing click and impression semantics.

## Impact

- Affected code: auth configuration, partner onboarding actions, admin source actions, partner portal actions, tracking endpoints, and shared server utilities.
- Affected systems: Drizzle schema and migration files, Better Auth sign-up flow, analytics persistence, and validation helpers used across SvelteKit server routes.
- New dependency: `arktype`.

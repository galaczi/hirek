## Why

Several approved baseline OpenSpec requirements are only partially implemented in code today. The biggest gaps are partner onboarding, approval-aware ingestion and reporting, and the mismatch between the homepage shell and the dedicated public search route.

## What Changes

- Add a dedicated approval lifecycle for sources so approval state is no longer overloaded into the operational source status.
- Add a public partner onboarding route that creates the partner account, creates a pending source submission, links both records, and signs the new partner in.
- Gate feed discovery, feed configuration, URL rule management, feed scheduling, and direct feed ingestion on approved sources.
- Show approval/package state in partner reporting flows and replace analytics/configuration panels with a source-state view until approval is granted.
- Move the dedicated `/kereses/` experience into the shared public shell and add full `7d` support to public stream filtering and live matching.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `source-onboarding`: add a dedicated onboarding route and a separate approval lifecycle for partner-submitted sources.
- `ingestion`: make discovery, scheduling, and direct feed ingestion depend on a dedicated source approval state.
- `partner-reporting`: expose approval/package state and block analytics/configuration until the source is approved.
- `public-experience`: render `/kereses/` inside the shared public shell and keep public stream filters consistent with `7d` support.
- `search`: keep dedicated public search filters on `/kereses/` while using the shared public search pipeline.

## Impact

- Affected code: auth configuration, source schema/migrations, onboarding/auth routes, admin source management, ingestion services, partner portal loaders/pages, homepage/public shell routing, and shared home/search utilities.
- Affected systems: Better Auth account creation, Drizzle schema/migrations, OpenSpec capability docs, and public route composition in SvelteKit.

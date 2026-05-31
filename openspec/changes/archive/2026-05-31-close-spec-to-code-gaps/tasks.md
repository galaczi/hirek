## 1. OpenSpec And Data Model

- [x] 1.1 Capture the proposal, design, and spec deltas for onboarding, ingestion, partner reporting, public experience, and search.
- [x] 1.2 Add `approval_status` to the source schema and generate the migration that backfills existing sources to approved.

## 2. Server-Side Lifecycle And Gating

- [x] 2.1 Implement the dedicated partner onboarding route and sign-up flow.
- [x] 2.2 Enforce approval-aware gating for feed discovery, feed/rule management, feed scheduling, and direct feed ingestion.
- [x] 2.3 Extend admin source actions and partner reporting loaders with approval-state behavior.

## 3. Public And Admin UI

- [x] 3.1 Update admin and partner pages to expose approval/package state and pending/rejected source behavior.
- [x] 3.2 Move `/kereses/` into the shared public shell and remove the standalone search page implementation.
- [x] 3.3 Add full `7d` support to public filter controls, route handling, and live matching.

## 4. Validation

- [x] 4.1 Run `npm run spec:validate` and `npm run check`.
- [x] 4.2 Review the final diff for scope and summarize outcomes plus any residual risks.

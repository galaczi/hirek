## Why

The product already behaves like a traffic-distribution platform for publishers, but its commercial model is only implied in code through package flags and reporting. Defining a concrete partner monetization model now will let the team package the existing value proposition into sellable offerings, align partner expectations, and guide future implementation without prematurely committing to reader subscriptions, ad stack work, or billing infrastructure.

## What Changes

- Define a formal partner packaging capability with package tiers, package entitlements, traffic goals, and reciprocal content-exchange requirements.
- Extend partner onboarding and admin source management so each partner source has an explicit commercial state, default package path, and upgrade workflow after approval.
- Extend partner reporting so package context, traffic target progress, and exchange obligations are visible alongside click analytics.
- Establish what is intentionally out of scope for this phase: reader paywalls, on-site advertising inventory, automated invoicing, and contract/billing integrations.

## Capabilities

### New Capabilities
- `partner-packaging`: defines the sellable partner packages, their entitlements, upgrade paths, traffic targets, and optional content-exchange obligations

### Modified Capabilities
- `admin`: source management gains package assignment, package-state visibility, traffic-target management, and exchange-program controls
- `partner-reporting`: partner reporting gains package context, traffic-target progress, and visibility into exchange-based obligations or eligibility
- `source-onboarding`: partner-submitted sources gain a defined commercial starting state and path from pending review to monetizable package assignment

## Impact

- Affected code: partner/admin loaders and pages, source schema fields related to commercial status, package settings, and reporting summaries
- Affected systems: partner onboarding, source approval workflow, partner analytics, and future packaging/pricing operations
- APIs and backend contracts: source and reporting payloads will need to expose package metadata, traffic targets, and exchange-state fields
- Out of scope: payment processing, invoicing, CRM sync, ad-serving inventory, and direct consumer monetization

## Why

The product already tracks outbound traffic and exposes partner reporting, but monetization is still modeled as package metadata rather than an actionable acquisition system. To sell click inventory credibly, the platform needs source-level trust, route-targeted visibility controls, wallet funding, billable click charging, and invoice generation tied to the same delivery model that drives public article ranking.

## What Changes

- Introduce three acquisition modes for source distribution: organic baseline inclusion, paid visibility boost, and traffic exchange.
- Replace package-only commercial delivery with source-level acquisition settings: trust score, boost status, route targeting, max CPC, daily spend cap, wallet balance, and exchange credit balance.
- Use one public-scoring model across homepage, top list, source pages, and category pages, combining editorial relevance with paid or exchange boost signals.
- Charge unique human outbound clicks per article per 24 hours against wallet or exchange credit balances.
- Add partner/admin controls and reporting for acquisition settings, wallet activity, invoice history, and route-level performance.
- Add Számlázz.hu-backed invoice creation for wallet top-ups with a local fallback when credentials are not configured.

## Capabilities

### Modified Capabilities

- `admin`: admins manage trust score, boost settings, route targeting, wallet/exchange balances, and legacy package state from source detail pages.
- `partner-packaging`: source commercial management evolves from package labels into acquisition controls while keeping package/exchange context visible.
- `partner-reporting`: partners can view wallet, billing, route performance, and boost settings alongside click analytics.
- `public-experience`: all public list surfaces use the acquisition-aware marketplace scorer.
- `tracking`: impression and click events capture surface and acquisition-mode data, and billable clicks trigger spend deductions and ledger entries.

## Impact

- Affected code: source schema/migrations, public article loaders, click/impression tracking, billing helpers, admin source management, partner reporting, validation, and OpenSpec docs.
- Affected systems: Drizzle schema/migrations, public ranking, partner/admin dashboards, and invoice provider configuration.

## Context

The repo already has outbound click tracking, impression tracking, partner reporting, and source-level commercial metadata. This change turns those building blocks into a traffic acquisition marketplace where source owners can buy visibility through route-targeted boost settings and wallet funding while admins retain editorial trust control.

## Goals / Non-Goals

**Goals:**
- Sell unique human outbound clicks per article per 24 hours.
- Rank public article lists with one scorer that combines trust, freshness, existing engagement, and paid/exchange boost value.
- Let partners fund wallet balance, configure max CPC and daily caps, and target boost across public list surfaces.
- Let admins set trust and source-level acquisition controls.
- Record route/mode-level spend and invoice state so reporting and billing use the same data.

**Non-Goals:**
- Implement scheduled start/end-date campaigns.
- Implement second-price CPC clearing in v1.
- Auto-tune trust from clicks or other engagement signals.
- Add a dedicated payment-provider abstraction beyond Számlázz/local invoice support.

## Decisions

### Acquisition settings live on `sources`

The marketplace is source-scoped, so trust score, boost state, route targets, wallet balance, exchange credit balance, max CPC, and daily cap all live on the `sources` table. This keeps acquisition configuration aligned with the existing source approval and partner ownership model.

### Trust is manual and participates as `quality_factor`

Admins set a 0–10 trust score manually. The scorer uses `trust / 10` as the current `quality_factor` input and does not treat trust as a hard gate. Purchased traffic does not mutate trust.

### One shared scorer powers public list surfaces

Homepage, top list, source pages, category pages, and source+category pages all call the same marketplace-aware article query. Each candidate article receives:

- a freshness score
- an engagement score from existing click score
- a trust contribution
- a boost rank contribution

`boost_rank_value = bid * expected_ctr * quality_factor`

Where:
- `bid` = source `max_cpc`
- `expected_ctr` = rolling per-source unique click / impression estimate for the current surface
- `quality_factor` = manual trust factor

Boost only contributes when:
- source approval is `approved`
- boost status is `active`
- the route surface is targeted
- daily cap is not exhausted
- the source has wallet balance or exchange credits for the current mode

### Billable clicks remain article-scoped uniqueness

The existing article-level 24-hour uniqueness rule already matches the product decision. A unique non-bot click can consume spend; bots and duplicate clicks do not.

### Spend and invoices use a ledger

Wallet top-ups create invoice rows plus positive ledger entries. Billable paid or exchange clicks create negative ledger entries and decrement the matching source balance. Click events store the charged amount and acquisition mode for direct reporting.

### Route targeting uses named public surfaces

V1 route targeting uses:
- `home`
- `top`
- `category`
- `source`
- `source_category`

Impressions and clicks persist the resolved surface so reporting can show route-level delivery and spend.

## Risks / Trade-offs

- [Aggressive UI changes on admin source detail] → Mitigation: keep Antigravity work scoped to the two UI files and review the diff manually before shipping.
- [Invoice API variability] → Mitigation: keep a local fallback path so wallet funding works in development without external credentials.
- [Boost ranking can dominate low-freshness content] → Mitigation: keep freshness and existing engagement in the overall score and cap boost to sources with available budget.
- [Route-level CTR estimates may be noisy for new sources] → Mitigation: use a smoothed expected CTR formula with a small baseline.

## Migration Plan

1. Add new source acquisition columns plus invoice/ledger tables.
2. Extend tracking events with surface, acquisition mode, and charge amount.
3. Switch public list loaders to the marketplace scorer.
4. Add billing helpers, admin controls, partner controls, and reporting.
5. Validate with `npm run test:validation`, `npm run check`, and `npm run spec:validate`.

## Open Questions

None for v1. The current implementation locks in source-level funding, article-level uniqueness, manual trust, max-CPC charging, and all public list surfaces participating in the shared scorer.

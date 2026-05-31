## 1. OpenSpec And Data Model

- [x] 1.1 Capture proposal, design, and capability-spec deltas for admin, partner reporting, public experience, tracking, and partner packaging.
- [x] 1.2 Add source acquisition fields, click/impression tracking fields, invoice table, and billing ledger table with a generated migration.

## 2. Marketplace Delivery And Billing

- [x] 2.1 Implement shared acquisition helpers for trust, surfaces, route targeting, and money normalization.
- [x] 2.2 Implement marketplace-aware article ranking across public list surfaces.
- [x] 2.3 Implement billable click resolution, wallet/exchange charging, and invoice-backed wallet top-up flow.

## 3. Admin And Partner Controls

- [x] 3.1 Extend admin source detail to manage trust, boost settings, route targeting, and balance-related fields alongside legacy commercial state.
- [x] 3.2 Extend partner reporting to expose wallet status, route/mode performance, ledger history, invoice history, and partner-managed boost settings.
- [x] 3.3 Keep existing UTM, feed-health, and category-rule management intact while layering the new acquisition controls into the same internal design system.

## 4. Validation

- [x] 4.1 Extend server-side validation coverage for acquisition settings and wallet top-ups.
- [x] 4.2 Run `npm run test:validation`, `npm run check`, and `npm run spec:validate`.
- [x] 4.3 Review the final diff for scope, including Antigravity UI changes, and summarize residual risks.

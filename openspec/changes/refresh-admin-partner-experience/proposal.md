## Why

The admin and partner pages already expose the right operational data, but the experience is visually inconsistent, overly dense, and much less polished than the homepage. Improving these internal surfaces now will make day-to-day workflows faster for admins, increase partner confidence, and reduce the cost of future UI work by moving repeated patterns into shared components.

## What Changes

- Introduce a shared internal dashboard experience that gives admin and partner pages a consistent shell, hero area, card system, status treatments, filters, tables, and empty states aligned with the homepage's visual language.
- Refactor admin and partner routes to use reusable UI building blocks instead of page-specific markup and one-off styling.
- Redesign the admin dashboard, sources index, source detail, article moderation, ingestion, and partner overview screens to improve scanability, hierarchy, responsive behavior, and action clarity.
- Preserve the existing route structure, loaders, and form actions while improving presentation, navigation cues, and layout behavior around the current data model.

## Capabilities

### New Capabilities
- `dashboard-experience`: shared internal shell and reusable UI behaviors for data-heavy admin and partner surfaces

### Modified Capabilities
- `admin`: internal management pages gain a reusable dashboard shell, clearer information hierarchy, responsive data presentation, and more consistent action/feedback patterns
- `partner-reporting`: partner reporting gains the same shared dashboard experience, with clearer analytics summaries, state messaging, and responsive chart/table presentation

## Impact

- Affected code: `src/app.css`, admin and partner route layouts/pages, and new shared internal UI components under `src/lib/components/`
- Affected systems: SvelteKit route composition for `/admin/*` and `/partner/*`, shared frontend design tokens/patterns, and OpenSpec capability docs for internal experience behavior
- APIs and backend contracts: no intended changes to loaders, actions, auth boundaries, or reporting calculations

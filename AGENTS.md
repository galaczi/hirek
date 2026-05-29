# Repo Instructions

Apply these rules for work in `/home/jeno/Dev/hirek`.

## Frontend Redesign Workflow

- For visual redesign, restyling, layout modernization, or homepage-alignment work, use Antigravity first.
- Run `agy` from the repo root with a tightly scoped prompt that names the exact routes/components, constraints, and validation command.
- Do not skip Antigravity silently. If it is blocked by platform policy, unavailable, or fails, say that immediately and then continue with the safest local fallback.
- After any Antigravity run, inspect the diff yourself and keep only changes that stay within the requested scope.

## Svelte Styling

- Prefer scoped `<style>` blocks inside the affected `.svelte` files for page- or component-specific styling.
- Do not move large redesign work into `src/app.css`.
- Use `src/app.css` only for truly global tokens or styles that must be shared application-wide.

## Validation

- For frontend changes, run `npm run check` before handoff.
- If the change also touches OpenSpec artifacts or implementation tied to an OpenSpec change, run `npm run spec:validate` too.

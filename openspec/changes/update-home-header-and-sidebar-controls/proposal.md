## Why

The public homepage currently splits reader controls and source navigation across multiple areas, which makes the interface feel busier than it needs to and leaves no way for readers to adjust how dense the stream appears. Adding compact reading controls in the header and consolidating category/site navigation into a single tabbed sidebar block will make the homepage easier to scan without changing its core workflow.

## What Changes

- Add compact public-header reader controls that let users toggle article excerpts beneath stream links and increase or decrease stream font size dynamically.
- Move publisher/site navigation out of the center-column publisher bar and into the left sidebar as an `Oldalak` tab alongside `Rovatok`.
- Convert the current `Rovatok` widget into a three-tab sidebar module with `Rovatok`, `Oldalak`, and `Trending`, leaving `Trending` intentionally empty for now.
- Preserve the existing public shell, article stream behavior, and category/time filtering while removing the duplicate center-column source list.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `public-experience`: the public homepage gains persistent reader controls in the shared header and a tabbed left-sidebar navigation module that replaces the in-stream source list

## Impact

- Affected code: `src/lib/components/home/HomeHeader.svelte`, `src/lib/components/home/HomeSidebar.svelte`, `src/lib/components/home/NewsFeed.svelte`, the `(home)` layout that coordinates public stream state, and related homepage styling
- Affected systems: public homepage interaction model, shared public shell presentation, and OpenSpec documentation for homepage behavior
- APIs and backend contracts: no intended backend or API changes; this is a frontend behavior and layout update

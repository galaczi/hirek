# Public Experience Specification

## Purpose

Public experience defines the shared public shell, homepage search behavior, live stream updates, and link-target rules across the public news surfaces.
## Requirements
### Requirement: Shared Public Discovery Ranking
The system SHALL rank shared discovery surfaces with the marketplace-aware visibility scorer.

#### Scenario: Public list surface is loaded
- **WHEN** a user loads the homepage, top list, category page, or time-filtered stream
- **THEN** article ordering reflects editorial relevance plus trust-weighted paid or exchange boost contributions for eligible sources

#### Scenario: Source archive surface is loaded
- **WHEN** a user loads a source page or source+category page
- **THEN** retained active articles from that source are ordered by publication time descending

### Requirement: Public Link Target Behavior
The system SHALL preserve the acquisition surface and selected delivery mode when redirecting outbound article clicks.

#### Scenario: User opens an article from a public list
- **WHEN** a user clicks an outbound article on a public list surface
- **THEN** the redirect request includes the originating surface and delivery mode so billing and reporting can attribute the click correctly

### Requirement: Homepage Search In Stream

The system SHALL execute header search on the current public route and replace the homepage middle stream with results from the public search pipeline.

#### Scenario: User searches from the homepage header

- **WHEN** a user submits a search query from the public header
- **THEN** the current public route keeps its public shell and the middle stream shows search results instead of the default article stream

#### Scenario: Homepage search uses active filters

- **WHEN** source, category, or time filters are active on the homepage
- **THEN** the in-stream search respects those filters, including the `7d` time window

### Requirement: Live Public Stream Updates

The system SHALL auto-prepend matching live articles into the visible public stream and show a toast notification.

#### Scenario: New unfiltered article arrives

- **WHEN** a live article event arrives on an unfiltered public stream
- **THEN** the article is prepended to the stream and a toast is shown

#### Scenario: New article does not match active public filters

- **WHEN** a live article event does not satisfy the active source, category, time, or text-query constraints
- **THEN** the article is not inserted into the current visible stream

#### Scenario: New article matches active public filters

- **WHEN** a live article event satisfies the active source, category, time, and text-query constraints
- **THEN** the article is prepended to the visible stream and the toast count is updated

### Requirement: Public Stream Reader Controls
The system SHALL expose compact reader controls in the shared public header that let users toggle article excerpts and adjust stream font size for homepage-style public streams.

#### Scenario: User enables stream excerpts
- **WHEN** a user enables the excerpt control from the shared public header
- **THEN** each visible public-stream article with excerpt content shows that excerpt directly beneath the article link

#### Scenario: User disables stream excerpts
- **WHEN** a user disables the excerpt control from the shared public header
- **THEN** visible public-stream articles hide their excerpt text without reloading the page

#### Scenario: User changes stream font size
- **WHEN** a user activates the header font increase or decrease control
- **THEN** the visible public-stream typography updates immediately on the current route

### Requirement: Tabbed Homepage Sidebar Navigation
The system SHALL render the left sidebar's primary navigation widget as tabs for categories, sites, and a reserved trending area.

#### Scenario: Public stream loads default sidebar tab
- **WHEN** a user opens a homepage-style public route inside the shared public shell
- **THEN** the first sidebar widget defaults to the `Rovatok` tab and shows category filters

#### Scenario: User opens the sites tab
- **WHEN** a user selects the `Oldalak` tab
- **THEN** the widget shows the available site list and selecting a site applies the same public source filter used by the stream

#### Scenario: Source navigation is not duplicated in the feed header
- **WHEN** the `Oldalak` site list is available in the sidebar
- **THEN** the center-column feed header does not render a duplicate publisher or source list

#### Scenario: User opens the trending tab
- **WHEN** a user selects the `Trending` tab
- **THEN** the widget renders an empty placeholder state and does not yet populate trending content

### Requirement: Dedicated Search Shell Parity
The system SHALL render the dedicated public search route inside the shared public shell used by homepage-style public routes.

#### Scenario: User opens dedicated search route
- **WHEN** a user loads `/kereses`
- **THEN** the page uses the same shared header, navigation, and public stream shell as the homepage

### Requirement: Public Stream Seven-Day Filter
The system SHALL support the `7d` time filter consistently across public homepage streams, dedicated public search, and live article matching.

#### Scenario: User selects seven-day filter on a public stream
- **WHEN** a public stream is filtered with `7d`
- **THEN** only articles published within the last seven days remain visible

#### Scenario: Live article is evaluated against seven-day filter
- **WHEN** a live article event arrives while the active public stream filter is `7d`
- **THEN** the event is inserted only if the article falls within the seven-day window and matches the rest of the active filters

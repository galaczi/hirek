## ADDED Requirements

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

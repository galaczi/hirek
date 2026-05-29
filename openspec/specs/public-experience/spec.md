# Public Experience Specification

## Purpose

Public experience defines the shared public shell, homepage search behavior, live stream updates, and link-target rules across the public news surfaces.

## Requirements

### Requirement: Shared Public Shell

The system SHALL render the homepage and the dedicated public search page inside the same public site shell.

#### Scenario: User opens the dedicated search page

- **WHEN** a user loads `/kereses`
- **THEN** the page uses the same public header and top-level navigation model as the homepage

#### Scenario: Public search page is rendered

- **WHEN** the dedicated search page is displayed
- **THEN** it SHALL not inherit admin or dashboard presentation patterns

### Requirement: Public Link Target Behavior

The system SHALL keep internal site navigation in the current tab and open outbound article links in a new tab.

#### Scenario: User follows an internal site link

- **WHEN** a user clicks a public navigation link such as the logo or top menu
- **THEN** the current tab navigates within the site

#### Scenario: User opens an article

- **WHEN** a user clicks a public article link
- **THEN** the site opens the tracked outbound article in a new tab

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

# Search Specification

## Purpose

Search lets users find active articles by text, source, category, and recency.
## Requirements
### Requirement: Active Retained Article Search

The system SHALL search only active retained articles.

#### Scenario: Search runs

- **WHEN** a search query is executed
- **THEN** inactive articles are excluded from results

#### Scenario: Search runs after retention window

- **WHEN** a search query is executed
- **THEN** articles older than the 90-day retention window are excluded from results

### Requirement: Text Matching

The system SHALL match text queries against article title, excerpt, and source name.

#### Scenario: Query text is present

- **WHEN** a non-empty query is submitted
- **THEN** results may match full-text search, title similarity, excerpt similarity, or source-name similarity

### Requirement: Search Filtering

The system SHALL support source, category, and time-window filters.

#### Scenario: Time filter is present

- **WHEN** a time filter of `4h`, `12h`, `24h`, or `7d` is provided
- **THEN** only articles published inside that window are returned

### Requirement: Result Ordering

The system SHALL order search results by relevance, publication time, and click score.

#### Scenario: Query text is present

- **WHEN** search results are returned
- **THEN** higher ranked matches appear before lower ranked matches, with newer and higher-click articles breaking ties

### Requirement: Dedicated Public Search Route Filters
The system SHALL support dedicated public search queries and filters on `/kereses` while using the shared public search pipeline.

#### Scenario: Search route uses query parameters
- **WHEN** a user loads `/kereses` with `q`, `source`, `category`, or `time` query parameters
- **THEN** the public search pipeline uses those filters without redirecting the user to a homepage-style source or category route

#### Scenario: Search route uses seven-day filter
- **WHEN** a user searches on `/kereses` with `time=7d`
- **THEN** only results published within the last seven days are returned

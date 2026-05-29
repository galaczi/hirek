# Search Specification

## Purpose

Search lets users find active articles by text, source, category, and recency.

## Requirements

### Requirement: Active Article Search

The system SHALL search only active articles.

#### Scenario: Search runs

- **WHEN** a search query is executed
- **THEN** inactive articles are excluded from results

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


# Articles Specification

## Purpose

Articles are the public news items shown across the main feed, source pages, category views, top lists, and search results.

## Requirements

### Requirement: Active Article Listing

The system SHALL list only active retained articles in public article streams.

#### Scenario: Public feed excludes inactive articles

- **WHEN** a public article list is loaded
- **THEN** articles with `active = false` are excluded

#### Scenario: Expired articles are excluded

- **WHEN** a public article list is loaded
- **THEN** articles older than the 90-day retention window are excluded

#### Scenario: Discovery ordering uses visibility score

- **WHEN** a shared discovery article list is loaded
- **THEN** articles are ordered by SQL-computed visibility score and then publication time descending

#### Scenario: Source archive ordering favors chronology

- **WHEN** a source or source-category article list is loaded
- **THEN** articles are ordered by `published_at` descending and then `click_score` descending

### Requirement: Source And Category Filters

The system SHALL allow public article lists to be filtered by source slug and category slug.

#### Scenario: Source filter

- **WHEN** a source slug filter is provided
- **THEN** only articles belonging to that source are returned

#### Scenario: Category filter

- **WHEN** a category slug filter is provided
- **THEN** only articles assigned to that category are returned

### Requirement: Public Source Pages

The system SHALL expose public source pages only for sources that are not disabled.

#### Scenario: Disabled source

- **WHEN** a source has status `disabled`
- **THEN** the public source lookup returns no source

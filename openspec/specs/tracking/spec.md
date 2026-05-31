# Tracking Specification

## Purpose

Tracking records human article clicks and aggregate impressions for ranking, attribution, and partner reporting.
## Requirements
### Requirement: Click Redirect Tracking

The system SHALL record human click events before redirecting users to article canonical URLs, storing normalized and bounded metadata when present.

#### Scenario: Valid article click

- **WHEN** a user requests a valid active article redirect
- **THEN** a click event is recorded with article, source, category, normalized referrer, normalized user agent, IP hash, UTM, and uniqueness metadata

#### Scenario: Bot click

- **WHEN** the click is classified as bot traffic
- **THEN** the user is redirected without storing a click event, updating stats, billing, or incrementing article click score

#### Scenario: Human click

- **WHEN** the click is not classified as bot traffic
- **THEN** the article click score and source-surface rolling stats are incremented

#### Scenario: Raw metadata exceeds bounds

- **WHEN** a click request includes blank or oversized raw referrer or user-agent metadata
- **THEN** the system stores a normalized bounded value or `null` instead of persisting the raw unbounded string

### Requirement: Tracked Outbound URLs

The system SHALL append configured UTM attribution to outbound article URLs.

#### Scenario: Redirect is issued

- **WHEN** a click redirect completes
- **THEN** the user is redirected to the tracked canonical URL

### Requirement: Impression Batch Aggregation

The system SHALL aggregate human impressions for active articles in bounded batches without storing raw impression events.

#### Scenario: Impression payload is accepted

- **WHEN** a payload includes valid positive article ids
- **THEN** up to 100 unique article ids are considered for aggregate counting
- **AND** accepted page-path metadata determines the public surface

#### Scenario: No active articles match

- **WHEN** no active articles match the submitted ids
- **THEN** the endpoint returns success with zero counted impressions

#### Scenario: Bot impression batch

- **WHEN** the impression request is classified as bot traffic
- **THEN** the endpoint returns success without storing raw data or updating aggregate stats

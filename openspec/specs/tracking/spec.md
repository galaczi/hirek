# Tracking Specification

## Purpose

Tracking records article clicks and impressions for ranking, attribution, and partner reporting.

## Requirements

### Requirement: Click Redirect Tracking

The system SHALL record click events before redirecting users to article canonical URLs.

#### Scenario: Valid article click

- **WHEN** a user requests a valid active article redirect
- **THEN** a click event is recorded with article, source, category, referrer, user agent, IP hash, UTM, bot, and uniqueness metadata

#### Scenario: Non-bot click

- **WHEN** the click is not classified as bot traffic
- **THEN** the article click score is incremented

### Requirement: Tracked Outbound URLs

The system SHALL append configured UTM attribution to outbound article URLs.

#### Scenario: Redirect is issued

- **WHEN** a click redirect completes
- **THEN** the user is redirected to the tracked canonical URL

### Requirement: Impression Batch Tracking

The system SHALL record impression events for active articles in bounded batches.

#### Scenario: Impression payload is accepted

- **WHEN** a payload includes valid positive article ids
- **THEN** up to 100 unique article ids are considered for insertion

#### Scenario: No active articles match

- **WHEN** no active articles match the submitted ids
- **THEN** the endpoint returns success with zero inserted impressions


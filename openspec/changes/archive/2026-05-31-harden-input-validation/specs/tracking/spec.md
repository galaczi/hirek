## MODIFIED Requirements

### Requirement: Click Redirect Tracking

The system SHALL record click events before redirecting users to article canonical URLs, storing normalized and bounded metadata when present.

#### Scenario: Valid article click

- **WHEN** a user requests a valid active article redirect
- **THEN** a click event is recorded with article, source, category, normalized referrer, normalized user agent, IP hash, UTM, bot, and uniqueness metadata

#### Scenario: Non-bot click

- **WHEN** the click is not classified as bot traffic
- **THEN** the article click score is incremented

#### Scenario: Raw metadata exceeds bounds

- **WHEN** a click request includes blank or oversized raw referrer or user-agent metadata
- **THEN** the system stores a normalized bounded value or `null` instead of persisting the raw unbounded string

### Requirement: Impression Batch Tracking

The system SHALL record impression events for active articles in bounded batches using normalized and bounded request metadata.

#### Scenario: Impression payload is accepted

- **WHEN** a payload includes valid positive article ids
- **THEN** up to 100 unique article ids are considered for insertion
- **AND** accepted page-path metadata is normalized before storage

#### Scenario: No active articles match

- **WHEN** no active articles match the submitted ids
- **THEN** the endpoint returns success with zero inserted impressions

#### Scenario: Impression metadata exceeds bounds

- **WHEN** an impression payload or request headers include blank or oversized page-path, referrer, or user-agent metadata
- **THEN** the system stores a normalized bounded value or `null` instead of persisting the raw unbounded string

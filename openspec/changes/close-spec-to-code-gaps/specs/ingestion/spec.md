## ADDED Requirements

### Requirement: Approval State Gating
The system SHALL use the dedicated source approval state to gate feed discovery, feed configuration, feed scheduling, and direct feed ingestion.

#### Scenario: Approved source needs feed discovery
- **WHEN** feed discovery scans sources that are missing active feeds
- **THEN** only sources whose approval state is approved are considered

#### Scenario: Pending source has active feed records
- **WHEN** feed scheduling scans active feeds for queued ingestion
- **THEN** feeds belonging to sources whose approval state is pending or rejected are excluded

#### Scenario: Direct ingestion is requested for a non-approved source
- **WHEN** ingestion runs for an active feed whose source approval state is pending or rejected
- **THEN** ingestion fails instead of fetching or upserting articles

### Requirement: Approved Source Configuration
The system SHALL allow feed and URL-rule configuration only for approved sources.

#### Scenario: Admin or partner manages configuration for approved source
- **WHEN** a feed or URL-rule management action targets an approved source
- **THEN** the action is allowed subject to the caller's existing permissions

#### Scenario: Configuration action targets pending or rejected source
- **WHEN** a feed or URL-rule management action targets a source that is not approved
- **THEN** the action is rejected

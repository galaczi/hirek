## ADDED Requirements

### Requirement: Partner Attribution Settings Validation

The system SHALL validate and normalize partner-managed attribution settings before storing them for outbound tracking.

#### Scenario: Valid attribution settings are saved

- **WHEN** a partner or admin for an approved source submits valid `utm_source`, `utm_medium`, and `utm_campaign` values
- **THEN** the system stores the trimmed validated values for that source

#### Scenario: Invalid attribution settings are rejected

- **WHEN** a partner or admin submits an attribution value that is empty after normalization, exceeds the supported length, or fails the accepted token format
- **THEN** the system rejects the update
- **AND** the previously stored attribution settings remain unchanged

# Partner Reporting Specification

## Purpose

Partner reporting shows source owners and admins traffic performance, feed health, category performance, and configurable attribution settings.

## Requirements

### Requirement: Partner Access Scope

The system SHALL scope partner reporting to the signed-in partner user's assigned source unless the user is an admin.

#### Scenario: Partner has assigned source

- **WHEN** a partner user opens partner reporting
- **THEN** reporting is limited to the user's assigned source

#### Scenario: Admin has no selected source

- **WHEN** an admin opens partner reporting without selecting a source
- **THEN** the system returns the available source list instead of source-specific metrics

### Requirement: Reporting Windows

The system SHALL support reporting windows of 7, 30, and 90 days.

#### Scenario: Invalid reporting window

- **WHEN** an unsupported reporting window is requested
- **THEN** the default reporting window is used

### Requirement: Bot-Aware Metrics

The system SHALL distinguish raw, bot, non-bot, and unique click counts in partner reports.

#### Scenario: Source metrics are loaded

- **WHEN** source metrics are calculated
- **THEN** non-bot clicks, raw clicks, bot clicks, and unique clicks are available where applicable

### Requirement: Partner Commercial Status

The system SHALL expose source approval state and assigned package state in partner-facing reporting flows.

#### Scenario: Partner opens a pending source

- **WHEN** a partner opens the portal for a source that is still awaiting approval
- **THEN** the portal shows the submission and approval state instead of an ambiguous empty reporting view

#### Scenario: Partner opens an approved source

- **WHEN** a partner opens the portal for an approved source
- **THEN** the portal shows both reporting data and the source's assigned package state

#### Scenario: Admin reviews partner source state

- **WHEN** an admin opens partner-facing source details
- **THEN** the system exposes the source's current approval and package state for management

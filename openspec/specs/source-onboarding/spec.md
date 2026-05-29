# Source Onboarding Specification

## Purpose

Source onboarding defines how sources enter the system through curated bootstrap, direct admin setup, and partner-submitted approval flows.

## Requirements

### Requirement: Curated Source Bootstrap

The system SHALL allow admins to bootstrap the source registry from a curated seed list without making third-party discovery a required runtime behavior of the app.

#### Scenario: Admin imports a curated seed list

- **WHEN** an admin runs a curated seed import
- **THEN** the system creates or updates sources and any provided feed metadata without creating duplicate sources

#### Scenario: Seed import is rerun

- **WHEN** an admin reruns the same curated seed import
- **THEN** the system updates existing matching sources instead of creating conflicting duplicates

### Requirement: Partner Source Submission

The system SHALL allow a partner to sign up and submit a source for approval.

#### Scenario: Partner submits a new source

- **WHEN** a partner provides the required source details
- **THEN** the system records the submission, links it to the submitting partner, and marks it as awaiting admin review

#### Scenario: Required details are missing

- **WHEN** a partner submits an incomplete source request
- **THEN** the system rejects the submission and explains which required details are missing

### Requirement: Admin Source Approval

The system SHALL require admin approval before a partner-submitted source becomes eligible for ingestion and partner-facing reporting workflows.

#### Scenario: Admin approves a submitted source

- **WHEN** an admin approves a pending source submission
- **THEN** the source becomes eligible for feed configuration, URL-to-category rules, and ingestion readiness checks

#### Scenario: Admin rejects a submitted source

- **WHEN** an admin rejects a pending source submission
- **THEN** the system keeps the source out of ingestion scheduling and records the rejection state for partner visibility

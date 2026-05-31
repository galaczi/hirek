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

The system SHALL allow a partner to sign up and submit a source for approval using validated and normalized account and source details.

#### Scenario: Partner submits a new source

- **WHEN** a partner provides a contact name, a unique email address, a password that meets policy, a source name, a valid slug, and a valid unique domain
- **THEN** the system creates the partner account
- **AND** stores the source with normalized canonical identifiers
- **AND** links the created source to the new partner user
- **AND** marks the source as awaiting admin review

#### Scenario: Required details are missing

- **WHEN** a partner submits the onboarding form without one or more required account or source fields
- **THEN** the system rejects the submission and explains which required details are missing

#### Scenario: Invalid or duplicate details are submitted

- **WHEN** a partner submits an email, password, slug, or domain that fails validation or a canonical email, slug, or domain that already exists
- **THEN** the system rejects the submission
- **AND** no partner account or source is created from the invalid request

### Requirement: Admin Source Approval

The system SHALL require admin approval before a partner-submitted source becomes eligible for ingestion and partner-facing reporting workflows.

#### Scenario: Admin approves a submitted source

- **WHEN** an admin approves a pending source submission
- **THEN** the source becomes eligible for feed configuration, URL-to-category rules, and ingestion readiness checks

#### Scenario: Admin rejects a submitted source

- **WHEN** an admin rejects a pending source submission
- **THEN** the system keeps the source out of ingestion scheduling and records the rejection state for partner visibility

### Requirement: Commercial Starting State
The system SHALL assign a defined commercial starting state to partner-submitted sources during onboarding.

#### Scenario: Partner submits a new source
- **WHEN** a partner completes a source submission
- **THEN** the system records the source with a non-active commercial starting state that can later be reviewed by admins

#### Scenario: Admin reviews submitted source
- **WHEN** an admin opens a newly submitted source
- **THEN** the source's initial commercial state is visible together with its editorial approval state

### Requirement: Commercial Activation After Approval
The system SHALL require an explicit package path before a partner-submitted source is treated as commercially active after approval.

#### Scenario: Approved source receives default package
- **WHEN** an admin approves a partner-submitted source without a bespoke commercial plan
- **THEN** the system assigns the source to the default package path for newly approved partners

#### Scenario: Approved source receives upgraded package
- **WHEN** an admin approves or later updates a source with a higher package path
- **THEN** the source's commercial activation reflects that assigned package in later admin and partner workflows

### Requirement: Dedicated Partner Onboarding Route
The system SHALL provide a dedicated public onboarding route for partner account creation and source submission.

#### Scenario: Partner completes onboarding
- **WHEN** a visitor submits valid partner account details together with a source name, slug, and domain on the onboarding route
- **THEN** the system creates a partner account
- **AND** creates the submitted source in a pending approval state
- **AND** links the created source to the new partner user
- **AND** signs the partner in and redirects them to the partner portal

#### Scenario: Duplicate source or email
- **WHEN** the onboarding route is submitted with a source slug, source domain, or partner email that already exists
- **THEN** the system rejects the submission
- **AND** explains which field conflicts with an existing record

### Requirement: Separate Approval Lifecycle
The system SHALL track source approval independently from the operational source status.

#### Scenario: Existing admin-managed sources are migrated
- **WHEN** the approval lifecycle change is introduced
- **THEN** existing curated, bootstrap, and admin-managed sources are marked approved by default

#### Scenario: Partner source is rejected
- **WHEN** an admin rejects a partner-submitted source
- **THEN** the source approval state is recorded as rejected
- **AND** the source remains ineligible for ingestion and partner analytics


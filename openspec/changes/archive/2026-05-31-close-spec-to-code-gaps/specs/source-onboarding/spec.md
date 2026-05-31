## ADDED Requirements

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

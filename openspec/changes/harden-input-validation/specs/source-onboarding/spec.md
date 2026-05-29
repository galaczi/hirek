## MODIFIED Requirements

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

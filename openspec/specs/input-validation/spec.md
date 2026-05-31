# input-validation Specification

## Purpose
TBD - created by archiving change harden-input-validation. Update Purpose after archive.
## Requirements
### Requirement: Shared Server-Side Validation

The system SHALL validate write-path payloads with shared server-side validation rules before persisting data or calling downstream auth or database services.

#### Scenario: Invalid write payload is rejected

- **WHEN** a registration, source-management, partner-settings, or tracking payload fails shared validation
- **THEN** the system rejects the request before any account, source, feed, rule, settings, click, or impression write occurs

#### Scenario: Valid write payload is normalized before use

- **WHEN** a write-path payload passes shared validation
- **THEN** the system passes normalized values to downstream auth and database operations

### Requirement: Canonical Source Identifiers

The system SHALL normalize source identifiers consistently across partner and admin write paths.

#### Scenario: Equivalent domains converge to one canonical value

- **WHEN** a user submits semantically equivalent source domains such as mixed-case, scheme-prefixed, `www.`-prefixed, or trailing-slash variants
- **THEN** the system normalizes them to the same lowercase host-only canonical domain before comparison and storage

#### Scenario: Invalid slug or domain is rejected

- **WHEN** a submitted source slug or domain cannot be normalized into the accepted canonical format
- **THEN** the system rejects the request and explains that the source identifier is invalid

### Requirement: Password Policy

The system SHALL enforce an application-defined password policy for email/password account creation.

#### Scenario: Password meets policy

- **WHEN** a signup password is at least 12 characters long and includes at least one letter and one number
- **THEN** the system accepts the password as valid input

#### Scenario: Password fails policy

- **WHEN** a signup password is shorter than 12 characters or lacks either a letter or a number
- **THEN** the system rejects the signup request and explains that the password does not meet policy

### Requirement: Unique Canonical Source Domains

The system SHALL enforce uniqueness of canonical source domains at the database layer.

#### Scenario: Partner flow submits a conflicting domain variant

- **WHEN** a partner submits a source domain whose canonical form matches an existing source
- **THEN** the system rejects the submission instead of creating a duplicate source

#### Scenario: Admin flow submits a conflicting domain variant

- **WHEN** an admin creates or updates a source domain whose canonical form matches an existing source
- **THEN** the system rejects the change instead of persisting conflicting source identity


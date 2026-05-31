## ADDED Requirements

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

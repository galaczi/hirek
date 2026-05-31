## ADDED Requirements

### Requirement: Commercial Package Administration
The system SHALL let admins manage each source's commercial package state independently from editorial approval and feed configuration.

#### Scenario: Admin updates package settings
- **WHEN** an admin changes a source's package, traffic target, or exchange enrollment
- **THEN** the source's commercial settings are saved without requiring unrelated source fields to change

#### Scenario: Admin reviews a source
- **WHEN** an admin opens source management for a partner-affiliated source
- **THEN** the page exposes the current package, traffic target status, and exchange participation state alongside approval and operational status

### Requirement: Commercial Eligibility Controls
The system SHALL prevent admins from representing a source as commercially active before the source is approved for partner workflows.

#### Scenario: Source is still pending approval
- **WHEN** an admin reviews a pending or rejected partner-submitted source
- **THEN** the admin can see proposed commercial defaults
- **AND** the system does not treat the source as fully commercially active until approval is complete

#### Scenario: Source is approved
- **WHEN** an admin approves a source and assigns a package
- **THEN** the source becomes eligible for the package-related reporting and partner-facing commercial context defined by that assignment

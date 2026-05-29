## ADDED Requirements

### Requirement: Approval State View
The system SHALL show source approval and package state before partner analytics become available.

#### Scenario: Pending or rejected source opens portal
- **WHEN** a partner or admin opens the portal for a source whose approval state is pending or rejected
- **THEN** the portal shows the source approval state and assigned package state
- **AND** the analytics, CSV export, UTM configuration, and URL-rule management panels are hidden

#### Scenario: Approved source opens portal
- **WHEN** a partner or admin opens the portal for a source whose approval state is approved
- **THEN** the portal shows analytics and configuration panels together with the source approval state and assigned package state

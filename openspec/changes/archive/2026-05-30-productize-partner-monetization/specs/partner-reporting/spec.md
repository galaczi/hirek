## ADDED Requirements

### Requirement: Package Context In Reporting
The system SHALL show partner-facing commercial package context alongside analytics for approved sources.

#### Scenario: Partner opens approved source reporting
- **WHEN** a partner opens the portal for an approved source
- **THEN** the portal shows the source's current package and commercial state before or alongside detailed traffic analytics

#### Scenario: Admin opens partner reporting
- **WHEN** an admin reviews a source through partner-facing reporting flows
- **THEN** the reporting view exposes the same package context used in admin commercial management

### Requirement: Traffic Target Progress Visibility
The system SHALL expose progress toward configured traffic targets when a source has a commercial traffic commitment.

#### Scenario: Source has configured target
- **WHEN** the reporting window is loaded for a source with a traffic target
- **THEN** the portal shows the target and the measured progress for that period using tracked click metrics

#### Scenario: Source has no configured target
- **WHEN** the reporting window is loaded for a source without a traffic target
- **THEN** the portal does not show an implied progress state for a missing target

### Requirement: Exchange Program Visibility
The system SHALL expose exchange-program participation and availability in partner-facing reporting when relevant.

#### Scenario: Source is enrolled in exchange program
- **WHEN** a partner opens reporting for an exchange-enrolled source
- **THEN** the portal shows that the source participates in the exchange program and can surface any related status notes or obligations

#### Scenario: Source is not enrolled in exchange program
- **WHEN** a partner opens reporting for a source that is not in the exchange program
- **THEN** the portal does not imply that exchange-based benefits are active

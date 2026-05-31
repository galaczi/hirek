## MODIFIED Requirements

### Requirement: Package Context In Reporting
The system SHALL show source acquisition controls and balance state alongside package context for approved sources.

#### Scenario: Partner opens approved source reporting
- **WHEN** a partner opens reporting for an approved source
- **THEN** the portal shows wallet balance, exchange credit, trust score, boost state, route targets, max CPC, and daily spend cap before or alongside detailed traffic analytics

### Requirement: Traffic Target Progress Visibility
The system SHALL expose spend and delivery performance in addition to traffic targets when a source participates in paid or exchange boost.

#### Scenario: Route performance is available
- **WHEN** the reporting window is loaded for a boosted source
- **THEN** the portal shows route-level delivery, acquisition mode, spend, ledger history, and recent invoice history using tracked click and billing data

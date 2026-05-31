# Partner Reporting Specification

## Purpose

Partner reporting shows source owners and admins traffic performance, feed health, category performance, and configurable attribution settings.
## Requirements
### Requirement: Partner Access Scope

The system SHALL scope partner reporting to the signed-in partner user's assigned source unless the user is an admin.

#### Scenario: Partner has assigned source

- **WHEN** a partner user opens partner reporting
- **THEN** reporting is limited to the user's assigned source

#### Scenario: Admin has no selected source

- **WHEN** an admin opens partner reporting without selecting a source
- **THEN** the system returns the available source list instead of source-specific metrics

### Requirement: Reporting Windows

The system SHALL support reporting windows of 7, 30, and 90 days.

#### Scenario: Invalid reporting window

- **WHEN** an unsupported reporting window is requested
- **THEN** the default reporting window is used

### Requirement: Human Click Metrics

The system SHALL report tracked human clicks and unique human clicks in partner reports.

#### Scenario: Source metrics are loaded

- **WHEN** source metrics are calculated
- **THEN** click totals and unique click totals are available where applicable

### Requirement: Partner Commercial Status

The system SHALL expose source approval state and assigned package state in partner-facing reporting flows.

#### Scenario: Partner opens a pending source

- **WHEN** a partner opens the portal for a source that is still awaiting approval
- **THEN** the portal shows the submission and approval state instead of an ambiguous empty reporting view

#### Scenario: Partner opens an approved source

- **WHEN** a partner opens the portal for an approved source
- **THEN** the portal shows both reporting data and the source's assigned package state

#### Scenario: Admin reviews partner source state

- **WHEN** an admin opens partner-facing source details
- **THEN** the system exposes the source's current approval and package state for management

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

### Requirement: Exchange Program Visibility
The system SHALL expose exchange-program participation and availability in partner-facing reporting when relevant.

#### Scenario: Source is enrolled in exchange program
- **WHEN** a partner opens reporting for an exchange-enrolled source
- **THEN** the portal shows that the source participates in the exchange program and can surface any related status notes or obligations

#### Scenario: Source is not enrolled in exchange program
- **WHEN** a partner opens reporting for a source that is not in the exchange program
- **THEN** the portal does not imply that exchange-based benefits are active

### Requirement: Partner Reporting Hierarchy
The system SHALL organize partner reporting so that source context, reporting window controls, export actions, and high-signal summaries appear before detailed analytics breakdowns.

#### Scenario: Approved source opens partner portal
- **WHEN** a partner or admin opens the portal for an approved source
- **THEN** the page shows source context, selected reporting window, and key summary metrics before category or traffic breakdown sections

#### Scenario: Admin opens partner reporting for source selection
- **WHEN** an admin opens the partner portal without a selected source
- **THEN** the source selection view uses the same shared dashboard hierarchy and status cues as the rest of the portal

### Requirement: Partner State Messaging
The system SHALL use dedicated partner-facing state views for unavailable analytics, sparse data, and other non-happy-path states.

#### Scenario: Source is pending or rejected
- **WHEN** a partner opens reporting for a source that is not yet approved
- **THEN** the portal shows a dedicated source-state view with approval and package context instead of an ambiguous low-data report

#### Scenario: Analytics section has no breakdown data
- **WHEN** a partner report has no category or traffic-source data for the selected window
- **THEN** the affected section shows a dedicated empty state that explains why the breakdown is empty

### Requirement: Responsive Partner Analytics Presentation
The system SHALL keep reporting controls and analytics sections readable on narrow viewports without hiding the reporting period, labels, or key values.

#### Scenario: Partner report is viewed on a narrow viewport
- **WHEN** a partner opens the reporting portal on a narrow viewport
- **THEN** the reporting window controls, export action, summary metrics, and analytics sections adapt into a readable compact layout

#### Scenario: Analytics comparison list is rendered
- **WHEN** the portal shows time-series, category, or traffic-source comparisons
- **THEN** labels, click counts, and unique counts remain visibly associated with each row in the responsive layout

### Requirement: Partner Attribution Settings Validation

The system SHALL validate and normalize partner-managed attribution settings before storing them for outbound tracking.

#### Scenario: Valid attribution settings are saved

- **WHEN** a partner or admin for an approved source submits valid `utm_source`, `utm_medium`, and `utm_campaign` values
- **THEN** the system stores the trimmed validated values for that source

#### Scenario: Invalid attribution settings are rejected

- **WHEN** a partner or admin submits an attribution value that is empty after normalization, exceeds the supported length, or fails the accepted token format
- **THEN** the system rejects the update
- **AND** the previously stored attribution settings remain unchanged

### Requirement: Approval State View
The system SHALL show source approval and package state before partner analytics become available.

#### Scenario: Pending or rejected source opens portal
- **WHEN** a partner or admin opens the portal for a source whose approval state is pending or rejected
- **THEN** the portal shows the source approval state and assigned package state
- **AND** the analytics, CSV export, UTM configuration, and URL-rule management panels are hidden

#### Scenario: Approved source opens portal
- **WHEN** a partner or admin opens the portal for a source whose approval state is approved
- **THEN** the portal shows analytics and configuration panels together with the source approval state and assigned package state

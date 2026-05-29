## ADDED Requirements

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

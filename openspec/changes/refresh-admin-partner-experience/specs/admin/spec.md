## ADDED Requirements

### Requirement: Admin Page Information Hierarchy
The system SHALL organize each primary admin page so that context, summary signals, and primary actions appear before detailed forms or long collections.

#### Scenario: Admin dashboard is opened
- **WHEN** an admin opens `/admin/`
- **THEN** the page highlights launch readiness and key operational totals before the full source registry list

#### Scenario: Source detail page is opened
- **WHEN** an admin opens an individual source detail page
- **THEN** the page surfaces source identity, approval state, operational state, and primary actions before feed and rule management sections

### Requirement: Shared Admin Collection Patterns
The system SHALL present the sources index, article moderation list, and ingestion summaries through shared collection patterns for filters, counts, statuses, pagination, and empty states.

#### Scenario: Admin collection page has results
- **WHEN** an admin opens the sources index or article moderation page with matching results
- **THEN** the filters, active result range, item statuses, and primary row action are presented through the shared admin collection pattern

#### Scenario: Admin collection page has no results
- **WHEN** an admin applies filters that return no results
- **THEN** the page shows a dedicated empty state with enough context to retry or clear the filters

### Requirement: Admin Operational State Clarity
The system SHALL visually distinguish approval state, operational health, errors, and next actions on source-management and ingestion pages.

#### Scenario: Source has multiple states to communicate
- **WHEN** an admin reviews a source that has approval state, operational status, and a note or error
- **THEN** the page presents those states as separate, readable signals rather than collapsing them into one ambiguous line

#### Scenario: Ingestion page is opened
- **WHEN** an admin opens `/admin/ingestion/`
- **THEN** feed health, job health, and queue actions are grouped into clear operational sections before the recent jobs listing

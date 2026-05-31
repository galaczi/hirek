# Admin Specification

## Purpose

Admin surfaces let trusted users manage sources, feeds, categorization rules, and article metadata.
## Requirements
### Requirement: Admin Authorization

The system SHALL require an authenticated admin user for admin-only routes and actions.

#### Scenario: Non-admin user accesses admin functionality

- **WHEN** a signed-in user without the `admin` role accesses admin-only functionality
- **THEN** the system responds with a forbidden error

### Requirement: Source Management

The system SHALL let admins manage source identity, status, feeds, and URL category rules using validated and normalized inputs.

#### Scenario: Source is created

- **WHEN** an admin submits a source name, a valid slug, a valid unique domain, and a valid feed URL
- **THEN** the system creates the source with canonical slug and domain values
- **AND** creates or reactivates the submitted feed for that source

#### Scenario: Source details are updated

- **WHEN** an admin submits a source name, a valid slug, and a valid unique domain for an existing source
- **THEN** the system stores the updated source details using canonical slug and domain values

#### Scenario: Invalid source identity is rejected

- **WHEN** an admin submits a slug or domain that fails validation or a canonical domain that already belongs to a different source
- **THEN** the system rejects the source change and preserves the existing source details

#### Scenario: Feed is added

- **WHEN** an admin adds a valid absolute HTTP or HTTPS feed URL for a source
- **THEN** the feed is created or reactivated for that source

#### Scenario: Invalid feed URL is rejected

- **WHEN** an admin submits a feed URL that is missing, malformed, or uses an unsupported scheme
- **THEN** the system rejects the feed change

#### Scenario: URL category rule is added

- **WHEN** an admin adds a valid normalized URL pattern and category for a source
- **THEN** future categorization can use that source-specific rule

#### Scenario: Invalid URL category rule is rejected

- **WHEN** an admin submits an empty or malformed URL pattern
- **THEN** the system rejects the rule change

### Requirement: Commercial Package Administration
The system SHALL let admins manage source acquisition settings together with legacy commercial state from source detail pages.

#### Scenario: Admin updates acquisition settings
- **WHEN** an admin saves trust, boost status, route targets, CPC, daily cap, or exchange credit values
- **THEN** the source acquisition settings are persisted without requiring unrelated source fields to change

#### Scenario: Admin reviews delivery status
- **WHEN** an admin opens source management for a partner-affiliated source
- **THEN** the page shows trust, boost state, route targeting, wallet/exchange balances, and lifetime billable delivery next to approval and package context

### Requirement: Commercial Eligibility Controls
The system SHALL prevent admins from representing a source as commercially active before the source is approved for partner workflows.

#### Scenario: Source is still pending approval
- **WHEN** an admin reviews a pending or rejected partner-submitted source
- **THEN** the admin can see proposed commercial defaults
- **AND** the system does not treat the source as fully commercially active until approval is complete

#### Scenario: Source is approved
- **WHEN** an admin approves a source and assigns a package
- **THEN** the source becomes eligible for the package-related reporting and partner-facing commercial context defined by that assignment

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


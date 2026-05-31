## ADDED Requirements

### Requirement: Homepage-Aligned Internal Visual Language
The system SHALL use one shared internal visual language for admin and partner surfaces that aligns with the homepage brand tokens, typography, depth, spacing, and interaction states.

#### Scenario: Internal surface is rendered
- **WHEN** a user opens an admin or partner page
- **THEN** the page uses the shared internal visual language instead of page-specific styling that feels unrelated to the homepage

#### Scenario: Interactive controls are displayed
- **WHEN** an internal page shows navigation links, filters, buttons, tabs, or status badges
- **THEN** those controls use consistent hover, focus, active, and disabled treatments across admin and partner surfaces

### Requirement: Shared Internal Shell
The system SHALL render admin and partner routes inside a shared internal shell that exposes current section context, primary navigation, and page-level summary content before detailed tools.

#### Scenario: Admin route is opened
- **WHEN** a user opens any `/admin/*` route
- **THEN** the page renders inside the shared internal shell
- **AND** the current admin section is clearly identified within that shell

#### Scenario: Partner route is opened
- **WHEN** a user opens `/partner/`
- **THEN** the page renders inside the same internal shell family
- **AND** partner-specific actions and context are exposed without switching to the public homepage navigation model

### Requirement: Responsive Operational Data Patterns
The system SHALL present metrics, dense collections, and empty states through shared responsive patterns that remain readable on both desktop and narrow viewports.

#### Scenario: Dense collection is shown on a narrow viewport
- **WHEN** an admin or partner page displays a table-like collection on a narrow viewport
- **THEN** the page adapts that collection into a responsive presentation that preserves each item's labels, statuses, values, and actions

#### Scenario: Collection has no rows or is intentionally unavailable
- **WHEN** an internal page has no records to show or hides a section because the current state blocks it
- **THEN** the page shows a shared empty or blocked state with a clear explanation instead of leaving blank space or an ambiguous partial layout

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

The system SHALL let admins manage source identity, status, feeds, and URL category rules.

#### Scenario: Source details are updated

- **WHEN** an admin submits a source name, slug, and domain
- **THEN** the source details are updated

#### Scenario: Feed is added

- **WHEN** an admin adds a feed URL for a source
- **THEN** the feed is created or reactivated for that source

#### Scenario: URL category rule is added

- **WHEN** an admin adds a URL pattern and category for a source
- **THEN** future categorization can use that source-specific rule


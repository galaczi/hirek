## MODIFIED Requirements

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

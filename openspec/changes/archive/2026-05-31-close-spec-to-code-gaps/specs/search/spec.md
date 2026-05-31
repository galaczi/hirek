## ADDED Requirements

### Requirement: Dedicated Public Search Route Filters
The system SHALL support dedicated public search queries and filters on `/kereses` while using the shared public search pipeline.

#### Scenario: Search route uses query parameters
- **WHEN** a user loads `/kereses` with `q`, `source`, `category`, or `time` query parameters
- **THEN** the public search pipeline uses those filters without redirecting the user to a homepage-style source or category route

#### Scenario: Search route uses seven-day filter
- **WHEN** a user searches on `/kereses` with `time=7d`
- **THEN** only results published within the last seven days are returned

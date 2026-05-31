## ADDED Requirements

### Requirement: Dedicated Search Shell Parity
The system SHALL render the dedicated public search route inside the shared public shell used by homepage-style public routes.

#### Scenario: User opens dedicated search route
- **WHEN** a user loads `/kereses`
- **THEN** the page uses the same shared header, navigation, and public stream shell as the homepage

### Requirement: Public Stream Seven-Day Filter
The system SHALL support the `7d` time filter consistently across public homepage streams, dedicated public search, and live article matching.

#### Scenario: User selects seven-day filter on a public stream
- **WHEN** a public stream is filtered with `7d`
- **THEN** only articles published within the last seven days remain visible

#### Scenario: Live article is evaluated against seven-day filter
- **WHEN** a live article event arrives while the active public stream filter is `7d`
- **THEN** the event is inserted only if the article falls within the seven-day window and matches the rest of the active filters

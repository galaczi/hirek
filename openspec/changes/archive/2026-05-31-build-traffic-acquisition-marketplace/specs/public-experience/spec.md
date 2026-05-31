## MODIFIED Requirements

### Requirement: Shared Public Shell
The system SHALL rank articles for all public list surfaces with the marketplace-aware scorer.

#### Scenario: Public list surface is loaded
- **WHEN** a user loads the homepage, top list, source page, category page, or source+category page
- **THEN** article ordering reflects editorial relevance plus trust-weighted paid or exchange boost contributions for eligible sources

### Requirement: Public Link Target Behavior
The system SHALL preserve the acquisition surface and selected delivery mode when redirecting outbound article clicks.

#### Scenario: User opens an article from a public list
- **WHEN** a user clicks an outbound article on a public list surface
- **THEN** the redirect request includes the originating surface and delivery mode so billing and reporting can attribute the click correctly

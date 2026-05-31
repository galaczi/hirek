## MODIFIED Requirements

### Requirement: Commercial Package Administration
The system SHALL let admins manage source acquisition settings together with legacy commercial state from source detail pages.

#### Scenario: Admin updates acquisition settings
- **WHEN** an admin saves trust, boost status, route targets, CPC, daily cap, or exchange credit values
- **THEN** the source acquisition settings are persisted without requiring unrelated source fields to change

#### Scenario: Admin reviews delivery status
- **WHEN** an admin opens source management for a partner-affiliated source
- **THEN** the page shows trust, boost state, route targeting, wallet/exchange balances, and lifetime billable delivery next to approval and package context

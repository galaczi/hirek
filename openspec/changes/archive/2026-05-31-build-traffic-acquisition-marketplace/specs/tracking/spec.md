## MODIFIED Requirements

### Requirement: Click Redirect Tracking
The system SHALL record acquisition surface, acquisition mode, and charge amount for tracked outbound clicks.

#### Scenario: Billable human click
- **WHEN** a unique non-bot click is eligible for paid or exchange delivery
- **THEN** the click event records the acquisition mode, the originating public surface, and the charged amount
- **AND** the source wallet or exchange credit balance is decremented accordingly

#### Scenario: Non-billable click
- **WHEN** the click is bot traffic, a duplicate click, or the source has no spend capacity
- **THEN** the click event is still recorded for analytics
- **AND** the acquisition mode falls back to organic with no charge

### Requirement: Impression Batch Tracking
The system SHALL record the originating public surface for impression batches.

#### Scenario: Impression payload is accepted
- **WHEN** the client submits visible article ids for a public route
- **THEN** each inserted impression event stores the resolved public surface for later CTR and route-performance calculations

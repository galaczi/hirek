# Ingestion Specification

## Purpose

Ingestion imports RSS feed items into canonical articles, assigns categories, updates search indexes, and publishes live article events.

## Requirements

### Requirement: Active Feed Ingestion

The system SHALL ingest only feeds whose status is `active` and whose source is approved for ingestion.

#### Scenario: Active approved feed exists

- **WHEN** ingestion runs for an active feed id whose source is approved for ingestion
- **THEN** the feed URL is fetched with the hirek.hu ingestion user agent

#### Scenario: Feed is missing or inactive

- **WHEN** ingestion runs for a feed id that is not active
- **THEN** ingestion fails instead of creating articles

#### Scenario: Source is not approved for ingestion

- **WHEN** ingestion runs for a feed id whose source is not approved for ingestion
- **THEN** ingestion fails instead of creating articles

### Requirement: Approved Feed Scheduling

The system SHALL enqueue only active feeds that belong to sources approved for ingestion.

#### Scenario: Worker schedules feed jobs

- **WHEN** the ingestion scheduler scans available feeds
- **THEN** it enqueues only feeds that are active and belong to approved ingestible sources

#### Scenario: Pending or rejected source has an active feed record

- **WHEN** a source is not approved for ingestion
- **THEN** its feeds are excluded from scheduled ingestion even if the feed record itself is marked active

### Requirement: Article Upsert By Canonical URL

The system SHALL canonicalize incoming RSS item URLs and upsert articles by canonical URL.

#### Scenario: Tracking parameters are removed

- **WHEN** an RSS item URL contains `utm_` query parameters
- **THEN** those parameters are removed before storing the canonical URL

#### Scenario: Existing article is found

- **WHEN** an RSS item has a canonical URL already present in the database
- **THEN** the existing article title, excerpt, publication time, active flag, and update time are refreshed

### Requirement: Category Assignment Precedence

The system SHALL assign categories using article overrides first, then source URL rules, then inferred rules with feed fallback.

#### Scenario: Article override exists

- **WHEN** an article has an explicit category override
- **THEN** that override determines the article categories

#### Scenario: No article override exists

- **WHEN** no article override exists
- **THEN** source URL rules are evaluated before title, excerpt, URL, and feed fallback inference

### Requirement: Search And Live Updates

The system SHALL update the article search index for ingested items and publish live events for newly inserted articles.

#### Scenario: Ingestion completes

- **WHEN** feed ingestion finishes processing items
- **THEN** search documents are indexed and newly inserted articles are published as live article events

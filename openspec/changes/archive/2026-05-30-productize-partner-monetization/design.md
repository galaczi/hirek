## Context

The current product already contains most of the mechanics needed for a publisher-facing traffic marketplace: source onboarding, admin approval, outbound click tracking, partner-scoped reporting, and a basic `partnerPackage` field on sources. What is missing is a coherent commercial model that defines what each package means, when a source becomes eligible for a package, how admins manage those states, and what partners can expect to see in the portal.

This change needs to span schema, admin workflows, partner reporting, and OpenSpec capability boundaries. It also needs clear constraints because the repo does not currently include payment processing, CRM synchronization, contract management, or an ad-serving stack. The stakeholders are product, operations/sales, admins who manage sources, and partner publishers who need a credible explanation of what they are getting from the platform.

## Goals / Non-Goals

**Goals:**
- Turn the implied partner package model into explicit product behavior with named package tiers and documented entitlements.
- Define a default commercial lifecycle from source submission through approval, package assignment, and growth-oriented upgrades.
- Expose commercial context in admin and partner reporting so package status is actionable rather than decorative.
- Support a reciprocal content-exchange program as an optional package mechanic without requiring billing infrastructure.

**Non-Goals:**
- Building payment collection, invoicing, subscription renewals, or contract signature flows.
- Defining reader-facing monetization such as paywalls, subscriptions, or premium consumer features.
- Implementing on-site ad inventory, campaign trafficking, or ad performance reporting.
- Guaranteeing delivery through complex pacing or inventory allocation logic in this phase.

## Decisions

### Decision: Treat monetization as package operations, not billing
The system will model monetization through package metadata, package states, traffic targets, and exchange obligations on each source. This keeps the change aligned with the current codebase, where the platform already measures traffic value but does not process money.

Alternatives considered:
- Add payment/billing requirements now: rejected because it would over-spec infrastructure that the product does not yet have.
- Keep package meanings informal: rejected because it would preserve the current ambiguity and make future implementation inconsistent.

### Decision: Use a small fixed package catalog
The design will formalize three package paths that map well to the existing product direction: `free`, `partner`, and `growth`, with content exchange represented as an optional program that can augment eligible sources rather than as a separate payment rail.

Alternatives considered:
- Introduce many bespoke packages: rejected because it adds complexity before the commercial model is validated.
- Make content exchange a mandatory fourth package: rejected because it is better expressed as an eligibility-based overlay that can combine with existing paid or free distribution.

### Decision: Keep onboarding and commercial activation separate
Source approval will remain the gate for ingestion and partner reporting readiness, while commercial activation will define which package a source starts with after approval and whether it can participate in exchange or traffic-target programs.

Alternatives considered:
- Automatically grant premium package access on approval: rejected because approval confirms quality/safety, not commercial eligibility.
- Force package selection before approval: rejected because it mixes editorial trust review with commercial sales decisions.

### Decision: Extend partner reporting with package-performance context
The partner portal will expose package name, current commercial state, traffic target progress, and exchange-program status next to existing click analytics. This makes reporting useful as a commercial accountability surface rather than only an operational dashboard.

Alternatives considered:
- Keep reporting purely analytical and put package information only in admin: rejected because partners need to understand what they are receiving.
- Replace analytics with commercial summaries: rejected because traffic evidence is the product's core proof of value.

### Decision: Represent exchange participation through explicit source state
Content exchange will be modeled through source-level fields and requirements such as enrollment state, approved placement expectation, and compliance status. This allows admins to manage reciprocal distribution without building a widget-delivery platform in the same change.

Alternatives considered:
- Spec the embeddable widget implementation now: rejected because it is a later delivery mechanism, not the first-order commercial policy.
- Leave exchange unstructured: rejected because it is central to the benchmark model being adapted.

## Risks / Trade-offs

- [Commercial model is specified before pricing is finalized] → Mitigation: keep the spec focused on packages, states, and entitlements rather than hard-coded price points.
- [Package names may outlive the initial go-to-market experiment] → Mitigation: store package state as controlled values that can later be remapped or renamed with migration support.
- [Traffic targets could imply guaranteed delivery the system cannot yet enforce] → Mitigation: define traffic targets as tracked commitments and progress indicators, not automated pacing guarantees.
- [Exchange obligations may create operational burden] → Mitigation: track enrollment and compliance state explicitly so admins can manage it manually at first.
- [Adding more commercial fields can complicate admin UX] → Mitigation: group package controls into a dedicated commercial section instead of mixing them into feed/editorial forms.

## Migration Plan

1. Add or normalize source-level commercial fields needed for package state, traffic targets, and exchange participation.
2. Update admin source-management workflows to read and write the new commercial state.
3. Extend partner portal loaders and UI summaries to expose package and target/exchange context.
4. Preserve backward compatibility by mapping existing package defaults into the new catalog and defaulting unset commercial states safely.
5. Roll back by ignoring new commercial fields in UI and retaining the previous default-package behavior if needed.

## Open Questions

- Should `partner` and `growth` packages differ only by traffic target magnitude, or also by placement surfaces and reporting depth?
- Should content exchange be available to `free` sources, or only to approved sources that meet editorial and operational quality thresholds?
- Does the team want one commercial lifecycle field in addition to `approvalStatus`, or should package assignment itself imply lifecycle state?
- When pricing is later introduced, should it live inside the app or remain an offline sales/contract process backed by admin metadata only?

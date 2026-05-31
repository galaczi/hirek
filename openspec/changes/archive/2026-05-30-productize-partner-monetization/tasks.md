## 1. Commercial Data Model

- [x] 1.1 Audit the existing source commercial fields and decide which new normalized fields are needed for package state, traffic targets, and exchange enrollment.
- [x] 1.2 Add the required schema and migration changes for source-level commercial metadata while preserving safe defaults for existing sources.
- [x] 1.3 Update shared server-side types, loaders, and validation utilities to read and write the new commercial fields consistently.

## 2. Admin Commercial Controls

- [x] 2.1 Extend admin source-management loaders to expose package, traffic-target, and exchange-enrollment context for partner-affiliated sources.
- [x] 2.2 Add admin form actions and validation for updating a source's commercial package settings independently from feed or identity edits.
- [x] 2.3 Update the admin source-management UI to present approval state, package state, traffic targets, and exchange participation as one dedicated commercial section.

## 3. Onboarding And Partner Reporting

- [x] 3.1 Update partner-source onboarding and approval flows so newly submitted sources receive a defined commercial starting state and a default package path after approval.
- [x] 3.2 Extend partner portal loaders and summary data to expose package context, traffic-target progress, and exchange-program status.
- [x] 3.3 Update the partner reporting UI to surface the new commercial context without obscuring the existing analytics and source-state messaging.

## 4. Validation And Product Readiness

- [x] 4.1 Review labels, empty states, and status messaging so package names and exchange-program language are consistent across admin and partner views.
- [x] 4.2 Add or update tests for commercial-state validation, admin package updates, and partner reporting payload behavior where practical.
- [x] 4.3 Run `npm run spec:validate` and the relevant app checks after implementation changes are complete.

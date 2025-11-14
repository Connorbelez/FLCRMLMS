# Proposal: Add Mortgage as a Standard Object

## Why
- Many CRM deployments need to model long-lived loans or mortgages tied to people and companies, with first-class support for reporting, workflows, and attachments.
- Today, workspaces can approximate this with custom objects, but they lack the tight integration standard objects get (prefilled relations, consistent field IDs, search, and workflow friendliness).
- Introducing `Mortgage` as a standard object gives a stable, opinionated schema that works out-of-the-box across back-end, metadata, GraphQL, and front-end features.

## Current Behavior
- Standard objects are limited to entities like `Person`, `Company`, `Opportunity`, etc. No dedicated `Mortgage` domain object exists.
- Custom objects (see `packages/twenty-docs/developers/backend-development/custom-objects.mdx`) can be configured to mimic mortgages, but:
  - They do not ship with canonical field IDs or types for mortgage concepts (LTV, principal, interest rate, borrower).
  - They only get default relations to standard objects via generic helpers; there is no mortgage-specific relation suite.
  - There is no shared understanding across workspaces/instances of how a mortgage should look, which complicates integrations and workflows.

## What Changes
- Add a new standard object `Mortgage` with a full set of standard fields and relations:
  - Core business fields:
    - `name` (TEXT) – label for the record.
    - `principalAmount` (CURRENCY) – outstanding principal amount.
    - `interestRate` (NUMBER, percent) – nominal annual interest rate.
    - `ltv` (NUMBER, percent) – loan-to-value ratio.
    - `borrower` (MANY_TO_ONE → Person) – person who holds the mortgage.
  - Infrastructure fields:
    - `position` (POSITION), `createdBy` (ACTOR), `searchVector` (TS_VECTOR).
  - Full cross-object relation suite (modeled after `Opportunity`):
    - `favorites` (ONE_TO_MANY → Favorite)
    - `taskTargets` (ONE_TO_MANY → TaskTarget)
    - `noteTargets` (ONE_TO_MANY → NoteTarget)
    - `attachments` (ONE_TO_MANY → Attachment)
    - `timelineActivities` (ONE_TO_MANY → TimelineActivity)
- Wire `Mortgage` into the standard object infrastructure:
  - Add a static `mortgage` ID to `STANDARD_OBJECT_IDS`.
  - Add `MORTGAGE_STANDARD_FIELD_IDS` and register it in `STANDARD_OBJECT_FIELD_IDS`.
  - Assign an icon in `STANDARD_OBJECT_ICONS`.
  - Implement `MortgageWorkspaceEntity` in `src/modules/mortgage/standard-objects/`.
  - Generate and run a core DB migration for the new table + search vector.
- Ensure metadata and GraphQL generation treat `Mortgage` like other standard CRM objects so it:
  - Appears in the Settings → Data model UI.
  - Can be used in workflows (triggers/actions/filters) as an object type with its fields.
  - Can be used as a relation target from custom objects via default relation helpers.

## Impact
- **Back-end / Metadata / GraphQL**
  - New standard object and field IDs become part of the long-lived schema.
  - Workspace metadata sync and GraphQL generation include `Mortgage`, unlocking generic CRUD and filtering.
- **Front-end UX**
  - `Mortgage` appears in the data model configuration UI with its icon and labels.
  - `Mortgage` records can be listed and edited using the existing generic record views and field components (TEXT, NUMBER, CURRENCY, RELATION, etc.).
  - Workflow builders can create triggers on mortgage updates, filter by mortgage fields (e.g., high LTV), and update mortgages from workflow actions.
- **Integrations & Customization**
  - Custom objects gain canonical relation fields to `Mortgage` via the existing standard-object relation helpers.
  - Future integrations can rely on a stable mortgage schema instead of per-workspace custom object conventions.

## Out of Scope (for this change)
- No custom NestJS controllers, resolvers, or domain-specific services for mortgages beyond the generic metadata/GraphQL pipeline.
- No default dashboard widgets or graphs specifically for mortgages (those can be added later via views/dashboards).
- No feature flags around `Mortgage`—once deployed, it behaves like other standard objects.

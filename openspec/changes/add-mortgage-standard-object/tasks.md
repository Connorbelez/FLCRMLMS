# Tasks

## 1. Backend – Standard Object & Metadata

1. - [x] Add `STANDARD_OBJECT_IDS.mortgage` to `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-ids.ts` with a new, stable UUID.
2. - [x] Define `MORTGAGE_STANDARD_FIELD_IDS` (including name, principalAmount, interestRate, ltv, borrower, position, createdBy, favorites, taskTargets, noteTargets, attachments, timelineActivities, searchVector) in `standard-field-ids.ts` and register it under `STANDARD_OBJECT_FIELD_IDS.mortgage`.
3. - [x] Add an icon entry for `mortgage` in `STANDARD_OBJECT_ICONS` (e.g. `IconBuildingBank`) in `standard-object-icons.ts`.
4. - [x] Implement `MortgageWorkspaceEntity` in `packages/twenty-server/src/modules/mortgage/standard-objects/mortgage.workspace-entity.ts` with:
   - [x] Core fields (name, principalAmount, interestRate, ltv).
   - [x] Infrastructure fields (position, createdBy, searchVector).
   - [x] Borrower relation to `PersonWorkspaceEntity`.
   - [x] Full relation suite: favorites, taskTargets, noteTargets, attachments, timelineActivities.
5. - [x] Ensure `MortgageWorkspaceEntity` is wired so that workspace migrations create mortgage tables in workspace schemas (no separate core TypeORM table migration is required; creation is handled by the workspace-migration pipeline).
6. - [x] Run `workspace:sync-metadata` (or the appropriate workspace migration runner) in a real environment to generate and apply workspace-specific migrations that create `mortgage` tables in each workspace schema.

## 2. Frontend – Metadata-driven UX

7. - [x] Veify that `Mortgage` appears in the Settings → Data model UI with the configured icon, labels, and fields after metadata sync.
8. - [x] Confirm that generic record views render mortgage fields correctly using existing field components (TEXT, NUMBER, CURRENCY, RELATION).
9. - [x] Validate that workflow configuration UIs (triggers/actions/filters) offer `mortgage` as an object type and surface core mortgage fields in field selectors.

## 3. Validation & Follow-ups

10. - [ ] Add basic integration checks (manual or automated) that create, read, update, and delete mortgage records via GraphQL.
11. - [ ] Decide whether to add a default “All mortgages” core view in a follow-up change; if yes, plan a separate OpenSpec change for `mortgages-all.view` and related favorites.

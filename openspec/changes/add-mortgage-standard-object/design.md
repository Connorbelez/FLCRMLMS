# Design: Mortgage Standard Object

This design describes how to introduce a `Mortgage` standard object end to end, using existing patterns for `Person`, `Company`, and `Opportunity`.

## 1. Object Shape & Field Types

### 1.1 Canonical Fields

**Core business fields**
- `name` – `FieldMetadataType.TEXT`
  - Used as the label identifier in UI and metadata.
- `principalAmount` – `FieldMetadataType.CURRENCY` (`CurrencyMetadata | null`)
  - Represents the outstanding principal amount.
  - Follows existing currency field behavior (amountMicros + currencyCode).
- `interestRate` – `FieldMetadataType.NUMBER` (`number | null`)
  - Stored as a percentage (e.g. `2.75` for 2.75%).
  - Labels and descriptions explicitly state that the value is in percent.
- `ltv` – `FieldMetadataType.NUMBER` (`number | null`)
  - Loan-to-Value ratio stored as a percentage (e.g. `70` for 70%).
  - Descriptions clarify the unit.
- `borrower` – `RelationType.MANY_TO_ONE` → `PersonWorkspaceEntity`
  - Optional relation with join column `borrowerId: string | null`.

**Infrastructure fields**
- `position` – `FieldMetadataType.POSITION`, system field for ordering.
- `createdBy` – `FieldMetadataType.ACTOR`, UI read-only actor metadata.
- `searchVector` – `FieldMetadataType.TS_VECTOR` with a GIN index, computed from `name`.

### 1.2 Cross-object Relations (Full Suite)

Modeled after `Opportunity` (see `opportunity.workspace-entity.ts:80-142` and `OPPORTUNITY_STANDARD_FIELD_IDS`):

- `favorites` – ONE_TO_MANY → `FavoriteWorkspaceEntity`
  - StandardId: `MORTGAGE_STANDARD_FIELD_IDS.favorites`
  - System field. Opportunity uses this to drive “favorites linked to the record”.
- `taskTargets` – ONE_TO_MANY → `TaskTargetWorkspaceEntity`
  - StandardId: `MORTGAGE_STANDARD_FIELD_IDS.taskTargets`
  - UI read-only; tasks reference mortgages via task targets.
- `noteTargets` – ONE_TO_MANY → `NoteTargetWorkspaceEntity`
  - StandardId: `MORTGAGE_STANDARD_FIELD_IDS.noteTargets`
  - UI read-only; notes reference mortgages via note targets.
- `attachments` – ONE_TO_MANY → `AttachmentWorkspaceEntity`
  - StandardId: `MORTGAGE_STANDARD_FIELD_IDS.attachments`
  - System field; all file attachments linked to the mortgage.
- `timelineActivities` – ONE_TO_MANY → `TimelineActivityWorkspaceEntity`
  - StandardId: `MORTGAGE_STANDARD_FIELD_IDS.timelineActivities`
  - System field; timeline events for the mortgage.

These are all implemented as `@WorkspaceRelation` fields on `MortgageWorkspaceEntity` with the same decorators and `onDelete` behaviors as Opportunity.

## 2. Static IDs & Icons

### 2.1 Object ID

- Add `STANDARD_OBJECT_IDS.mortgage` in `standard-object-ids.ts`.
- ID is a fixed UUID (once chosen) and must never be changed post-release.

### 2.2 Field IDs

- Add `MORTGAGE_STANDARD_FIELD_IDS` in `standard-field-ids.ts` with entries for:
  - `name`, `principalAmount`, `interestRate`, `ltv`, `borrower`, `position`, `createdBy`, `favorites`, `taskTargets`, `noteTargets`, `attachments`, `timelineActivities`, `searchVector`.
- Register the mapping in `STANDARD_OBJECT_FIELD_IDS`:

```ts
export const STANDARD_OBJECT_FIELD_IDS = {
  // ...
  mortgage: MORTGAGE_STANDARD_FIELD_IDS,
  // ...
} as const;
```

This enables relation helper utilities (e.g. `object-metadata-field-relation.service.ts`, `build-default-relation-flat-field-metadatas-for-custom-object.util.ts`) to treat mortgages like other standard objects when generating default relations.

### 2.3 Icon

- Add `mortgage: 'IconBuildingBank'` (or similar) to `STANDARD_OBJECT_ICONS`.
- This icon is used directly in `MortgageWorkspaceEntity` and also in auto-generated relation fields.

## 3. MortgageWorkspaceEntity

New file: `packages/twenty-server/src/modules/mortgage/standard-objects/mortgage.workspace-entity.ts`.

### 3.1 Class Definition

- Annotated with `@WorkspaceEntity` using the new `STANDARD_OBJECT_IDS.mortgage` and `MORTGAGE_STANDARD_FIELD_IDS.name` as the label identifier.
- Marked as searchable with `@WorkspaceIsSearchable()`.

### 3.2 Fields & Relations

- Fields and relations follow the pattern of `CompanyWorkspaceEntity` and `OpportunityWorkspaceEntity`:
  - All `@WorkspaceField` declarations reference `MORTGAGE_STANDARD_FIELD_IDS`.
  - Cross-object relations reference their respective workspace entities and standardized field IDs.
  - Decorators match Opportunity semantics:
    - `@WorkspaceIsSystem()` for system-managed relations like favorites, attachments, timelineActivities.
    - `@WorkspaceIsFieldUIReadOnly()` for fields that are not user-editable (e.g. createdBy, taskTargets, noteTargets).

### 3.3 Inverse Relations

- For this change, we only introduce relations **from Mortgage to other objects**.
- We do **not** add new back-relations onto `Person`, `Task`, `Note`, etc., to keep the blast radius controlled.
- Existing systems (e.g. task targets, note targets, timeline activities) already handle linking back to records via their own foreign keys.

## 4. Metadata & GraphQL Pipeline

- Once `MortgageWorkspaceEntity` exists and metadata is synced, the metadata engine will treat it as any other standard object:
  - A new object metadata row will be created for Mortgage.
  - Field metadata rows will be created for all `MORTGAGE_STANDARD_FIELD_IDS`.
  - The GraphQL schema will expose `mortgages` queries/mutations and mortgage fields.
- GraphQL generation is already generic and does not require mortgage-specific code.

## 5. Frontend Behaviour

### 5.1 Data Model UI

- The Settings → Data model UI reads object metadata and renders all objects (standard + custom).
- Once metadata sync completes:
  - `Mortgage` appears with its configured icon and labels.
  - Mortgage fields are visible and customizable following standard patterns.

### 5.2 Record Views

- Record lists and detail views use `ObjectMetadataItem.fields` and field types to pick the right UI components:
  - `TEXT`, `NUMBER`, `CURRENCY`, `RELATION`, and `TS_VECTOR` are already supported.
- No mortgage-specific components are needed; generic field components handle these types.

### 5.3 Workflows

- Workflow configuration screens are metadata-driven:
  - Trigger object type dropdown will include `mortgage` once object metadata exists.
  - Field selectors (which rely on `shouldDisplayFormField` and object metadata) will surface:
    - `principalAmount`, `interestRate`, `ltv`, and `borrower` as editable/filterable fields.
- Since these types are already in `SUPPORTED_FORM_FIELD_TYPES`, no change is needed in workflow field filtering logic.

## 6. Core Views (Optional Follow-up)

- To keep the initial change focused, default core views for Mortgage are **not** created in this change.
- A follow-up change can:
  - Add `mortgages-all.view.ts` in `standard-objects-prefill-data/views`.
  - Wire it into `prefill-core-views.ts` to preseed “All Mortgages” views and related favorites.

## 7. Testing & Validation

- **Backend**
  - Run migrations and workspace metadata sync.
  - Verify that the metadata tables contain the `mortgage` object and all expected fields.
  - Query the GraphQL API for `mortgages` and perform basic CRUD operations.

- **Frontend**
  - Open Settings → Data model and confirm that `Mortgage` appears with the expected fields.
  - Create a mortgage record via the UI (if configured) or GraphQL and ensure fields render and save correctly.
  - Configure a workflow trigger on mortgage updates and confirm that mortgage fields are available in filters and updates.


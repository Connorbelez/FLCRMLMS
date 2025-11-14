# Implementation Plan – Mortgage Standard Object

This document describes how to introduce a new **standard `Mortgage` object** into this fork of Twenty, based on the existing custom/standard object architecture and current codebase conventions.

The plan focuses on a minimal but production-grade implementation with clear references to the files that would be touched.

---

## 1. Domain Model & Requirements

### 1.1 Object & Fields (MVP)

New standard object: **Mortgage**

Core business fields for the first iteration:

- `principalAmount`  
  - Type: `FieldMetadataType.CURRENCY`  
  - Shape: `CurrencyMetadata | null`  
  - Meaning: Outstanding principal amount of the mortgage.

- `interestRate`  
  - Type: `FieldMetadataType.NUMBER`  
  - Shape: `number | null`  
  - Meaning: Nominal annual rate.  
  - Convention: Stored as **percentage** (e.g. `2.75` for 2.75%); this should be reflected in labels/descriptions.

- `ltv` (Loan-to-Value ratio)  
  - Type: `FieldMetadataType.NUMBER`  
  - Shape: `number | null`  
  - Meaning: Loan-to-Value ratio.  
  - Convention: Stored as **percentage** (e.g. `70` for 70%); descriptions should make this explicit.

- `borrower`  
  - Type: `RelationType.MANY_TO_ONE` → `PersonWorkspaceEntity`  
  - Join column: `borrowerId: string | null`  
  - Meaning: The person who holds the mortgage.

Recommended “infrastructure” fields for a first-class standard object:

- `name` – `FieldMetadataType.TEXT`, label for the record, used as `labelIdentifierStandardId`.
- `position` – `FieldMetadataType.POSITION`, used for ordering and consistent with other standard objects.
- `createdBy` – `FieldMetadataType.ACTOR`, who created the record.
- `searchVector` – `FieldMetadataType.TS_VECTOR`, to participate in full-text search.

Standard cross-object relations (full standard-object suite, modeled after `Opportunity`):

- `favorites` – ONE_TO_MANY → `FavoriteWorkspaceEntity`  
  - Records that reference this mortgage as a favorite.
- `taskTargets` – ONE_TO_MANY → `TaskTargetWorkspaceEntity`  
  - Tasks tied to the mortgage (via task targets).
- `noteTargets` – ONE_TO_MANY → `NoteTargetWorkspaceEntity`  
  - Notes tied to the mortgage.
- `attachments` – ONE_TO_MANY → `AttachmentWorkspaceEntity`  
  - Files attached to the mortgage.
- `timelineActivities` – ONE_TO_MANY → `TimelineActivityWorkspaceEntity`  
  - Timeline activities linked to the mortgage.

### 1.2 Behavioral Requirements (MVP)

- `Mortgage` must be a **standard object**, not a custom object:
  - Has a static `standardId`.
  - Has static standard field IDs.
  - Is modeled by a `@WorkspaceEntity` class.
- CRUD for `Mortgage` should be available via the generic GraphQL/object metadata pipeline.
- Mortgage records must:
  - Appear in the Data Model UI under Settings.
  - Be selectable in workflow triggers/actions (object type + fields), since all field types are already supported.
  - Be available as a relation target from custom objects via default relation helpers (once wired).

---

## 2. How Standard Objects Work (Reference)

### 2.1 Docs

- `packages/twenty-docs/developers/backend-development/custom-objects.mdx`  
  - Explains how objects (standard and custom) are backed by metadata (DataSource/Object/Field) and how the GraphQL schema is generated from that metadata.

### 2.2 Backend Architecture

Key patterns used by existing standard objects:

- Standard object workspace entities:
  - `packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts`
  - `packages/twenty-server/src/modules/company/standard-objects/company.workspace-entity.ts`
  - `packages/twenty-server/src/modules/opportunity/standard-objects/opportunity.workspace-entity.ts`

- Static IDs & icons:
  - Object IDs:  
    - `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-ids.ts`
  - Field IDs:  
    - `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids.ts`
  - Object icons:  
    - `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-icons.ts`

- Metadata → GraphQL pipeline:
  - Workspace entities are scanned on metadata sync.
  - Metadata is written into the metadata schema DB and then used to generate the GraphQL schema and client metadata (mirroring what the docs describe for custom objects).

- Default views (optional, see Section 4.4):
  - View prefill orchestration:  
    - `packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/prefill-core-views.ts`
  - Example standard object views:  
    - `packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/views/opportunities-all.view.ts`  
    - `packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/views/people-all.view.ts`  
    - `packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/views/companies-all.view.ts`

---

## 3. Backend Changes (Exact Files)

### 3.1 Add a Mortgage standard object ID

**File to touch**

- `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-ids.ts`

**Change**

- Add a new `mortgage` entry:

```ts
export const STANDARD_OBJECT_IDS = {
  // ...existing entries...
  mortgage: '20202020-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // new UUID, never changed after shipping
} as const;
```

### 3.2 Define Mortgage standard field IDs

**File to touch**

- `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids.ts`

**Changes**

1. Add a new block:

```ts
export const MORTGAGE_STANDARD_FIELD_IDS = {
  name: '20202020-....-....-....-............',
  principalAmount: '20202020-....-....-....-............',
  interestRate: '20202020-....-....-....-............',
  ltv: '20202020-....-....-....-............',
  borrower: '20202020-....-....-....-............',
  position: '20202020-....-....-....-............',
  createdBy: '20202020-....-....-....-............',
  favorites: '20202020-....-....-....-............',
  taskTargets: '20202020-....-....-....-............',
  noteTargets: '20202020-....-....-....-............',
  attachments: '20202020-....-....-....-............',
  timelineActivities: '20202020-....-....-....-............',
  searchVector: '20202020-....-....-....-............',
} as const;
```

2. Register Mortgage in the object→field map:

```ts
export const STANDARD_OBJECT_FIELD_IDS = {
  // ...existing entries...
  opportunity: OPPORTUNITY_STANDARD_FIELD_IDS,
  person: PERSON_STANDARD_FIELD_IDS,
  mortgage: MORTGAGE_STANDARD_FIELD_IDS, // ← new
  // ...
} as const;
```

**Why this matters**

- `STANDARD_OBJECT_FIELD_IDS` is used by:
  - `packages/twenty-server/src/engine/metadata-modules/object-metadata/services/object-metadata-field-relation.service.ts`
  - `packages/twenty-server/src/engine/metadata-modules/object-metadata/utils/build-default-relation-flat-field-metadatas-for-custom-object.util.ts`

These helpers rely on standard field IDs to:

- Create default relation fields back to standard objects from custom objects.
- Build flat field metadata when custom objects reference standard ones.

### 3.3 Assign a Mortgage icon

**File to touch**

- `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-icons.ts`

**Change**

- Add:

```ts
export const STANDARD_OBJECT_ICONS = {
  // ...existing entries...
  mortgage: 'IconBuildingBank', // or the most appropriate finance icon available
} as const;
```

**Why this matters**

- Used when auto‑generating relation fields for custom objects (e.g. `object-metadata-field-relation.service.ts:385`), and in UI metadata to show an icon for the Mortgage object.

### 3.4 Create `MortgageWorkspaceEntity`

**New file**

- `packages/twenty-server/src/modules/mortgage/standard-objects/mortgage.workspace-entity.ts`

**Pattern / references**

- Use `PersonWorkspaceEntity`, `CompanyWorkspaceEntity`, and `OpportunityWorkspaceEntity` as templates:
  - Person:
    - `packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts`
  - Company:
    - `packages/twenty-server/src/modules/company/standard-objects/company.workspace-entity.ts`
  - Opportunity:
    - `packages/twenty-server/src/modules/opportunity/standard-objects/opportunity.workspace-entity.ts`

**Key elements**

- Imports:

  - `FieldMetadataType`, `RelationOnDeleteAction`, `ActorMetadata`, `CurrencyMetadata` from `twenty-shared/types`.
  - `RelationType` from `field-metadata/interfaces/relation-type.interface`.
  - `Relation` from `workspace-sync-metadata/interfaces/relation.interface`.
  - `BaseWorkspaceEntity` and decorators from `src/engine/twenty-orm/*`:
    - `WorkspaceEntity`, `WorkspaceField`, `WorkspaceRelation`,
    - `WorkspaceJoinColumn`, `WorkspaceIsNullable`, `WorkspaceIsSystem`,
    - `WorkspaceIsFieldUIReadOnly`, `WorkspaceIsSearchable`, `WorkspaceFieldIndex`.
  - `MORTGAGE_STANDARD_FIELD_IDS`, `STANDARD_OBJECT_IDS`, `STANDARD_OBJECT_ICONS`.
  - `SEARCH_VECTOR_FIELD` and `getTsVectorColumnExpressionFromFields` for search:
    - `src/engine/metadata-modules/constants/search-vector-field.constants`
    - `src/engine/workspace-manager/workspace-sync-metadata/utils/get-ts-vector-column-expression.util.ts`
  - `PersonWorkspaceEntity` for the borrower relation:
    - `src/modules/person/standard-objects/person.workspace-entity.ts`
  - Cross-object relation targets for the full standard-object suite:
    - `FavoriteWorkspaceEntity`:
      - `src/modules/favorite/standard-objects/favorite.workspace-entity.ts`
    - `TaskTargetWorkspaceEntity`:
      - `src/modules/task/standard-objects/task-target.workspace-entity.ts`
    - `NoteTargetWorkspaceEntity`:
      - `src/modules/note/standard-objects/note-target.workspace-entity.ts`
    - `AttachmentWorkspaceEntity`:
      - `src/modules/attachment/standard-objects/attachment.workspace-entity.ts`
    - `TimelineActivityWorkspaceEntity`:
      - `src/modules/timeline/standard-objects/timeline-activity.workspace-entity.ts`

- Entity metadata:

```ts
@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.mortgage,

  namePlural: 'mortgages',
  labelSingular: msg`Mortgage`,
  labelPlural: msg`Mortgages`,
  description: msg`A mortgage/loan record`,
  icon: STANDARD_OBJECT_ICONS.mortgage,
  shortcut: 'M',
  labelIdentifierStandardId: MORTGAGE_STANDARD_FIELD_IDS.name,
})
@WorkspaceIsSearchable()
export class MortgageWorkspaceEntity extends BaseWorkspaceEntity { ... }
```

- Fields:

```ts
const NAME_FIELD_NAME = 'name';

export const SEARCH_FIELDS_FOR_MORTGAGE: FieldTypeAndNameMetadata[] = [
  { name: NAME_FIELD_NAME, type: FieldMetadataType.TEXT },
];

@WorkspaceField({
  standardId: MORTGAGE_STANDARD_FIELD_IDS.name,
  type: FieldMetadataType.TEXT,
  label: msg`Name`,
  description: msg`Internal mortgage label`,
  icon: 'IconFileDescription',
})
name: string;

@WorkspaceField({
  standardId: MORTGAGE_STANDARD_FIELD_IDS.principalAmount,
  type: FieldMetadataType.CURRENCY,
  label: msg`Principal amount`,
  description: msg`Outstanding principal amount`,
  icon: 'IconCurrencyDollar',
})
@WorkspaceIsNullable()
principalAmount: CurrencyMetadata | null;

@WorkspaceField({
  standardId: MORTGAGE_STANDARD_FIELD_IDS.interestRate,
  type: FieldMetadataType.NUMBER,
  label: msg`Interest rate (%)`,
  description: msg`Nominal annual interest rate in percent`,
  icon: 'IconPercentage',
})
@WorkspaceIsNullable()
interestRate: number | null;

@WorkspaceField({
  standardId: MORTGAGE_STANDARD_FIELD_IDS.ltv,
  type: FieldMetadataType.NUMBER,
  label: msg`LTV (%)`,
  description: msg`Loan-to-Value ratio in percent`,
  icon: 'IconScaleOutline',
})
@WorkspaceIsNullable()
ltv: number | null;

@WorkspaceField({
  standardId: MORTGAGE_STANDARD_FIELD_IDS.position,
  type: FieldMetadataType.POSITION,
  label: msg`Position`,
  description: msg`Mortgage record position`,
  icon: 'IconHierarchy2',
  defaultValue: 0,
})
@WorkspaceIsSystem()
position: number;

@WorkspaceField({
  standardId: MORTGAGE_STANDARD_FIELD_IDS.createdBy,
  type: FieldMetadataType.ACTOR,
  label: msg`Created by`,
  icon: 'IconCreativeCommonsSa',
  description: msg`The creator of the record`,
})
@WorkspaceIsFieldUIReadOnly()
createdBy: ActorMetadata;

@WorkspaceField({
  standardId: MORTGAGE_STANDARD_FIELD_IDS.searchVector,
  type: FieldMetadataType.TS_VECTOR,
  label: SEARCH_VECTOR_FIELD.label,
  description: SEARCH_VECTOR_FIELD.description,
  icon: 'IconUser',
  generatedType: 'STORED',
  asExpression: getTsVectorColumnExpressionFromFields(
    SEARCH_FIELDS_FOR_MORTGAGE,
  ),
})
@WorkspaceIsNullable()
@WorkspaceIsSystem()
@WorkspaceFieldIndex({ indexType: IndexType.GIN })
searchVector: string;
```

- Borrower relation:

```ts
@WorkspaceRelation({
  standardId: MORTGAGE_STANDARD_FIELD_IDS.borrower,
  type: RelationType.MANY_TO_ONE,
  label: msg`Borrower`,
  description: msg`Person who borrows the mortgage`,
  icon: 'IconUser',
  inverseSideTarget: () => PersonWorkspaceEntity,
  // inverseSideFieldKey: 'mortgages', // optional, see below
  onDelete: RelationOnDeleteAction.SET_NULL,
})
@WorkspaceIsNullable()
borrower: Relation<PersonWorkspaceEntity> | null;

@WorkspaceJoinColumn('borrower')
borrowerId: string | null;
```

- Standard cross-object relations (full suite):

```ts
@WorkspaceRelation({
  standardId: MORTGAGE_STANDARD_FIELD_IDS.favorites,
  type: RelationType.ONE_TO_MANY,
  label: msg`Favorites`,
  description: msg`Favorites linked to the mortgage`,
  icon: 'IconHeart',
  inverseSideTarget: () => FavoriteWorkspaceEntity,
  onDelete: RelationOnDeleteAction.CASCADE,
})
@WorkspaceIsNullable()
@WorkspaceIsSystem()
favorites: Relation<FavoriteWorkspaceEntity[]>;

@WorkspaceRelation({
  standardId: MORTGAGE_STANDARD_FIELD_IDS.taskTargets,
  type: RelationType.ONE_TO_MANY,
  label: msg`Tasks`,
  description: msg`Tasks tied to the mortgage`,
  icon: 'IconCheckbox',
  inverseSideTarget: () => TaskTargetWorkspaceEntity,
  onDelete: RelationOnDeleteAction.CASCADE,
})
@WorkspaceIsFieldUIReadOnly()
taskTargets: Relation<TaskTargetWorkspaceEntity[]>;

@WorkspaceRelation({
  standardId: MORTGAGE_STANDARD_FIELD_IDS.noteTargets,
  type: RelationType.ONE_TO_MANY,
  label: msg`Notes`,
  description: msg`Notes tied to the mortgage`,
  icon: 'IconNotes',
  inverseSideTarget: () => NoteTargetWorkspaceEntity,
  onDelete: RelationOnDeleteAction.CASCADE,
})
@WorkspaceIsFieldUIReadOnly()
noteTargets: Relation<NoteTargetWorkspaceEntity[]>;

@WorkspaceRelation({
  standardId: MORTGAGE_STANDARD_FIELD_IDS.attachments,
  type: RelationType.ONE_TO_MANY,
  label: msg`Attachments`,
  description: msg`Attachments linked to the mortgage`,
  icon: 'IconFileImport',
  inverseSideTarget: () => AttachmentWorkspaceEntity,
  onDelete: RelationOnDeleteAction.CASCADE,
})
@WorkspaceIsNullable()
@WorkspaceIsSystem()
attachments: Relation<AttachmentWorkspaceEntity[]>;

@WorkspaceRelation({
  standardId: MORTGAGE_STANDARD_FIELD_IDS.timelineActivities,
  type: RelationType.ONE_TO_MANY,
  label: msg`Timeline Activities`,
  description: msg`Timeline Activities linked to the mortgage`,
  icon: 'IconTimelineEvent',
  inverseSideTarget: () => TimelineActivityWorkspaceEntity,
  onDelete: RelationOnDeleteAction.SET_NULL,
})
@WorkspaceIsNullable()
@WorkspaceIsSystem()
timelineActivities: Relation<TimelineActivityWorkspaceEntity[]>;
```

**Inverse relation decision (Person → Mortgage)**

- **MVP proposal**: do **not** touch `PersonWorkspaceEntity` initially.
  - Keep the change surface smaller.
  - Still allows workflows and queries from Mortgage → Person.
- Future enhancement:
  - Add a `WorkspaceRelation` on Person:
    - File: `packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts`
    - New `mortgages` ONE_TO_MANY relation pointing to `MortgageWorkspaceEntity`.

### 3.5 TypeORM migration

**Where it lands**

- Core migrations:
  - `src/database/typeorm/core/migrations/common/*.ts`
  - Referenced via `nx`:
    - `npx nx run twenty-server:typeorm migration:generate ...`

**Command to generate**

```bash
npx nx run twenty-server:typeorm migration:generate \
  src/database/typeorm/core/migrations/common/add-mortgage-standard-object \
  -d src/database/typeorm/core/core.datasource.ts
```

This migration will:

- Create the `mortgage` table in the core database schema (and likely in each workspace schema).
- Add the search vector column and index (GIN) for `searchVector`.

**Apply + sync**

```bash
npx nx run twenty-server:database:migrate:prod
npx nx run twenty-server:command workspace:sync-metadata -f
```

After this, the metadata engine should expose the Mortgage object/fields to GraphQL and the front-end.

---

## 4. Frontend & UX Impact

The front-end is largely metadata-driven, so once Mortgage is in metadata and GraphQL schema, most features will pick it up automatically.

### 4.1 Data Model UI

- Data model settings UI reads object metadata and lists all objects (standard + custom).
- Once Mortgage metadata exists, it should appear without code changes.
- Relevant components:
  - Data model pages / constants (for reference, not necessarily needing changes):
    - `packages/twenty-front/src/pages/settings/data-model/...`

### 4.2 Record list & detail views

- Generic record views (list/detail) use:
  - `ObjectMetadataItem.fields` to drive which fields are rendered.
  - Field UI components keyed on `FieldMetadataType`.
- Mortgage uses only already-supported field types:
  - `TEXT`, `NUMBER`, `CURRENCY`, `RELATION`, `TS_VECTOR`.
- No new field components are required:
  - Field components exist in:
    - `packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/...`
    - `packages/twenty-front/src/modules/object-record/record-field/ui/form-types/...`

### 4.3 Workflows & automation

- Workflows are object/field metadata driven:
  - Trigger UI:  
    - `packages/twenty-front/src/modules/workflow/workflow-trigger/components/WorkflowEditTriggerDatabaseEventForm.tsx`
  - Field selectors:  
    - `packages/twenty-front/src/modules/workflow/components/WorkflowEditUpdateEventFieldsMultiSelect.tsx`
  - Field filter logic:  
    - `packages/twenty-front/src/modules/workflow/workflow-steps/workflow-actions/utils/shouldDisplayFormField.ts`

- Because Mortgage fields use standard types, they:
  - Are automatically allowed by `SUPPORTED_FORM_FIELD_TYPES` (for `NUMBER`, `CURRENCY`, `RELATION`).
  - Become available in workflow triggers and actions once metadata is synced.

No workflow-specific code changes should be required beyond the existing generic logic.

### 4.4 Core views (optional, later)

If we want a default “All mortgages” view (like `Opportunities`):

- New file:
  - `packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/views/mortgages-all.view.ts`
- Pattern on:
  - `opportunities-all.view.ts`
- Update:
  - `packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/prefill-core-views.ts`
    - Add `mortgagesAllView(objectMetadataItems, true)` to the `views` array.

**MVP recommendation**: Defer core view prefill to a later change so we can keep the initial blast radius small and get feedback on which columns users actually want.

---

## 5. Blast Radius & Risks

### 5.1 Files impacted (summary)

Backend constants & IDs:

- `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-ids.ts`
- `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids.ts`
- `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-icons.ts`

New standard object entity:

- `packages/twenty-server/src/modules/mortgage/standard-objects/mortgage.workspace-entity.ts` (new)

Metadata / relation helpers (indirectly impacted by new IDs):

- `packages/twenty-server/src/engine/metadata-modules/object-metadata/services/object-metadata-field-relation.service.ts`
- `packages/twenty-server/src/engine/metadata-modules/object-metadata/utils/build-default-relation-flat-field-metadatas-for-custom-object.util.ts`

TypeORM migrations:

- New migration under:  
  `src/database/typeorm/core/migrations/common/add-mortgage-standard-object.ts`

Optional future changes:

- Person inverse relation:
  - `packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts`
- Core views:
  - `packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/views/mortgages-all.view.ts` (new)
  - `packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/prefill-core-views.ts`

### 5.2 Risks

- **Static ID correctness**
  - Standard object and field IDs are long-lived and used across migrations; incorrect IDs are hard to fix and can fork metadata between environments.
  - Mitigation: generate UUIDs once, keep them version-controlled, and do not change them post-merge.

- **Inverse relation complexity**
  - Adding Person → Mortgage relations will:
    - Add extra joins in some queries.
    - Expand the set of default relations available in metadata.
  - Mitigation: initially ship only Mortgage → Person (borrower) and add Person → Mortgage in a separate, explicitly scoped change.

- **Search semantics & units**
  - If `ltv` and `interestRate` semantics are unclear, dashboards and filters will be confusing.
  - Mitigation: ensure descriptions clearly state that values are stored as percentages.

- **Core views prefill**
  - Adding a default mortgage view impacts every workspace by creating extra default views and favorites.
  - Mitigation: defer view prefill until usage patterns are clearer, or gate via feature flag if needed.

---

## 6. Suggested OpenSpec Change

If we track this in OpenSpec, a suitable change could be:

- **Change ID**: `add-mortgage-standard-object`
- **Location**:
  - `openspec/changes/add-mortgage-standard-object/proposal.md`
  - `openspec/changes/add-mortgage-standard-object/design.md`
  - `openspec/changes/add-mortgage-standard-object/tasks.md`
  - `openspec/changes/add-mortgage-standard-object/specs/mortgage-object/spec.md`

High-level requirements to capture in the spec:

- Mortgage is a standard object with stable IDs, a name, search, and position.
- Mortgage has principalAmount, interestRate, and LTV fields with explicit semantics.
- Mortgage has a borrower relation to Person.
- Mortgage appears in:
  - Data model UI.
  - Generic record views.
  - Workflow triggers/actions (object + fields).

Once the spec is written and validated (`openspec validate add-mortgage-standard-object --strict`), we can implement according to the file-level plan above.

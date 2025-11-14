## ADDED Requirements

### Requirement: Mortgage standard object definition
A standard object named `Mortgage` MUST exist with a stable object ID, label metadata, and search behavior consistent with other CRM objects.

#### Scenario: Mortgage object metadata is available
- **GIVEN** workspace metadata has been synced
- **WHEN** the object metadata list is queried (e.g. via GraphQL or metadata services)
- **THEN** an object with `nameSingular = 'mortgage'` and `namePlural = 'mortgages'` MUST be present
- **AND** it MUST have a fixed `standardId` equal to `STANDARD_OBJECT_IDS.mortgage`
- **AND** it MUST expose `labelSingular = 'Mortgage'`, `labelPlural = 'Mortgages'`, and a configured icon.

#### Scenario: Mortgage participates in search
- **GIVEN** Mortgage records exist in a workspace
- **WHEN** full-text search is executed against objects supporting TS_VECTOR search
- **THEN** mortgage records MUST be indexed via a `searchVector` field
- **AND** search results MUST be able to return mortgage records using the same mechanics as Opportunities.

---

### Requirement: Mortgage fields and types
The Mortgage object MUST include canonical fields for name, principal amount, interest rate, and LTV, using appropriate metadata types.

#### Scenario: Mortgage fields use canonical types
- **GIVEN** workspace metadata for the Mortgage object
- **WHEN** field metadata is inspected for Mortgage
- **THEN** it MUST contain fields with the following types:
  - `name`: `FieldMetadataType.TEXT`
  - `principalAmount`: `FieldMetadataType.CURRENCY`
  - `interestRate`: `FieldMetadataType.NUMBER`
  - `ltv`: `FieldMetadataType.NUMBER`
  - `position`: `FieldMetadataType.POSITION`
  - `createdBy`: `FieldMetadataType.ACTOR`
  - `searchVector`: `FieldMetadataType.TS_VECTOR`
- **AND** descriptions MUST clarify that `interestRate` and `ltv` values are stored as percentages.

#### Scenario: Mortgage field IDs are stable
- **GIVEN** a deployed environment with the Mortgage object
- **WHEN** the standard field ID map is read (`MORTGAGE_STANDARD_FIELD_IDS`)
- **THEN** it MUST contain entries for all fields above
- **AND** these IDs MUST remain stable across workspace syncs and deployments.

---

### Requirement: Borrower relation to Person
Mortgages MUST be able to reference a Person record as their borrower via a MANY_TO_ONE relation.

#### Scenario: Mortgage can reference a borrower
- **GIVEN** a workspace with at least one Person and one Mortgage
- **WHEN** a Mortgage record is created or updated
- **THEN** it MUST be possible to set `borrowerId` to the `id` of a Person record
- **AND** metadata MUST describe this field as a `FieldMetadataType.RELATION` with `RelationType.MANY_TO_ONE` targeting the Person object.

#### Scenario: Borrower field is optional
- **GIVEN** a Mortgage record exists
- **WHEN** the borrower is removed (set to null)
- **THEN** the record MUST remain valid
- **AND** the relation metadata MUST allow null values (i.e. the relation is nullable and uses `RelationOnDeleteAction.SET_NULL`).

---

### Requirement: Mortgage cross-object relations
Mortgages MUST support the standard suite of cross-object relations (favorites, tasks, notes, attachments, timeline activities) consistent with other core CRM objects.

#### Scenario: Mortgage supports favorites
- **GIVEN** a Mortgage record exists in a workspace
- **WHEN** a Favorite is created that targets the Mortgage
- **THEN** the Mortgage object MUST have a ONE_TO_MANY relation field `favorites`
- **AND** metadata MUST show that this relation points to `FavoriteWorkspaceEntity`
- **AND** the field MUST be marked as system-managed.

#### Scenario: Mortgage supports task targets
- **GIVEN** tasks are created and linked to a Mortgage via task targets
- **WHEN** the Mortgage field metadata is inspected
- **THEN** there MUST be a ONE_TO_MANY relation field `taskTargets` pointing to `TaskTargetWorkspaceEntity`
- **AND** this field MUST be UI read-only, as tasks manage the relationship.

#### Scenario: Mortgage supports note targets
- **GIVEN** notes are created and linked to a Mortgage via note targets
- **WHEN** the Mortgage field metadata is inspected
- **THEN** there MUST be a ONE_TO_MANY relation field `noteTargets` pointing to `NoteTargetWorkspaceEntity`
- **AND** this field MUST be UI read-only.

#### Scenario: Mortgage supports attachments
- **GIVEN** file attachments are linked to a Mortgage
- **WHEN** the Mortgage field metadata is inspected
- **THEN** there MUST be a ONE_TO_MANY relation field `attachments` pointing to `AttachmentWorkspaceEntity`
- **AND** this field MUST be marked as system-managed.

#### Scenario: Mortgage supports timeline activities
- **GIVEN** timeline activities are generated for a Mortgage (e.g. from tasks, notes, or workflows)
- **WHEN** the Mortgage field metadata is inspected
- **THEN** there MUST be a ONE_TO_MANY relation field `timelineActivities` pointing to `TimelineActivityWorkspaceEntity`
- **AND** this field MUST be marked as system-managed and nullable.

---

### Requirement: Mortgage in data model UI and workflows
Mortgage MUST appear as a first-class object in the data model UI and workflow configuration UIs.

#### Scenario: Mortgage appears in data model settings
- **GIVEN** a workspace where metadata has been synced after adding Mortgage
- **WHEN** a user opens Settings → Data model
- **THEN** the Mortgage object MUST appear in the object list with its configured name and icon
- **AND** its fields (including principalAmount, interestRate, ltv, borrower, and relation suite) MUST be visible for configuration.

#### Scenario: Mortgage is available in workflows
- **GIVEN** the workflow builder is opened in a workspace with Mortgage metadata
- **WHEN** a user configures a database event trigger or an action that operates on a record type
- **THEN** `Mortgage` MUST be available as an object type
- **AND** Mortgage fields (principalAmount, interestRate, ltv, borrower) MUST be available in field selectors and filters
- **AND** these fields MUST behave like other supported field types (NUMBER, CURRENCY, RELATION) in workflow configuration.

#### Scenario: Custom objects can relate to Mortgage
- **GIVEN** a custom object is created via the metadata APIs or UI
- **WHEN** default relation fields between custom objects and standard objects are generated
- **THEN** helper logic that uses `STANDARD_OBJECT_FIELD_IDS` MUST be able to create relation metadata involving Mortgage
- **AND** the icon used for such relations MUST fall back to `STANDARD_OBJECT_ICONS.mortgage` when appropriate.


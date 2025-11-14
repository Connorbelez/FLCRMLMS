# workflow-fields Specification

## Purpose
TBD - created by archiving change update-workflow-attachment-fields. Update Purpose after archive.
## Requirements
### Requirement: Workflow field selector type coverage
Workflow trigger and action field selectors MUST expose every field whose metadata type is listed in `SUPPORTED_FORM_FIELD_TYPES`, including attachment-backed types, so builders can react to or update those values.

#### Scenario: Supported field types include attachments
- **GIVEN** the workflow field selector uses the `SUPPORTED_FORM_FIELD_TYPES` whitelist
- **WHEN** that whitelist contains the following metadata types:
  - `TEXT`, `NUMBER`, `DATE`, `BOOLEAN`
  - `SELECT`, `MULTI_SELECT`, `EMAILS`, `LINKS`
  - `FULL_NAME`, `ADDRESS`, `PHONES`, `CURRENCY`
  - `DATE_TIME`, `RAW_JSON`, `UUID`, `ARRAY`
  - `RELATION`, `RICH_TEXT_V2`, `PDF`, `IMAGE`
- **THEN** the selector MUST treat PDF and IMAGE fields as first-class options alongside the existing 18 types.

#### Scenario: PDF field can be selected
- **GIVEN** an object metadata item contains an active, non-system, non-UI-read-only PDF field
- **AND** the field's metadata type is `FieldMetadataType.PDF`
- **WHEN** a user edits a workflow trigger or update step that supports field scoping (e.g. `WorkflowEditTriggerDatabaseEventForm`, `WorkflowFieldsMultiSelect`)
- **THEN** the PDF field appears in the field multi-select options
- **AND** the user can save a configuration that references this PDF field without validation errors.

#### Scenario: Image field can be selected
- **GIVEN** an object metadata item contains an active, non-system, non-UI-read-only IMAGE field
- **AND** the field's metadata type is `FieldMetadataType.IMAGE`
- **WHEN** a user edits a workflow trigger or update step that supports field scoping
- **THEN** the IMAGE field appears in the field multi-select options
- **AND** the user can save a configuration that references this IMAGE field without validation errors.

#### Scenario: Inactive or UI read-only attachment fields are not shown
- **GIVEN** an object metadata item contains PDF or IMAGE fields that are inactive or marked as UI read-only
- **WHEN** a user opens a workflow trigger or update step field selector
- **THEN** those inactive or UI read-only attachment fields MUST NOT appear in the multi-select options for CREATE, UPDATE, or UPSERT actions.

### Requirement: Workflow field selector filtering rules
Workflow field selectors MUST use consistent filter rules across action types, and attachment fields MUST respect the same rules as other supported types.

#### Scenario: CREATE/UPDATE/UPSERT field filter rules
- **GIVEN** a workflow step of type `CREATE_RECORD`, `UPDATE_RECORD`, or `UPSERT_RECORD`
- **WHEN** building the list of selectable fields for that step
- **THEN** the selector MUST include only fields that:
  - Have a metadata type in `SUPPORTED_FORM_FIELD_TYPES`
  - Are active (`isActive === true`)
  - Are not system fields (`isSystem === false`)
  - Are not UI read-only (`isUIReadOnly === false`)
- **AND** PDF/IMAGE fields MUST follow these same rules (for example, a system PDF field is excluded just like a system TEXT field).

#### Scenario: FIND_RECORDS field filter rules
- **GIVEN** a workflow step of type `FIND_RECORDS`
- **WHEN** building the list of selectable fields for that step
- **THEN** the selector MUST include only fields that:
  - Have a metadata type in `SUPPORTED_FORM_FIELD_TYPES`
  - Are active (`isActive === true`)
  - Have a supported relation type (if applicable)
- **AND** system fields MAY be included, with the existing special handling for the `id` field
- **AND** PDF/IMAGE fields MUST be treated like any other supported type under these rules.

#### Scenario: Unsupported relation types excluded
- **GIVEN** a field has type `RELATION` but is not a `MANY_TO_ONE` relation
- **WHEN** the workflow field selector is built for any action type
- **THEN** that field MUST NOT be included in the selectable options
- **AND** this exclusion rule MUST apply equally to attachment fields when they are represented via relation metadata.


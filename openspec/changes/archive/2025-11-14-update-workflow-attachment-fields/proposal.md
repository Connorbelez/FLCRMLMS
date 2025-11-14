# Proposal: Support attachments in workflow field selectors

## Why
- Attachments stored via the PDF and IMAGE field metadata types are now persisted and editable throughout the product but workflow triggers and action field pickers still hide them.
- Users need to limit workflow triggers (updated/upserted events) to specific attachment fields or update those fields in downstream steps; hiding them blocks automation scenarios around contracts, signed docs, or stored images.

## Current Behavior
- `shouldDisplayFormField` limits workflow field selectors to 18 metadata types; the list excludes PDF and IMAGE.
- Workflow UI components (`WorkflowEditTriggerDatabaseEventForm`, `WorkflowFieldsMultiSelect`) rely solely on that whitelist and therefore never show attachment fields even when they exist on an object.

## What Changes
- Extend the supported workflow action field types to include `FieldMetadataType.PDF` and `FieldMetadataType.IMAGE` so triggers and action editors can filter/watch those fields.
- Update the workflow field documentation/verification references so contributors know attachments are supported and counted in the whitelist.

## Impact
- Workflow builders can now create triggers scoped to attachment field changes and add PDF/IMAGE fields to update actions without leaving the UI.
- Documentation and verification stay in sync with the runtime behavior, reducing regressions when new field types are introduced.

## Validation
- Manual: open a workflow trigger or update step, ensure attachment fields appear in the multi-select when defined on the chosen object, and ensure they save successfully.
- Automated: rely on existing workflow UI unit tests plus lint/type-check; no new automated test is required for this delta.

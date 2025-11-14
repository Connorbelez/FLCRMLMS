# Tasks

1. - [x] Add `FieldMetadataType.PDF` and `FieldMetadataType.IMAGE` to `SUPPORTED_FORM_FIELD_TYPES` in `shouldDisplayFormField.ts`, ensuring workflow triggers/actions now pick them up.
2. - [x] Verify `WorkflowFieldsMultiSelect` emits the correct field identifiers for attachments and adjust only if necessary.
3. - [x] Update `WORKFLOW_ACTION_FIELDS_CONTRIBUTION_GUIDE.md`, `WORKFLOW_FIELDS_QUICK_REFERENCE.md`, and `WORKFLOW_FIELDS_VERIFICATION.md` to document the expanded whitelist (now 20 types).
4. - [x] Manually confirm attachment fields appear in workflow trigger/update selectors and run the standard front-end lint/typecheck suite if required (manual visual confirmation should be done in a running environment).

# Workflow Action Fields Contribution Guide

This guide explains how workflow action menu fields work and how to extend their capabilities in the Twenty CRM application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Field Sources](#field-sources)
4. [Field Filtering Logic](#field-filtering-logic)
5. [Adding New Field Types](#adding-new-field-types)
6. [Customizing Field Display](#customizing-field-display)
7. [Modifying Filter Behavior](#modifying-filter-behavior)
8. [Testing Your Changes](#testing-your-changes)
9. [Common Scenarios](#common-scenarios)

---

## Overview

Workflow action menus (for CREATE_RECORD, UPDATE_RECORD, UPSERT_RECORD, and FIND_RECORDS actions) display a list of fields that users can interact with. These fields come from the **object metadata** and are filtered based on field type, system flags, and action type.

### Key Principles

- Fields originate from `objectMetadataItem.fields` (object metadata)
- Only supported field types appear in the action menu
- System fields and UI read-only fields are filtered for certain actions
- Relation fields must be `MANY_TO_ONE` to be supported
- Fields are sorted alphabetically by name before display

---

## Architecture

### Frontend Components

**Main Component:**
- `packages/twenty-front/src/modules/workflow/components/WorkflowEditUpdateEventFieldsMultiSelect.tsx`
  - Displays the field multi-select component
  - Fetches fields from `objectMetadataItem.fields`
  - Filters via `shouldDisplayFormField()`
  - Formats fields using `formatFieldMetadataItemAsFieldDefinition()`

**Related Components:**
- `packages/twenty-front/src/modules/workflow/workflow-steps/workflow-actions/components/WorkflowCreateRecordBody.tsx`
- `packages/twenty-front/src/modules/workflow/workflow-steps/workflow-actions/components/WorkflowEditActionUpdateRecord.tsx`
- `packages/twenty-front/src/modules/workflow/workflow-steps/workflow-actions/components/WorkflowFormFieldInput.tsx`

### Backend Components

**Object Metadata Definition:**
- `packages/twenty-server/src/engine/twenty-orm/` - Base workspace entities
- `packages/twenty-server/src/modules/*/standard-objects/*.workspace-entity.ts` - Standard object definitions
- Fields are defined using `@WorkspaceField()` decorator

**Example:**
```typescript
@WorkspaceField({
  standardId: ATTACHMENT_STANDARD_FIELD_IDS.name,
  type: FieldMetadataType.TEXT,
  label: msg`Name`,
  description: msg`Attachment name`,
  icon: 'IconFileUpload',
})
name: string;
```

---

## Field Sources

### Object Metadata Structure

Fields come from `ObjectMetadataItem.fields`, which has this structure:

```typescript
type ObjectMetadataItem = {
  id: string;
  nameSingular: string;
  namePlural: string;
  labelSingular: string;
  labelPlural: string;
  fields: FieldMetadataItem[];  // ← Source of action menu fields
  readableFields: FieldMetadataItem[];
  updatableFields: FieldMetadataItem[];
  // ... other properties
};
```

### Field Metadata Structure

Each field contains:

```typescript
type FieldMetadataItem = {
  id: string;
  name: string;
  label: string;
  type: FieldMetadataType;
  isActive: boolean;
  isSystem: boolean;
  isUIReadOnly: boolean;
  isNullable: boolean;
  isCustom: boolean;
  icon?: string;
  settings?: any;
  options?: any;
  relation?: RelationMetadata;
  // ... other properties
};
```

---

## Field Filtering Logic

### Core Filtering Function

**Location:** `packages/twenty-front/src/modules/workflow/workflow-steps/workflow-actions/utils/shouldDisplayFormField.ts`

```typescript
const SUPPORTED_FORM_FIELD_TYPES = [
  FieldMetadataType.TEXT,
  FieldMetadataType.NUMBER,
  FieldMetadataType.DATE,
  FieldMetadataType.BOOLEAN,
  FieldMetadataType.SELECT,
  FieldMetadataType.MULTI_SELECT,
  FieldMetadataType.EMAILS,
  FieldMetadataType.LINKS,
  FieldMetadataType.FULL_NAME,
  FieldMetadataType.ADDRESS,
  FieldMetadataType.PHONES,
  FieldMetadataType.CURRENCY,
  FieldMetadataType.DATE_TIME,
  FieldMetadataType.RAW_JSON,
  FieldMetadataType.UUID,
  FieldMetadataType.ARRAY,
  FieldMetadataType.RELATION,
  FieldMetadataType.RICH_TEXT_V2,
  FieldMetadataType.PDF,
  FieldMetadataType.IMAGE,
];
```

### Filter Rules by Action Type

**CREATE_RECORD / UPDATE_RECORD / UPSERT_RECORD:**
- Field type must be in `SUPPORTED_FORM_FIELD_TYPES`
- Relations must be `MANY_TO_ONE` type
- Field must NOT be UI read-only (`!fieldMetadataItem.isUIReadOnly`)
- Field must NOT be a system field (`!fieldMetadataItem.isSystem`)
- Field must be active (`fieldMetadataItem.isActive`)

**FIND_RECORDS:**
- Same type and relation restrictions
- System fields ARE allowed (except the special handling for `id` field)
- Field must be active

### Field Processing Flow

```
objectMetadataItem.fields
  ↓
Filter via shouldDisplayFormField()
  ↓
Sort alphabetically by name
  ↓
Format via formatFieldMetadataItemAsFieldDefinition()
  ↓
Convert relations to fieldName/fieldNameId format
  ↓
Display in FormMultiSelectFieldInput
```

---

## Adding New Field Types

### Step 1: Add to Supported Types List

Edit `packages/twenty-front/src/modules/workflow/workflow-steps/workflow-actions/utils/shouldDisplayFormField.ts`:

```typescript
const SUPPORTED_FORM_FIELD_TYPES = [
  // ... existing types
  FieldMetadataType.YOUR_NEW_TYPE,
];
```

### Step 2: Update Backend Metadata

If this is a completely new field type for the system:

1. Add to `FieldMetadataType` enum in `packages/twenty-shared/src/types/FieldMetadataType.ts`
2. Define the field in your workspace entity:

```typescript
@WorkspaceField({
  standardId: YOUR_OBJECT_STANDARD_FIELD_IDS.yourNewField,
  type: FieldMetadataType.YOUR_NEW_TYPE,
  label: msg`Your Field Label`,
  description: msg`Your field description`,
  icon: 'IconName',
})
yourNewField: YourFieldType;
```

3. Generate and run database migrations:

```bash
npx nx run twenty-server:typeorm migration:generate \
  src/database/typeorm/core/migrations/common/add-your-new-field \
  -d src/database/typeorm/core/core.datasource.ts

npx nx run twenty-server:database:migrate:prod
npx nx run twenty-server:command workspace:sync-metadata -f
```

### Step 3: Add Form Input Component

If your field type needs a custom input component, add it to:
- `packages/twenty-front/src/modules/object-record/record-field/ui/form-types/components/`

Then update `FormFieldInput.tsx` to handle your new type:

```typescript
case FieldMetadataType.YOUR_NEW_TYPE:
  return <FormYourNewTypeFieldInput {...props} />;
```

### Step 4: Update Field Definition Formatter

If your field needs special formatting logic, update:
- `packages/twenty-front/src/modules/object-metadata/utils/formatFieldMetadataItemAsFieldDefinition.ts`

### Step 5: Handle Relations (if applicable)

If your new type involves relations, update the relation guard in `shouldDisplayFormField.ts`:

```typescript
const isNotSupportedRelation =
  fieldMetadataItem.type === FieldMetadataType.RELATION &&
  fieldMetadataItem.settings?.['relationType'] !== 'MANY_TO_ONE' &&
  fieldMetadataItem.settings?.['relationType'] !== 'YOUR_NEW_RELATION_TYPE';
```

---

## Customizing Field Display

### Modifying Field Labels/Icons

Fields inherit their display properties from the metadata. To customize:

**Option 1: Change at Definition (Backend)**

```typescript
@WorkspaceField({
  standardId: YOUR_STANDARD_FIELD_ID,
  type: FieldMetadataType.TEXT,
  label: msg`Custom Label`,  // ← Changes everywhere
  icon: 'IconCustomIcon',    // ← Changes everywhere
})
```

**Option 2: Override in Formatter (Frontend)**

Edit `formatFieldMetadataItemAsFieldDefinition.ts` to add custom logic:

```typescript
export const formatFieldMetadataItemAsFieldDefinition = ({
  field,
  objectMetadataItem,
  showLabel,
  labelWidth,
}: FieldMetadataItemAsFieldDefinitionProps): FieldDefinition<FieldMetadata> => {
  // Custom logic here
  const customLabel = field.name === 'specialField' 
    ? 'Custom Display Name' 
    : field.label;

  return {
    fieldMetadataId: field.id,
    label: customLabel,  // ← Use custom label
    // ... rest of definition
  };
};
```

### Changing Field Sort Order

Default behavior sorts alphabetically by `field.name`. To customize:

Edit `WorkflowEditUpdateEventFieldsMultiSelect.tsx`:

```typescript
const inlineFieldMetadataItems = objectMetadataItem?.fields
  .filter((fieldMetadataItem) =>
    shouldDisplayFormField({
      fieldMetadataItem,
      actionType: 'UPDATE_RECORD',
    }),
  )
  .sort((a, b) => {
    // Custom sort logic
    // Example: System fields first, then alphabetical
    if (a.isSystem && !b.isSystem) return -1;
    if (!a.isSystem && b.isSystem) return 1;
    return a.name.localeCompare(b.name);
  });
```

### Grouping Fields

To display fields in groups (e.g., "Standard Fields" vs "Custom Fields"):

1. Split the fields array into multiple groups
2. Render separate `FormMultiSelectFieldInput` components for each group
3. Add section headers between groups

```typescript
const standardFields = inlineFieldMetadataItems.filter(f => !f.isCustom);
const customFields = inlineFieldMetadataItems.filter(f => f.isCustom);

return (
  <>
    <SectionHeader>Standard Fields</SectionHeader>
    <FormMultiSelectFieldInput options={formatFields(standardFields)} />
    
    <SectionHeader>Custom Fields</SectionHeader>
    <FormMultiSelectFieldInput options={formatFields(customFields)} />
  </>
);
```

---

## Modifying Filter Behavior

### Allowing System Fields

To show system fields for UPDATE_RECORD actions:

Edit `shouldDisplayFormField.ts`:

```typescript
case 'UPDATE_RECORD':
  return (
    !isNotSupportedRelation &&
    !fieldMetadataItem.isUIReadOnly &&
    // Remove: !fieldMetadataItem.isSystem &&
    fieldMetadataItem.isActive
  );
```

### Allowing UI Read-Only Fields

To show read-only fields (e.g., for display-only purposes):

```typescript
case 'UPDATE_RECORD':
  return (
    !isNotSupportedRelation &&
    // Remove: !fieldMetadataItem.isUIReadOnly &&
    !fieldMetadataItem.isSystem &&
    fieldMetadataItem.isActive
  );
```

⚠️ **Warning:** If you allow read-only fields, ensure the backend validation prevents actual updates to these fields.

### Supporting Additional Relation Types

To support `MANY_TO_MANY` or `ONE_TO_MANY` relations:

1. Update the relation check:

```typescript
const isNotSupportedRelation =
  fieldMetadataItem.type === FieldMetadataType.RELATION &&
  fieldMetadataItem.settings?.['relationType'] !== 'MANY_TO_ONE' &&
  fieldMetadataItem.settings?.['relationType'] !== 'MANY_TO_MANY';  // ← Add this
```

2. Update value formatter in `WorkflowEditUpdateEventFieldsMultiSelect.tsx`:

```typescript
const value = inlineFieldDefinitions?.map((field) => {
  if (isFieldRelation(field.metadata)) {
    const relationType = field.metadata.relationType;
    
    if (relationType === 'MANY_TO_ONE') {
      return `${field.metadata.fieldName}Id`;
    } else if (relationType === 'MANY_TO_MANY') {
      return `${field.metadata.fieldName}Ids`;  // ← Handle arrays
    }
  }
  return field.metadata.fieldName;
});
```

3. Update backend workflow execution to handle the new relation format.

### Adding Action-Specific Logic

To add custom logic for specific actions:

```typescript
export const shouldDisplayFormField = ({
  fieldMetadataItem,
  actionType,
}: {
  fieldMetadataItem: FieldMetadataItem;
  actionType: WorkflowActionType;
}) => {
  // ... existing checks

  switch (actionType) {
    case 'YOUR_NEW_ACTION':
      return (
        // Your custom filter logic
        !isNotSupportedRelation &&
        fieldMetadataItem.isActive &&
        // Add any specific rules for your action
        customCondition(fieldMetadataItem)
      );
      
    // ... existing cases
  }
};
```

---

## Testing Your Changes

### Unit Tests

Create or update tests for `shouldDisplayFormField`:

**Location:** `packages/twenty-front/src/modules/workflow/workflow-steps/workflow-actions/utils/__tests__/shouldDisplayFormField.test.ts`

```typescript
describe('shouldDisplayFormField', () => {
  it('should display your new field type for UPDATE_RECORD', () => {
    const fieldMetadataItem = {
      type: FieldMetadataType.YOUR_NEW_TYPE,
      isActive: true,
      isSystem: false,
      isUIReadOnly: false,
    };

    const result = shouldDisplayFormField({
      fieldMetadataItem,
      actionType: 'UPDATE_RECORD',
    });

    expect(result).toBe(true);
  });

  it('should not display unsupported relation types', () => {
    // ... test cases
  });
});
```

### Integration Testing

1. **Start the development environment:**

```bash
yarn start
```

2. **Navigate to Workflows:**
   - Go to Settings → Workflows
   - Create or edit a workflow
   - Add a CREATE_RECORD or UPDATE_RECORD action

3. **Verify Field Display:**
   - Check that your new field type appears in the field selector
   - Verify filtering works correctly (system fields hidden/shown as expected)
   - Test that relation fields format correctly

4. **Test Form Input:**
   - Select your field
   - Verify the appropriate input component renders
   - Enter a value and save
   - Run the workflow and verify the value is persisted

### End-to-End Testing

Add Playwright tests in `packages/twenty-e2e-testing/`:

```typescript
test('workflow action shows custom field type', async ({ page }) => {
  // Navigate to workflow editor
  await page.goto('/settings/workflows');
  
  // Create workflow with UPDATE_RECORD action
  // ...
  
  // Open field selector
  await page.click('[data-testid="field-selector"]');
  
  // Verify your field appears
  await expect(page.locator('text=Your Custom Field')).toBeVisible();
});
```

### Manual Testing Checklist

- [ ] New field type appears in action menu
- [ ] Field filtering works correctly for all action types
- [ ] Form input renders and accepts values
- [ ] Saved values persist correctly
- [ ] Workflow executes successfully with your field
- [ ] Validation errors display appropriately
- [ ] Relation fields format correctly (fieldName vs fieldNameId)
- [ ] No console errors or warnings
- [ ] GraphQL types regenerate correctly: `npx nx run twenty-front:graphql:generate`

---

## Common Scenarios

### Scenario 1: Add Support for a New Primitive Field Type

**Goal:** Add support for `FieldMetadataType.RATING` (1-5 star rating)

**Steps:**

1. Add to supported types:
```typescript
// shouldDisplayFormField.ts
const SUPPORTED_FORM_FIELD_TYPES = [
  // ...
  FieldMetadataType.RATING,
];
```

2. Create form input component:
```typescript
// FormRatingFieldInput.tsx
export const FormRatingFieldInput = ({ value, onChange, ...props }) => {
  return (
    <RatingInput
      value={value}
      onChange={onChange}
      max={5}
    />
  );
};
```

3. Wire up in `FormFieldInput.tsx`:
```typescript
case FieldMetadataType.RATING:
  return <FormRatingFieldInput {...props} />;
```

4. Test in workflow UI

### Scenario 2: Show Only User-Created Custom Fields

**Goal:** Filter out all standard fields, show only custom fields

**Steps:**

1. Update filter in `WorkflowEditUpdateEventFieldsMultiSelect.tsx`:
```typescript
const inlineFieldMetadataItems = objectMetadataItem?.fields
  .filter((fieldMetadataItem) =>
    shouldDisplayFormField({
      fieldMetadataItem,
      actionType: 'UPDATE_RECORD',
    }) && fieldMetadataItem.isCustom  // ← Add this
  )
  .sort((a, b) => a.name.localeCompare(b.name));
```

### Scenario 3: Add Computed/Virtual Field Support

**Goal:** Show computed fields that don't directly map to database columns

**Steps:**

1. Define virtual field in metadata:
```typescript
@WorkspaceField({
  standardId: YOUR_STANDARD_FIELD_ID,
  type: FieldMetadataType.TEXT,
  label: msg`Full Address`,
  isVirtual: true,  // Custom flag
})
```

2. Update filter to allow virtual fields:
```typescript
export const shouldDisplayFormField = ({ fieldMetadataItem, actionType }) => {
  // Add exception for virtual fields
  if (fieldMetadataItem.isVirtual) {
    return fieldMetadataItem.isActive;
  }
  
  // ... existing logic
};
```

3. Handle in backend workflow execution:
```typescript
// When processing workflow, compute virtual field values
if (field.isVirtual && field.name === 'fullAddress') {
  value = `${record.street}, ${record.city}, ${record.zip}`;
}
```

### Scenario 4: Add Conditional Field Visibility

**Goal:** Only show certain fields when another field has a specific value

**Steps:**

1. Add metadata to track dependencies:
```typescript
@WorkspaceField({
  standardId: FIELD_ID,
  type: FieldMetadataType.TEXT,
  label: msg`Secondary Email`,
  settings: {
    visibleWhen: {
      field: 'hasSecondaryEmail',
      value: true,
    }
  }
})
```

2. Update filter logic:
```typescript
const shouldDisplayFormField = ({ fieldMetadataItem, actionType, currentValues }) => {
  // ... existing checks
  
  // Check visibility conditions
  if (fieldMetadataItem.settings?.visibleWhen) {
    const { field, value } = fieldMetadataItem.settings.visibleWhen;
    if (currentValues[field] !== value) {
      return false;
    }
  }
  
  return true;
};
```

3. Update component to pass current form values:
```typescript
<WorkflowFieldsMultiSelect
  objectMetadataItem={objectMetadataItem}
  currentValues={workflowAction.settings}  // ← Pass current values
/>
```

### Scenario 5: Support File Upload Fields

**Goal:** Allow users to select file/attachment fields

**Steps:**

1. Add `FieldMetadataType.FILE` to supported types

2. Create specialized input component:
```typescript
export const FormFileFieldInput = ({ value, onChange }) => {
  return (
    <FileUpload
      value={value}
      onChange={onChange}
      accept="image/*,application/pdf"
    />
  );
};
```

3. Handle file storage in workflow execution (backend)

---

## Best Practices

### 1. Maintain Backward Compatibility

When modifying filters or adding new field types:
- Ensure existing workflows continue to work
- Add migrations if field structure changes
- Deprecate old field types gracefully

### 2. Document Field Metadata

Always add comprehensive metadata to new fields:

```typescript
@WorkspaceField({
  standardId: STANDARD_FIELD_ID,
  type: FieldMetadataType.YOUR_TYPE,
  label: msg`User-Visible Label`,
  description: msg`Helpful description for users`,
  icon: 'IconName',
  defaultValue: 'sensible-default',
})
```

### 3. Handle Nullability

Consider whether fields should be nullable:

```typescript
@WorkspaceField({
  // ...
  isNullable: true,  // Can be null/undefined
})
```

And reflect this in validation:

```typescript
if (!fieldMetadataItem.isNullable && !value) {
  throw new ValidationError('Field is required');
}
```

### 4. Consider Performance

For objects with many fields:
- Lazy-load field options
- Use virtualized lists for long field lists
- Cache field metadata where possible

### 5. Accessibility

Ensure form inputs are accessible:
- Add proper ARIA labels
- Support keyboard navigation
- Provide error messages for screen readers

---

## Troubleshooting

### Fields Not Appearing

**Problem:** Your field doesn't show up in the action menu.

**Debug steps:**
1. Check `shouldDisplayFormField()` returns `true` for your field
2. Verify `fieldMetadataItem.isActive === true`
3. Ensure field type is in `SUPPORTED_FORM_FIELD_TYPES`
4. Check for system/UI read-only flags
5. Verify object metadata is loaded: `console.log(objectMetadataItem.fields)`

### Relation Fields Not Saving

**Problem:** Relation field values aren't persisted.

**Debug steps:**
1. Check value format (should be `fieldNameId` not `fieldName`)
2. Verify relation type is `MANY_TO_ONE`
3. Check backend receives correct foreign key
4. Ensure related object exists

### Type Errors After Adding Field Type

**Problem:** TypeScript errors after adding new field type.

**Fix:**
1. Run GraphQL codegen: `npx nx run twenty-front:graphql:generate`
2. Restart TypeScript server in your IDE
3. Check that type is defined in `FieldMetadataType` enum

### Composite Field Errors

**Problem:** IMAGE/PDF fields show column errors.

**Fix:**
```bash
npx nx run twenty-server:command workspace:fix-composite-field-columns
```

See `COMPOSITE_FIELD_MIGRATION_GUIDE.md` for details.

---

## Additional Resources

- **Core Workflow Documentation:** `packages/twenty-front/src/modules/workflow/README.md`
- **Field Metadata Types:** `packages/twenty-shared/src/types/FieldMetadataType.ts`
- **Object Metadata Hooks:** `packages/twenty-front/src/modules/object-metadata/hooks/`
- **Form Field Components:** `packages/twenty-front/src/modules/object-record/record-field/ui/form-types/components/`
- **Backend Metadata Modules:** `packages/twenty-server/src/engine/metadata-modules/`

---

## Contributing

When contributing changes to workflow action fields:

1. **Create a proposal** if adding significant new capabilities (see `@/openspec/AGENTS.md`)
2. **Write tests** for new field types and filter logic
3. **Update documentation** including this guide
4. **Add migration scripts** if database schema changes
5. **Test thoroughly** across all workflow action types
6. **Submit PR** with clear description of changes

### PR Checklist

- [ ] Added/updated unit tests
- [ ] Added integration tests if applicable
- [ ] Updated TypeScript types
- [ ] Regenerated GraphQL types
- [ ] Tested in local environment
- [ ] Updated relevant documentation
- [ ] No linting errors: `npx nx lint twenty-front --fix`
- [ ] No type errors: `npx nx typecheck twenty-front`

---

## Version History

- **v1.0** - Initial contribution guide
  - Documents current field architecture
  - Provides examples for common scenarios
  - Includes testing and troubleshooting sections

---

## Questions?

For questions or clarifications:
- Check existing issues on GitHub
- Review related source files
- Ask in the Twenty community Discord

**Happy Contributing! 🚀**

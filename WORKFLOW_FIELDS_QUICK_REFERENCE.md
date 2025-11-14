# Workflow Action Fields - Quick Reference

Quick reference for developers working with workflow action menu fields in Twenty CRM.

## 📍 Key Files

### Frontend
```
packages/twenty-front/src/modules/workflow/
├── components/
│   └── WorkflowEditUpdateEventFieldsMultiSelect.tsx  ← Main field selector
├── workflow-steps/workflow-actions/
│   ├── utils/shouldDisplayFormField.ts               ← Filter logic
│   └── components/
│       ├── WorkflowCreateRecordBody.tsx              ← CREATE action
│       ├── WorkflowEditActionUpdateRecord.tsx        ← UPDATE action
│       └── WorkflowFormFieldInput.tsx                ← Field input wrapper

packages/twenty-front/src/modules/object-metadata/
└── utils/formatFieldMetadataItemAsFieldDefinition.ts ← Field formatter
```

### Backend
```
packages/twenty-server/src/
├── engine/twenty-orm/
│   ├── base.workspace-entity.ts                      ← Base fields (id, createdAt, etc.)
│   └── custom.workspace-entity.ts                    ← Custom object base
└── modules/*/standard-objects/
    └── *.workspace-entity.ts                         ← Object definitions
```

---

## 🔧 Common Tasks

### Add New Field Type

1. **Update supported types:**
```typescript
// shouldDisplayFormField.ts
const SUPPORTED_FORM_FIELD_TYPES = [
  // ... existing
  FieldMetadataType.YOUR_NEW_TYPE,
];
```

2. **Create form input (if needed):**
```typescript
// FormYourNewTypeFieldInput.tsx
export const FormYourNewTypeFieldInput = ({ value, onChange }) => {
  return <YourInput value={value} onChange={onChange} />;
};
```

3. **Wire up in FormFieldInput.tsx:**
```typescript
case FieldMetadataType.YOUR_NEW_TYPE:
  return <FormYourNewTypeFieldInput {...props} />;
```

### Define Field in Backend

```typescript
@WorkspaceField({
  standardId: YOUR_STANDARD_FIELD_ID,
  type: FieldMetadataType.TEXT,
  label: msg`Display Label`,
  description: msg`Helpful description`,
  icon: 'IconName',
})
fieldName: string;
```

### Show System Fields

```typescript
// shouldDisplayFormField.ts - Remove this line:
// !fieldMetadataItem.isSystem &&
```

### Support New Relation Type

```typescript
const isNotSupportedRelation =
  fieldMetadataItem.type === FieldMetadataType.RELATION &&
  fieldMetadataItem.settings?.['relationType'] !== 'MANY_TO_ONE' &&
  fieldMetadataItem.settings?.['relationType'] !== 'YOUR_NEW_TYPE';
```

---

## 📊 Field Filter Rules

### UPDATE_RECORD / CREATE_RECORD / UPSERT_RECORD
```typescript
✅ Type in SUPPORTED_FORM_FIELD_TYPES
✅ Active (isActive === true)
✅ Relations must be MANY_TO_ONE
❌ System fields (isSystem === true)
❌ UI read-only (isUIReadOnly === true)
```

### FIND_RECORDS
```typescript
✅ Type in SUPPORTED_FORM_FIELD_TYPES
✅ Active (isActive === true)
✅ Relations must be MANY_TO_ONE
✅ System fields ALLOWED (except id has special handling)
❌ UI read-only (still blocked)
```

---

## 🎯 Supported Field Types (20)

```typescript
TEXT            NUMBER          DATE            BOOLEAN
SELECT          MULTI_SELECT    EMAILS          LINKS
FULL_NAME       ADDRESS         PHONES          CURRENCY
DATE_TIME       RAW_JSON        UUID            ARRAY
RELATION        RICH_TEXT_V2    PDF             IMAGE
```

---

## 🔄 Field Processing Flow

```
objectMetadataItem.fields
  ↓
Filter: shouldDisplayFormField()
  ↓
Sort: alphabetically by name
  ↓
Format: formatFieldMetadataItemAsFieldDefinition()
  ↓
Transform: relations → fieldNameId
  ↓
Render: FormMultiSelectFieldInput
```

---

## 🗂️ Composite Field Types

| Type | Sub-fields |
|------|-----------|
| CURRENCY | amountMicros, currencyCode |
| EMAILS | primaryEmail, additionalEmails |
| LINKS | primaryLinkUrl, secondaryLinks |
| PHONES | primaryPhoneCallingCode, additionalPhones |
| FULL_NAME | firstName, lastName |
| ADDRESS | addressStreet1, addressCity, addressPostcode, etc. |
| ACTOR | source, name, workspaceMemberId, context |
| RICH_TEXT_V2 | blocknote, markdown |
| PDF | attachmentIds |
| IMAGE | attachmentIds |

---

## ⚡ Quick Commands

```bash
# Development
yarn start                                              # Start full stack

# Generate migration
npx nx run twenty-server:typeorm migration:generate \
  src/database/typeorm/core/migrations/common/[name] \
  -d src/database/typeorm/core/core.datasource.ts

# Run migrations
npx nx run twenty-server:database:migrate:prod
npx nx run twenty-server:command workspace:sync-metadata -f

# Fix composite fields
npx nx run twenty-server:command workspace:fix-composite-field-columns

# Testing
npx nx test twenty-front                               # Frontend tests
npx nx test twenty-server                              # Backend tests
npx nx lint twenty-front --fix                         # Lint & fix
npx nx typecheck twenty-front                          # Type check

# GraphQL
npx nx run twenty-front:graphql:generate               # Regenerate types
```

---

## 🐛 Common Issues

### Fields Not Showing
```
✓ Check SUPPORTED_FORM_FIELD_TYPES includes your type
✓ Verify isActive === true
✓ Ensure isSystem === false (for UPDATE_RECORD)
✓ Ensure isUIReadOnly === false
✓ Check relation type is MANY_TO_ONE
```

### Relation Fields Not Saving
```
✓ Use fieldNameId format, not fieldName
✓ Verify relation type is MANY_TO_ONE
✓ Check foreign key exists in database
✓ Ensure related object exists
```

### Composite Field Errors
```bash
# Run the fix command:
npx nx run twenty-server:command workspace:fix-composite-field-columns
```

### Type Errors
```bash
# Regenerate GraphQL types:
npx nx run twenty-front:graphql:generate
# Restart TypeScript server in IDE
```

---

## 📝 Code Snippets

### Get Object Fields
```typescript
const fields = objectMetadataItem?.fields
  .filter(field => shouldDisplayFormField({
    fieldMetadataItem: field,
    actionType: 'UPDATE_RECORD',
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
```

### Format for Display
```typescript
const fieldDefinitions = fields.map(field =>
  formatFieldMetadataItemAsFieldDefinition({
    field,
    objectMetadataItem,
    showLabel: true,
    labelWidth: 90,
  })
);
```

### Handle Relation Values
```typescript
const value = fieldDefinitions.map(field => {
  if (isFieldRelation(field.metadata)) {
    return `${field.metadata.fieldName}Id`;  // Append 'Id'
  }
  return field.metadata.fieldName;
});
```

### Define Custom Field
```typescript
@WorkspaceObject({
  standardId: OBJECT_STANDARD_ID,
  namePlural: 'myObjects',
  nameSingular: 'myObject',
  labelPlural: msg`My Objects`,
  labelSingular: msg`My Object`,
})
export class MyObjectWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: FIELD_STANDARD_ID,
    type: FieldMetadataType.TEXT,
    label: msg`Custom Field`,
    description: msg`A custom field`,
    icon: 'IconCustom',
  })
  customField: string;
}
```

---

## 🎨 Field Definition Structure

```typescript
{
  fieldMetadataId: string;        // UUID
  label: string;                  // Display label
  showLabel?: boolean;            // Show label in form
  labelWidth?: number;            // Label width in pixels
  type: FieldMetadataType;        // Field type enum
  metadata: {
    fieldName: string;            // Database column name
    placeHolder: string;          // Form placeholder
    relationType?: string;        // For relations
    relationObjectMetadataId?: string;
    relationFieldMetadataId?: string;
    options?: any;                // For SELECT/MULTI_SELECT
    settings?: any;               // Type-specific settings
    isNullable: boolean;
    isCustom: boolean;
    isUIReadOnly: boolean;
  };
  iconName: string;               // Icon identifier
  defaultValue?: any;             // Default value
  editButtonIcon?: IconComponent; // Edit button icon
}
```

---

## 🔍 Debugging Tips

### Log Field Metadata
```typescript
console.log('Available fields:', objectMetadataItem?.fields);
console.log('Filtered fields:', inlineFieldMetadataItems);
console.log('Field definitions:', inlineFieldDefinitions);
```

### Check Filter Result
```typescript
fields.forEach(field => {
  const shouldDisplay = shouldDisplayFormField({
    fieldMetadataItem: field,
    actionType: 'UPDATE_RECORD',
  });
  console.log(`${field.name}: ${shouldDisplay}`, {
    type: field.type,
    isActive: field.isActive,
    isSystem: field.isSystem,
    isUIReadOnly: field.isUIReadOnly,
  });
});
```

### Verify Metadata Sync
```bash
# After backend changes, always sync:
npx nx run twenty-server:command workspace:sync-metadata -f
```

---

## 📚 Related Documentation

- **Full Guide:** `WORKFLOW_ACTION_FIELDS_CONTRIBUTION_GUIDE.md`
- **Verification:** `WORKFLOW_FIELDS_VERIFICATION.md`
- **Composite Fields:** `COMPOSITE_FIELD_MIGRATION_GUIDE.md`
- **Project Instructions:** `CLAUDE.md`

---

## ✅ Testing Checklist

- [ ] Field appears in action menu
- [ ] Correct input component renders
- [ ] Value saves correctly
- [ ] Workflow executes successfully
- [ ] No console errors
- [ ] Linting passes: `npx nx lint twenty-front --fix`
- [ ] Types pass: `npx nx typecheck twenty-front`
- [ ] Tests pass: `npx nx test twenty-front`
- [ ] GraphQL types regenerated if needed

---

**Last Updated:** 2024  
**For Full Details:** See `WORKFLOW_ACTION_FIELDS_CONTRIBUTION_GUIDE.md`

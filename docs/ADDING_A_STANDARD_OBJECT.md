# Adding a New Standard Object – Full Checklist

The Mortgage rollout touched every layer of the stack. This document captures **where**, **why**, and **exactly what** changed so you can repeat the process without rediscovering the pitfalls. Each subsection shows the relevant code snippet taken from the current branch (`11-14-new_default_custom_objects`).

---

## 1. Server Metadata & ORM

### `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-ids.ts`
- **Why**: Every standard object is referenced by a deterministic UUID for migrations, metadata comparisons, and seeds.  
- **What**: Reserve a new UUID and add it to `STANDARD_OBJECT_IDS`.
```diff
   opportunity: '20202020-9549-49dd-b2b2-883999db8938',
   person: '20202020-e674-48e5-a542-72570eee7213',
+  mortgage: '20202020-9b2d-4c1e-9f42-84f0b5a0c9d1',
   task: '20202020-1ba1-48ba-bc83-ef7e5990ed10',
```

### `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids.ts`
- **Why**: Sync relies on stable field IDs (including relations) to diff metadata across workspaces.
- **What**:
  - Added `MORTGAGE_STANDARD_FIELD_IDS`.
  - Registered mortgage IDs in attachment, timeline, favorite, note target, task target, and person constants.
  - Linked the mortgage block inside `STANDARD_OBJECT_FIELD_IDS`.
```diff
 export const ATTACHMENT_STANDARD_FIELD_IDS = {
   opportunity: '20202020-7374-499d-bea3-9354890755b5',
+  mortgage: '20202020-9a3b-4c5d-8e6f-b4c5d6e7f8a9',
   dashboard: '20202020-5324-43f3-9dbf-1a33e7de0ce6',
```
```diff
+export const MORTGAGE_STANDARD_FIELD_IDS = {
+  name: '20202020-1c8e-4c9a-9a33-01a27f5c7b10',
+  principalAmount: '20202020-2a41-4f3c-8ea5-19b74c5a8d21',
+  ...
+  timelineActivities: '20202020-c5fc-4e25-9ea4-c0921de4d3cb',
+  searchVector: '20202020-d16e-4f77-8fb7-d1a33ef5e4dc',
+} as const;
```
```diff
 export const STANDARD_OBJECT_FIELD_IDS = {
   person: PERSON_STANDARD_FIELD_IDS,
+  mortgage: MORTGAGE_STANDARD_FIELD_IDS,
   task: TASK_STANDARD_FIELD_IDS,
```

### `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-icons.ts`
- **Why**: Icon registry feeds the metadata UI, navigation drawer, and view picker.
- **What**: Added the mortgage icon key.
```diff
   opportunity: 'IconTargetArrow',
   person: 'IconUser',
+  mortgage: 'IconBuildingBank',
   task: 'IconCheckbox',
```

### `packages/twenty-server/src/modules/mortgage/standard-objects/mortgage.workspace-entity.ts` (new)
- **Why**: The workspace entity is the single source of truth for fields, relations, search behavior, and migrations.
- **What**: Implemented the full Mortgage schema (business fields + system fields + relation suite).
```ts
@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.mortgage,
  namePlural: 'mortgages',
  labelSingular: msg`Mortgage`,
  labelPlural: msg`Mortgages`,
  icon: STANDARD_OBJECT_ICONS.mortgage,
  labelIdentifierStandardId: MORTGAGE_STANDARD_FIELD_IDS.name,
})
@WorkspaceIsSearchable()
export class MortgageWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({ standardId: MORTGAGE_STANDARD_FIELD_IDS.name, type: FieldMetadataType.TEXT, ... })
  name: string;
  ...
  @WorkspaceRelation({
    standardId: MORTGAGE_STANDARD_FIELD_IDS.borrower,
    type: RelationType.MANY_TO_ONE,
    inverseSideTarget: () => PersonWorkspaceEntity,
    inverseSideFieldKey: 'mortgages',
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  borrower: Relation<PersonWorkspaceEntity> | null;
  ...
}
```

### `packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts`
- **Why**: Borrowers need the inverse (Person → Mortgages) relation so sync can attach `person.mortgages`.
- **What**: Imported `MortgageWorkspaceEntity` and added a ONE_TO_MANY relation.
```diff
 import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/...';
+import { MortgageWorkspaceEntity } from 'src/modules/mortgage/...';
 ...
+  @WorkspaceRelation({
+    standardId: PERSON_STANDARD_FIELD_IDS.mortgages,
+    type: RelationType.ONE_TO_MANY,
+    inverseSideTarget: () => MortgageWorkspaceEntity,
+    inverseSideFieldKey: 'borrower',
+    onDelete: RelationOnDeleteAction.SET_NULL,
+  })
+  mortgages: Relation<MortgageWorkspaceEntity[]>;
```

### `packages/twenty-server/src/modules/favorite/standard-objects/favorite.workspace-entity.ts`
- **Why**: Favorites need a `mortgage` target so “star” actions work and the sidebar can list mortgage views.
- **What**: Added the MANY_TO_ONE mortgage relation and join column.
```diff
+  @WorkspaceRelation({
+    standardId: FAVORITE_STANDARD_FIELD_IDS.mortgage,
+    type: RelationType.MANY_TO_ONE,
+    inverseSideTarget: () => MortgageWorkspaceEntity,
+    inverseSideFieldKey: 'favorites',
+  })
+  mortgage: Relation<MortgageWorkspaceEntity> | null;
```

### `packages/twenty-server/src/modules/task/standard-objects/task-target.workspace-entity.ts`
- **Why**: Task targets power task-mortgage associations; workspace sync expects both sides of the relation.
- **What**: Added the MANY_TO_ONE mortgage relation and join column.
```diff
+  @WorkspaceRelation({
+    standardId: TASK_TARGET_STANDARD_FIELD_IDS.mortgage,
+    type: RelationType.MANY_TO_ONE,
+    inverseSideTarget: () => MortgageWorkspaceEntity,
+    inverseSideFieldKey: 'taskTargets',
+  })
+  mortgage: Relation<MortgageWorkspaceEntity> | null;
```

### `packages/twenty-server/src/modules/note/standard-objects/note-target.workspace-entity.ts`
- **Why**: Notes use “targets” to link back to records; mortgages need to be a valid target.
- **What**: Added the MANY_TO_ONE mortgage relation and join column.
```diff
+  @WorkspaceRelation({
+    standardId: NOTE_TARGET_STANDARD_FIELD_IDS.mortgage,
+    type: RelationType.MANY_TO_ONE,
+    inverseSideTarget: () => MortgageWorkspaceEntity,
+    inverseSideFieldKey: 'noteTargets',
+  })
+  mortgage: Relation<MortgageWorkspaceEntity> | null;
```

### `packages/twenty-server/src/modules/attachment/standard-objects/attachment.workspace-entity.ts`
- **Why**: Attachments must be able to associate with mortgage records.
- **What**: Added the MANY_TO_ONE mortgage relation.
```diff
+  @WorkspaceRelation({
+    standardId: ATTACHMENT_STANDARD_FIELD_IDS.mortgage,
+    type: RelationType.MANY_TO_ONE,
+    inverseSideTarget: () => MortgageWorkspaceEntity,
+    inverseSideFieldKey: 'attachments',
+  })
+  mortgage: Relation<MortgageWorkspaceEntity> | null;
```

### `packages/twenty-server/src/modules/timeline/standard-objects/timeline-activity.workspace-entity.ts`
- **Why**: Timeline entries need to point to mortgages for audit/history features.
- **What**: Added the MANY_TO_ONE mortgage relation and join column.
```diff
+  @WorkspaceRelation({
+    standardId: TIMELINE_ACTIVITY_STANDARD_FIELD_IDS.mortgage,
+    type: RelationType.MANY_TO_ONE,
+    inverseSideTarget: () => MortgageWorkspaceEntity,
+    inverseSideFieldKey: 'timelineActivities',
+  })
+  mortgage: Relation<MortgageWorkspaceEntity> | null;
```

### `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/standard-objects/index.ts`
- **Why**: Metadata sync only scans the entities listed in this array.
- **What**: Registered `MortgageWorkspaceEntity`.
```diff
 import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/...';
+import { MortgageWorkspaceEntity } from 'src/modules/mortgage/...';
 ...
   OpportunityWorkspaceEntity,
+  MortgageWorkspaceEntity,
   PersonWorkspaceEntity,
```

---

## 2. Prefill Views & Favorites

### `packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/views/mortgages-all.view.ts`
- **Why**: New workspaces need a ready-to-use mortgage view (`key: INDEX`) so the UI has columns and counts.
- **What**: Added a view factory mirroring the other `*-all.view.ts` files.
```ts
export const mortgagesAllView = (...) => {
  const mortgageObjectMetadata = objectMetadataItems.find(
    (object) => object.standardId === STANDARD_OBJECT_IDS.mortgage,
  );

  return {
    name: useCoreNaming ? msg`All {objectLabelPlural}` : 'All Mortgages',
    objectMetadataId: mortgageObjectMetadata.id,
    type: 'table',
    fields: [
      { fieldMetadataId: ...MORTGAGE_STANDARD_FIELD_IDS.name, ... },
      { fieldMetadataId: ...principalAmount, aggregateOperation: AggregateOperations.SUM },
      ...
    ],
  };
};
```

### `packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/prefill-core-views.ts`
- **Why**: Ensures the mortgage view is created and auto-favorited during workspace provisioning.
- **What**: Imported `mortgagesAllView` and appended it to the `views` array.
```diff
 import { peopleAllView } from '.../people-all.view';
+import { mortgagesAllView } from '.../mortgages-all.view';
 ...
   const views = [
     companiesAllView(...),
     peopleAllView(...),
     opportunitiesAllView(...),
+    mortgagesAllView(...),
```

---

## 3. Front-End Object Registration & Navigation

### `packages/twenty-front/src/modules/object-metadata/types/CoreObjectNameSingular.ts`  
### `packages/twenty-front/src/modules/object-metadata/types/CoreObjectNamePlural.ts`
- **Why**: Routing, view selection, and permission hooks use these enums.
- **What**: Added `Mortgage = 'mortgage'` / `'mortgages'`.
```diff
 export enum CoreObjectNameSingular {
   Opportunity = 'opportunity',
+  Mortgage = 'mortgage',
   Person = 'person',
```

### `packages/twenty-front/src/modules/object-metadata/components/NavigationDrawerSectionForObjectMetadataItems.tsx`
- **Why**: The “Workspace” section shows objects in `ORDERED_STANDARD_OBJECTS`. Mortgage must be part of this ordering.
- **What**: Inserted `CoreObjectNameSingular.Mortgage`.
```diff
 const ORDERED_STANDARD_OBJECTS: string[] = [
   CoreObjectNameSingular.Opportunity,
+  CoreObjectNameSingular.Mortgage,
   CoreObjectNameSingular.Task,
```

### `packages/twenty-front/src/modules/favorites/hooks/useWorkspaceFavorites.ts`
- **Why**: The sidebar previously considered only workspace-wide favorites, ignoring user favorites (which is how new views get starred).
- **What**: Combine workspace favorites and user favorites before running `sortFavorites`.
```diff
-  const { workspaceFavorites } = usePrefetchedFavoritesData();
+  const { workspaceFavorites, favorites } = usePrefetchedFavoritesData();
 ...
-  const sortedWorkspaceFavorites = useMemo(
-    () => sortFavorites(workspaceFavorites.filter((favorite) => favorite.viewId), ...),
-  );
+  const sortedWorkspaceFavorites = useMemo(() => {
+    const allViewFavorites = [...workspaceFavorites, ...favorites].filter(
+      (favorite) => favorite.viewId,
+    );
+    return sortFavorites(allViewFavorites, ...);
+  }, [...]);
```

---

## 4. Front-End UX Fixes (Views, Actions, Table)

### `packages/twenty-front/src/modules/action-menu/actions/record-actions/single-record/components/ExportSingleRecordAction.tsx`
- **Why**: Export crashed if no current view ID was set (common when a new object has no view yet).
- **What**: Removed the dependency on `contextStoreCurrentViewIdComponentState`; export now only depends on the selected record.
```diff
-import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
-import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
 ...
-  const contextStoreCurrentViewId = useRecoilComponentValue(...);
-  if (!contextStoreCurrentViewId) {
-    throw new Error('Current view ID is not defined');
-  }
```

### `packages/twenty-front/src/modules/object-record/record-table/record-table-header/hooks/useResizeTableHeader.ts`
- **Why**: Column resizing threw before record fields initialized, breaking the entire Mortgage grid.
- **What**: Guarded both handlers instead of throwing hard errors.
```diff
-      throwIfNotDefined(recordField, 'recordField');
+      if (!recordField) {
+        return;
+      }
```

### `packages/twenty-front/src/modules/views/hooks/useOpenCreateViewDropown.ts`
- **Why**: “Add view” silently failed unless a current view existed. Mortgage didn’t have one yet.
- **What**: Always open the create dropdown; set the reference view only when present.
```diff
   if (isDefined(referenceView?.id)) {
     setViewPickerReferenceViewId(referenceView.id);
-    setViewPickerMode('create-empty');
-    openDropdown(...);
   }

+  setViewPickerMode('create-empty');
+  openDropdown(...);
```

### `packages/twenty-front/src/modules/views/view-picker/hooks/useCreateViewFromCurrentState.ts`
- **Why**: If view creation bailed early, `viewPickerIsPersisting` stayed `true`, permanently disabling the Create button.
- **What**: Wrap the create call in `try/finally` to reset the flag.
```diff
         set(viewPickerIsPersistingCallbackState, true);
         set(viewPickerIsDirtyCallbackState, false);
-
-        const createdViewId = await createViewFromCurrentView(...);
-        ...
-        if (isDefined(createdViewId)) { ... }
+        try {
+          const createdViewId = await createViewFromCurrentView(...);
+          if (isDefined(createdViewId)) { ... }
+        } finally {
+          set(viewPickerIsPersistingCallbackState, false);
+        }
```

### `packages/twenty-front/src/modules/views/hooks/useCreateViewFromCurrentView.ts`
- **Why**: The hook refused to create a view unless a template view existed, blocking the first Mortgage view entirely.
- **What**:
  - Treat `currentViewId`/`sourceView` as optional.
  - Provide defaults (name/icon/type/openRecordIn/objectMetadataId) when no template exists.
  - Skip cloning `viewFields` if there is no source view.
```diff
-        if (!isDefined(currentViewId)) {
-          return undefined;
-        }
-        const sourceView = snapshot.getLoadable(...).getValue();
-        if (!isDefined(sourceView)) {
-          return undefined;
-        }
...
-        const viewType = type ?? sourceView.type;
+        const hasTemplateView = isDefined(currentViewId);
+        const sourceView = hasTemplateView ? snapshot.getLoadable(...).getValue() : undefined;
+        const viewType = type ?? sourceView?.type ?? ViewType.Table;
...
             id: id ?? v4(),
-            name: name ?? sourceView.name,
-            icon: icon ?? sourceView.icon,
+            name: name ?? sourceView?.name ?? 'New view',
+            icon: icon ?? sourceView?.icon ?? 'IconList',
             type: convertViewTypeToCore(viewType),
-            objectMetadataId: sourceView.objectMetadataId,
-            openRecordIn: convertViewOpenRecordInToCore(sourceView.openRecordIn),
+            objectMetadataId: sourceView?.objectMetadataId ?? objectMetadataItem.id,
+            openRecordIn: hasTemplateView && sourceView
+              ? convertViewOpenRecordInToCore(sourceView.openRecordIn)
+              : convertViewOpenRecordInToCore(ViewOpenRecordIn.SIDE_PANEL),
...
-        const fieldResult = await createViewFields({
-          inputs: sourceView.viewFields.map(...),
-        });
-        if (fieldResult.status === 'failed') { ... }
+        if (sourceView) {
+          const fieldResult = await createViewFields({ inputs: sourceView.viewFields.map(...) });
+          if (fieldResult.status === 'failed') { ... }
+        }
```

---

## 5. Prefill View Registration in Metadata Sync

### `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/standard-objects/index.ts`
- Already covered above but restated: ensures Mortgage metadata is created during sync.

---

## 6. Validation Steps

1. **Backend**
   - Run `nx run twenty-server:command workspace:sync-metadata --skip-nx-cache` for an existing workspace; fix any relation errors.
   - Seed a new workspace (or rerun the dev seeder) to verify `mortgages_all` view creation and favorites.
2. **Front-End**
   - Navigate to `/objects/mortgages`:
     - Table loads without console errors.
     - View picker → “Add view” → “Create” works.
     - Starring the view surfaces Mortgages in the “Workspace” sidebar section.
     - 3-dot menu actions (Export, etc.) work without “view ID” exceptions.
3. **Regression**: Resize columns, export records, and create views on other objects to ensure generic components still behave.

Following this checklist touches every file we needed for Mortgage (23+ files). Copy/paste the relevant sections and substitute new object names/IDs/icons to onboard the next standard object without weeks of “why doesn’t the sidebar show it?” debugging.

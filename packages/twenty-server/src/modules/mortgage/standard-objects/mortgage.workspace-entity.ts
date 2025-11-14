import { msg } from '@lingui/core/macro';
import {
  ActorMetadata,
  CurrencyMetadata,
  FieldMetadataType,
  RelationOnDeleteAction,
} from 'twenty-shared/types';

import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { Relation } from 'src/engine/workspace-manager/workspace-sync-metadata/interfaces/relation.interface';

import { SEARCH_VECTOR_FIELD } from 'src/engine/metadata-modules/constants/search-vector-field.constants';
import { IndexType } from 'src/engine/metadata-modules/index-metadata/types/indexType.types';
import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceFieldIndex } from 'src/engine/twenty-orm/decorators/workspace-field-index.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsFieldUIReadOnly } from 'src/engine/twenty-orm/decorators/workspace-is-field-ui-readonly.decorator';
import { WorkspaceIsNullable } from 'src/engine/twenty-orm/decorators/workspace-is-nullable.decorator';
import { WorkspaceIsSearchable } from 'src/engine/twenty-orm/decorators/workspace-is-searchable.decorator';
import { WorkspaceIsSystem } from 'src/engine/twenty-orm/decorators/workspace-is-system.decorator';
import { WorkspaceJoinColumn } from 'src/engine/twenty-orm/decorators/workspace-join-column.decorator';
import { WorkspaceRelation } from 'src/engine/twenty-orm/decorators/workspace-relation.decorator';
import { MORTGAGE_STANDARD_FIELD_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids';
import { STANDARD_OBJECT_ICONS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-icons';
import { STANDARD_OBJECT_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-ids';
import {
  type FieldTypeAndNameMetadata,
  getTsVectorColumnExpressionFromFields,
} from 'src/engine/workspace-manager/workspace-sync-metadata/utils/get-ts-vector-column-expression.util';
import { AttachmentWorkspaceEntity } from 'src/modules/attachment/standard-objects/attachment.workspace-entity';
import { FavoriteWorkspaceEntity } from 'src/modules/favorite/standard-objects/favorite.workspace-entity';
import { NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { TaskTargetWorkspaceEntity } from 'src/modules/task/standard-objects/task-target.workspace-entity';
import { TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';

const NAME_FIELD_NAME = 'name';

export const SEARCH_FIELDS_FOR_MORTGAGE: FieldTypeAndNameMetadata[] = [
  { name: NAME_FIELD_NAME, type: FieldMetadataType.TEXT },
];

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
export class MortgageWorkspaceEntity extends BaseWorkspaceEntity {
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

  @WorkspaceRelation({
    standardId: MORTGAGE_STANDARD_FIELD_IDS.borrower,
    type: RelationType.MANY_TO_ONE,
    label: msg`Borrower`,
    description: msg`Person who borrows the mortgage`,
    icon: 'IconUser',
    inverseSideTarget: () => PersonWorkspaceEntity,
    inverseSideFieldKey: 'mortgages',
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  @WorkspaceIsNullable()
  borrower: Relation<PersonWorkspaceEntity> | null;

  @WorkspaceJoinColumn('borrower')
  borrowerId: string | null;

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
}

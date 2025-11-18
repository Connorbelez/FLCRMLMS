import { msg } from '@lingui/core/macro';

import { AggregateOperations } from 'src/engine/api/graphql/graphql-query-runner/constants/aggregate-operations.constant';
import { type ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { MORTGAGE_STANDARD_FIELD_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids';
import { STANDARD_OBJECT_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-ids';

export const mortgagesAllView = (
  objectMetadataItems: ObjectMetadataEntity[],
  useCoreNaming = false,
) => {
  const mortgageObjectMetadata = objectMetadataItems.find(
    (object) => object.standardId === STANDARD_OBJECT_IDS.mortgage,
  );

  if (!mortgageObjectMetadata) {
    throw new Error('Mortgage object metadata not found');
  }

  return {
    name: useCoreNaming ? msg`All {objectLabelPlural}` : 'All Mortgages',
    objectMetadataId: mortgageObjectMetadata.id,
    type: 'table',
    key: 'INDEX',
    position: 0,
    icon: 'IconList',
    kanbanFieldMetadataId: '',
    filters: [],
    fields: [
      {
        fieldMetadataId:
          mortgageObjectMetadata.fields.find(
            (field) => field.standardId === MORTGAGE_STANDARD_FIELD_IDS.name,
          )?.id ?? '',
        position: 0,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          mortgageObjectMetadata.fields.find(
            (field) =>
              field.standardId ===
              MORTGAGE_STANDARD_FIELD_IDS.principalAmount,
          )?.id ?? '',
        position: 1,
        isVisible: true,
        size: 150,
        aggregateOperation: AggregateOperations.SUM,
      },
      {
        fieldMetadataId:
          mortgageObjectMetadata.fields.find(
            (field) =>
              field.standardId === MORTGAGE_STANDARD_FIELD_IDS.interestRate,
          )?.id ?? '',
        position: 2,
        isVisible: true,
        size: 150,
        aggregateOperation: AggregateOperations.AVG,
      },
      {
        fieldMetadataId:
          mortgageObjectMetadata.fields.find(
            (field) => field.standardId === MORTGAGE_STANDARD_FIELD_IDS.ltv,
          )?.id ?? '',
        position: 3,
        isVisible: true,
        size: 150,
        aggregateOperation: AggregateOperations.AVG,
      },
      {
        fieldMetadataId:
          mortgageObjectMetadata.fields.find(
            (field) =>
              field.standardId === MORTGAGE_STANDARD_FIELD_IDS.borrower,
          )?.id ?? '',
        position: 4,
        isVisible: true,
        size: 150,
      },
    ],
  };
};


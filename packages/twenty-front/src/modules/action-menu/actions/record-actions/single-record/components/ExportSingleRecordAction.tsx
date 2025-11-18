import { Action } from '@/action-menu/actions/components/Action';
import { useSelectedRecordIdOrThrow } from '@/action-menu/actions/record-actions/single-record/hooks/useSelectedRecordIdOrThrow';
import { useContextStoreObjectMetadataItemOrThrow } from '@/context-store/hooks/useContextStoreObjectMetadataItemOrThrow';
import { useExportSingleRecord } from '@/object-record/record-show/hooks/useExportSingleRecord';

export const ExportSingleRecordAction = () => {
  const { objectMetadataItem } = useContextStoreObjectMetadataItemOrThrow();

  const recordId = useSelectedRecordIdOrThrow();

  const filename = `${objectMetadataItem.nameSingular}.csv`;
  const { download } = useExportSingleRecord({
    filename,
    objectMetadataItem,
    recordId,
  });

  return <Action onClick={download} />;
};

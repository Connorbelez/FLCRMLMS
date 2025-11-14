import { AttachmentGrid } from '@/activities/files/components/AttachmentGrid';
import { AttachmentPreviewModal } from '@/activities/files/components/AttachmentPreviewModal';
import { AttachmentSelector } from '@/activities/files/components/AttachmentSelector';
import {
  hasImageExtension,
  IMAGE_EXTENSIONS,
} from '@/activities/files/constants/imageExtensions';
import { useAttachments } from '@/activities/files/hooks/useAttachments';
import { useAttachmentsByIds } from '@/activities/files/hooks/useAttachmentsByIds';
import { useUploadAttachmentFile } from '@/activities/files/hooks/useUploadAttachmentFile';
import { type Attachment } from '@/activities/files/types/Attachment';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { isAttachmentPreviewEnabledState } from '@/client-config/states/isAttachmentPreviewEnabledState';
import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useImageField } from '@/object-record/record-field/ui/meta-types/hooks/useImageField';
import { FieldInputContainer } from '@/ui/field/input/components/FieldInputContainer';
import { Modal } from '@/ui/layout/modal/components/Modal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import styled from '@emotion/styled';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  type ChangeEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRecoilValue } from 'recoil';
import { isDefined } from 'twenty-shared/utils';
import { IconLink, IconUpload } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
  min-width: 300px;
`;

const StyledButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledFileInput = styled.input`
  display: none;
`;

const StyledEmptyState = styled.div`
  padding: ${({ theme }) => theme.spacing(4)};
  text-align: center;
  color: ${({ theme }) => theme.font.color.tertiary};
  border: 1px dashed ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
`;

const MODAL_ID = 'image-field-attachment-selector';
const PREVIEW_MODAL_ID = 'image-field-preview-modal';

export const ImageFieldInput = () => {
  const { t } = useLingui();
  const { recordId, objectMetadataNameSingular, draftValue } = useImageField();
  const { onEscape, onSubmit } = useContext(FieldInputEventContext);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const { uploadAttachmentFile } = useUploadAttachmentFile();
  const { openModal, closeModal } = useModal();
  const [isUploading, setIsUploading] = useState(false);
  const [previewedAttachment, setPreviewedAttachment] =
    useState<Attachment | null>(null);
  const isAttachmentPreviewEnabled = useRecoilValue(
    isAttachmentPreviewEnabledState,
  );

  // Memoize attachmentIds to prevent infinite useEffect loop (new array reference every render)
  const attachmentIds = useMemo(
    () => draftValue?.attachmentIds || [],
    [draftValue?.attachmentIds],
  );
  const { attachments, loading } = useAttachmentsByIds(attachmentIds);

  // Check if we have valid object metadata to enable "Link Existing"
  const canLinkExisting =
    objectMetadataNameSingular && objectMetadataNameSingular.trim() !== '';

  // Memoize targetableObject to prevent infinite re-renders
  const targetableObject: ActivityTargetableObject = useMemo(
    () => ({
      id: recordId,
      targetObjectNameSingular: objectMetadataNameSingular || '',
    }),
    [recordId, objectMetadataNameSingular],
  );

  // Always call useAttachments (hooks can't be conditional), but skip query if not needed
  const shouldFetchAllAttachments =
    canLinkExisting && targetableObject.targetObjectNameSingular.trim() !== '';
  const { attachments: allAttachments } = useAttachments(
    shouldFetchAllAttachments
      ? targetableObject
      : { id: '', targetObjectNameSingular: '' },
  );

  const isImageAttachment = (name: string, fileCategory: string) => {
    if (fileCategory === 'IMAGE') {
      return true;
    }

    return hasImageExtension(name);
  };

  const handleUploadClick = () => {
    inputFileRef?.current?.click?.();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!isDefined(e.target.files) || e.target.files.length === 0) {
      return;
    }

    setIsUploading(true);

    try {
      const uploadedData: {
        ids: string[];
        paths: string[];
        names: string[];
        types: string[];
      } = { ids: [], paths: [], names: [], types: [] };

      for (const file of Array.from(e.target.files)) {
        const result = await uploadAttachmentFile(file, targetableObject);
        if (result?.attachment !== undefined) {
          uploadedData.ids.push(result.attachment.id);
          uploadedData.paths.push(result.attachment.fullPath);
          uploadedData.names.push(result.attachment.name);
          const attachmentType =
            result.attachment.type || file.type || 'application/octet-stream';
          uploadedData.types.push(attachmentType);
        }
      }

      const newValue = {
        attachmentIds: [...attachmentIds, ...uploadedData.ids],
        fullPaths: [...(draftValue?.fullPaths || []), ...uploadedData.paths],
        names: [...(draftValue?.names || []), ...uploadedData.names],
        types: [...(draftValue?.types || []), ...uploadedData.types],
      };

      console.group(
        '[ImageFieldInput] handleFileChange - submitting value:',
        JSON.stringify(newValue, null, 2),
      );
      onSubmit?.({ newValue });
    } finally {
      setIsUploading(false);
      // Reset input to allow uploading the same file again
      if (inputFileRef.current !== null) {
        inputFileRef.current.value = '';
      }
    }
  };

  const [pendingSelection, setPendingSelection] =
    useState<string[]>(attachmentIds);

  // Keep pendingSelection in sync with attachmentIds (when uploading/removing outside the modal)
  useEffect(() => {
    setPendingSelection(attachmentIds);
  }, [attachmentIds]);

  const handleLinkExisting = () => {
    openModal(MODAL_ID);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setPendingSelection(selectedIds);
  };

  const handleModalClose = () => {
    closeModal(MODAL_ID);

    // Don't persist if no selection changed
    if (
      Boolean(pendingSelection.length === attachmentIds.length) &&
      pendingSelection.every((id, index) => id === attachmentIds[index])
    ) {
      return;
    }

    // Map selected IDs to their attachment details from allAttachments
    const selectedAttachments = pendingSelection
      .map((id) => {
        const attachment = allAttachments.find((a) => a.id === id);
        if (!attachment) {
          console.group(`[ImageFieldInput] Attachment not found for ID: ${id}`);
        }
        return attachment;
      })
      .filter(isDefined);

    // Ensure arrays are same length - if an attachment is missing, skip persistence
    if (selectedAttachments.length !== pendingSelection.length) {
      console.group(
        '[ImageFieldInput] Cannot persist: some attachments not found',
      );
      return;
    }

    const newValue = {
      attachmentIds: pendingSelection,
      fullPaths: selectedAttachments.map((a) => a.fullPath),
      names: selectedAttachments.map((a) => a.name),
      types: selectedAttachments.map((a) => a.type || ''),
    };

    console.group(
      '[ImageFieldInput] handleModalClose - submitting value:',
      JSON.stringify(newValue, null, 2),
    );
    onSubmit?.({ newValue });
  };

  const handleRemove = (attachmentId: string) => {
    const index = attachmentIds.indexOf(attachmentId);
    if (index === -1) return;

    const newValue = {
      attachmentIds: attachmentIds.filter(
        (_: unknown, i: number) => i !== index,
      ),
      fullPaths: (draftValue?.fullPaths || []).filter(
        (_: unknown, i: number) => i !== index,
      ),
      names: (draftValue?.names || []).filter(
        (_: unknown, i: number) => i !== index,
      ),
      types: (draftValue?.types || []).filter(
        (_: unknown, i: number) => i !== index,
      ),
    };

    onSubmit?.({ newValue });
  };

  const handlePreview = (attachment: Attachment) => {
    if (!isAttachmentPreviewEnabled) {
      console.log('handlePreview - opening in new tab', attachment.fullPath);
      if (typeof window !== 'undefined') {
        window.open(attachment.fullPath, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // Close the attachment selector modal if it's open
    // This allows the preview modal to be full-screen instead of constrained
    console.log('handlePreview - closing modal', MODAL_ID);
    closeModal(MODAL_ID);

    // Open the preview modal - it will render on top of the field editor
    // The preview modal is full-screen and will cover the field editor
    console.log('handlePreview - opening preview modal', PREVIEW_MODAL_ID);
    setPreviewedAttachment(attachment);
    openModal(PREVIEW_MODAL_ID);
  };

  const handlePreviewClose = () => {
    closeModal(PREVIEW_MODAL_ID);
    setPreviewedAttachment(null);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape?.({ newValue: draftValue });
      } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        onSubmit?.({ newValue: draftValue });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onSubmit, draftValue]);

  return (
    <div id="ImageFieldInput">
      <FieldInputContainer>
        <StyledContainer>
          <StyledButtonRow>
            <Button
              ariaLabel="ImageFieldInput-UploadButton"
              Icon={IconUpload}
              title={isUploading ? t`Uploading...` : t`Upload Images`}
              variant="secondary"
              onClick={handleUploadClick}
              disabled={isUploading}
              size="small"
            />
            <Button
              ariaLabel="ImageFieldInput-LinkExistingButton"
              Icon={IconLink}
              title={t`Link Existing`}
              variant="secondary"
              onClick={handleLinkExisting}
              disabled={!canLinkExisting}
              size="small"
            />
          </StyledButtonRow>

          <StyledFileInput
            ref={inputFileRef}
            onChange={handleFileChange}
            type="file"
            accept={IMAGE_EXTENSIONS.map((e) => `.${e}`).join(',')}
            multiple
          />

          {loading && (
            <div>
              <Trans>Loading...</Trans>
            </div>
          )}

          {!loading && attachments.length === 0 && (
            <StyledEmptyState>
              <Trans>No images linked</Trans>
            </StyledEmptyState>
          )}

          {!loading && attachments.length > 0 && (
            <AttachmentGrid
              attachments={attachments}
              onRemove={handleRemove}
              onPreview={handlePreview}
            />
          )}
        </StyledContainer>
      </FieldInputContainer>

      <Modal
        modalId={MODAL_ID}
        isClosable={true}
        shouldCloseModalOnClickOutsideOrEscape={true}
        onClose={handleModalClose}
        size="extraLarge"
        padding="none"
      >
        <AttachmentSelector
          targetableObject={targetableObject}
          selectedIds={pendingSelection}
          onSelectionChange={handleSelectionChange}
          onClose={handleModalClose}
          filterAttachment={(a) => isImageAttachment(a.name, a.fileCategory)}
          title={t`Select Images`}
        />
      </Modal>
      <AttachmentPreviewModal
        modalId={PREVIEW_MODAL_ID}
        attachment={previewedAttachment}
        onClose={handlePreviewClose}
        canDownload={true}
      />
    </div>
  );
};

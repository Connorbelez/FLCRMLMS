import { type Attachment } from '@/activities/files/types/Attachment';
import { downloadFile } from '@/activities/files/utils/downloadFile';
import { Modal } from '@/ui/layout/modal/components/Modal';
import { ScrollWrapper } from '@/ui/utilities/scroll/components/ScrollWrapper';
import styled from '@emotion/styled';
import { lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { IconDownload, IconX } from 'twenty-ui/display';
import { IconButton } from 'twenty-ui/input';
import { getFileNameAndExtension } from '~/utils/file/getFileNameAndExtension';

const DocumentViewer = lazy(() =>
  import('@/activities/files/components/DocumentViewer').then((module) => ({
    default: module.DocumentViewer,
  })),
);

const StyledModal = styled(Modal)`
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(3)};
`;

const StyledModalHeader = styled(Modal.Header)`
  height: auto;
  padding: 0;
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const StyledModalTitle = styled.span`
  color: ${({ theme }) => theme.font.color.primary};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const StyledButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledModalContent = styled(Modal.Content)`
  padding: 0;
`;

const StyledImagePreviewContainer = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 60vh;
  max-height: calc(90dvh - 200px);
  padding: ${({ theme }) => theme.spacing(4)};
  overflow: auto;
  box-sizing: border-box;
`;

const StyledImagePreview = styled.img`
  background: ${({ theme }) => theme.background.primary};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  box-shadow: ${({ theme }) => theme.boxShadow.strong};
  max-height: calc(90dvh - 200px);
  max-width: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
`;

const StyledLoadingContainer = styled.div`
  align-items: center;
  background: ${({ theme }) => theme.background.primary};
  display: flex;
  height: 80vh;
  justify-content: center;
  width: 100%;
`;

const StyledLoadingText = styled.div`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

type AttachmentPreviewModalProps = {
  modalId: string;
  attachment: Attachment | null;
  onClose: () => void;
  canDownload?: boolean;
};

export const AttachmentPreviewModal = ({
  modalId,
  attachment,
  onClose,
  canDownload = true,
}: AttachmentPreviewModalProps) => {
  if (attachment === null) {
    return null;
  }

  const { extension } = getFileNameAndExtension(attachment.name);
  const normalizedExtension = extension?.replace('.', '').toLowerCase() ?? '';
  const imageExtensions = [
    'png',
    'jpg',
    'jpeg',
    'gif',
    'bmp',
    'webp',
    'svg',
    'tiff',
  ];
  const isImageAttachment =
    attachment.type?.startsWith('image/') ||
    imageExtensions.includes(normalizedExtension);

  const handleDownload = () => {
    downloadFile(attachment.fullPath, attachment.name);
  };

  const modalContent = (
    <StyledModal
      modalId={modalId}
      size="extraLarge"
      isClosable
      onClose={onClose}
      shouldCloseModalOnClickOutsideOrEscape
    >
      <StyledModalHeader>
        <StyledHeader id="AttachmentPreviewModal-Header-Content">
          <StyledModalTitle id="AttachmentPreviewModal-Header-Title">
            {attachment.name}
          </StyledModalTitle>
          <StyledButtonContainer id="AttachmentPreviewModal-Header-Buttons">
            {canDownload && (
              <IconButton
                Icon={IconDownload}
                onClick={handleDownload}
                size="small"
              />
            )}
            <IconButton Icon={IconX} onClick={onClose} size="small" />
          </StyledButtonContainer>
        </StyledHeader>
      </StyledModalHeader>
      {isImageAttachment ? (
        <StyledImagePreviewContainer id="AttachmentPreviewModal-ImagePreviewContainer">
          <StyledImagePreview
            id="AttachmentPreviewModal-ImagePreview"
            src={attachment.fullPath}
            alt={attachment.name}
          />
        </StyledImagePreviewContainer>
      ) : (
        <ScrollWrapper componentInstanceId={`preview-modal-${attachment.id}`}>
          <StyledModalContent>
            <Suspense
              fallback={
                <StyledLoadingContainer>
                  <StyledLoadingText>
                    Loading document viewer...
                  </StyledLoadingText>
                </StyledLoadingContainer>
              }
            >
              <DocumentViewer
                documentName={attachment.name}
                documentUrl={attachment.fullPath}
              />
            </Suspense>
          </StyledModalContent>
        </ScrollWrapper>
      )}
    </StyledModal>
  );

  // Render modal to document.body using portal to escape parent container constraints
  return createPortal(modalContent, document.body);
};

import React from 'react';
import { Modal, ModalOverlay, ModalContent, ModalBody } from '@chakra-ui/react';

interface ImageModalProps {
  isImageModalOpen: boolean;
  selectedImage: string | null;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ isImageModalOpen, selectedImage, onClose }) => {
  return (
    <Modal isOpen={isImageModalOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg="transparent" boxShadow="none">
        <ModalBody p={0}>
          {selectedImage && (
            <img src={selectedImage} alt="Large preview" className="w-full h-full object-contain" />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ImageModal;

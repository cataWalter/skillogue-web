// src/hooks/useModal.ts
import { useState, ReactNode } from 'react';

interface ModalState {
  isOpen: boolean;
  title: string;
  content: ReactNode | null;
}

interface ModalControls {
  openModal: (title: string, content: ReactNode) => void;
  closeModal: () => void;
}

export const useModal = (): [ModalState, ModalControls] => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    content: null,
  });

  const openModal = (title: string, content: ReactNode) => {
    setModalState({ isOpen: true, title, content });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, title: '', content: null });
  };

  return [modalState, { openModal, closeModal }];
};
'use client';

import React from 'react';
import { useRw10 } from '@/context/Rw10Context';
import { ModalId } from '@/types/rw10';

interface ModalWrapperProps {
  id: ModalId;
  zIndexClass?: string;
  backdropClass?: string;
  children: React.ReactNode;
}

export default function ModalWrapper({
  id,
  zIndexClass = 'z-50',
  backdropClass = 'bg-slate-950/60',
  children,
}: ModalWrapperProps) {
  const { activeModal, closeModal } = useRw10();
  if (activeModal !== id) return null;

  return (
    <div
      id={id}
      className={`modal-backdrop fixed inset-0 ${zIndexClass} ${backdropClass} backdrop-blur-sm flex items-center justify-center p-4`}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      {children}
    </div>
  );
}

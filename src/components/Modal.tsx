'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { componentCopy } from '../lib/app-copy';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    if (!isOpen || !mounted) return null;

    const content = (
        <div 
            data-testid="modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-overlay/80 backdrop-blur-glass transition-opacity"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                ref={modalRef}
                className="glass-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] animate-in fade-in zoom-in duration-200"
            >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line/20 bg-[var(--glass-panel)]/95 p-6 backdrop-blur-glass">
                    <h2 id="modal-title" className="text-xl font-bold text-foreground">{title}</h2>
                    <button
                        onClick={onClose}
                        className="glass-surface rounded-full p-1 text-faint transition-colors hover:text-foreground"
                        aria-label={componentCopy.modal.closeAriaLabel}
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 text-muted">
                    {children}
                </div>
                {footer && (
                    <div className="sticky bottom-0 z-10 flex justify-end border-t border-line/20 bg-[var(--glass-panel)]/95 p-6 backdrop-blur-glass">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default Modal;

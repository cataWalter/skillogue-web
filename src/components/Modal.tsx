'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                ref={modalRef}
                className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800 animate-in fade-in zoom-in duration-200"
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
                    <h2 id="modal-title" className="text-xl font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 text-gray-300">
                    {children}
                </div>
                {footer && (
                    <div className="flex justify-end p-6 border-t border-gray-800 bg-gray-900 sticky bottom-0 z-10">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default Modal;

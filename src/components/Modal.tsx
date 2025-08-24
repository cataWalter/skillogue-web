// src/components/Modal.tsx
import React, { useEffect, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { Button } from './Button';

// Define size variants for the modal panel
const modalPanelVariants = cva(
    'relative bg-gray-900 rounded-lg shadow-xl w-full max-h-[90vh] flex flex-col transform transition-all',
    {
        variants: {
            size: {
                sm: 'max-w-sm',
                md: 'max-w-md',
                lg: 'max-w-lg',
                xl: 'max-w-3xl',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    }
);

interface ModalProps extends VariantProps<typeof modalPanelVariants> {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Effect to handle closing the modal with the Escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    // Effect to trap focus within the modal for accessibility
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKeyPress = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;

            if (event.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    event.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    event.preventDefault();
                }
            }
        };

        // Initially focus the modal itself or the first focusable element
        firstElement?.focus();

        document.addEventListener('keydown', handleTabKeyPress);
        return () => {
            document.removeEventListener('keydown', handleTabKeyPress);
        };
    }, [isOpen]);


    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-75" onClick={onClose} />

            {/* Modal Panel */}
            <div
                ref={modalRef}
                className={`${modalPanelVariants({ size })} ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                tabIndex={-1} // Make the div focusable
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
                    <h2 id="modal-title" className="text-xl font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 text-gray-300 overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-700 flex-shrink-0">
                    <Button
                        onClick={onClose}
                        variant="primary"
                        className="w-auto px-4 py-2" // Override default width
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
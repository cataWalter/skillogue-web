// src/components/Modal.js
import React from 'react';

const Modal = ({isOpen, onClose, title, children}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
            <div className="bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl focus:outline-none"
                    >
                        &times;
                    </button>
                </div>
                <div className="p-6 text-gray-300">
                    {children}
                </div>
                <div className="flex justify-end p-6 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
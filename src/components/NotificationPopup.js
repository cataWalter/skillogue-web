// src/components/NotificationPopup.js
import React, { useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';

const NotificationPopup = ({ message, sender, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto-close after 5 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-5 right-5 w-full max-w-sm bg-gray-800 border border-gray-700 rounded-lg shadow-lg text-white p-4 flex items-start gap-4 animate-fade-in-up z-50">
            <div className="flex-shrink-0 pt-1">
                <MessageSquare className="h-6 w-6 text-indigo-400" />
            </div>
            <div className="flex-1">
                <p className="font-semibold">{sender}</p>
                <p className="text-sm text-gray-300">{message}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={18} />
            </button>
        </div>
    );
};

export default NotificationPopup;
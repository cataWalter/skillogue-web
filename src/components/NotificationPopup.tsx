import React, { useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';

interface NotificationPopupProps {
    message: string;
    sender: string;
    onClose: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ message, sender, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto-close after 5 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-5 right-5 w-full max-w-sm bg-surface border border-line/30 rounded-lg shadow-lg shadow-black/15 text-foreground p-4 flex items-start gap-4 animate-fade-in-up z-50">
            <div className="flex-shrink-0 pt-1">
                <MessageSquare className="h-6 w-6 text-brand" />
            </div>
            <div className="flex-1">
                <p className="font-semibold">{sender}</p>
                <p className="text-sm text-muted">{message}</p>
            </div>
            <button onClick={onClose} aria-label="Dismiss notification" className="text-faint hover:text-foreground transition">
                <X size={18} />
            </button>
        </div>
    );
};

export default NotificationPopup;

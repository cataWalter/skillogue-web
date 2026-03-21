// src/components/NotificationIcon.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import NotificationsDropdown from './NotificationsDropdown';

const NotificationIcon: React.FC = () => {
    const { unreadCount } = useNotifications();
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setDropdownOpen(!isDropdownOpen)}
                className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition"
                aria-label="Notifications"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 justify-center items-center text-xs">
                            {unreadCount}
                        </span>
                    </span>
                )}
            </button>
            {isDropdownOpen && <NotificationsDropdown onClose={() => setDropdownOpen(false)} />}
        </div>
    );
};

export default NotificationIcon;
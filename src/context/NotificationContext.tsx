'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

const POLL_INTERVAL_MS = 45_000;

export type NotificationType =
  | 'new_message'
  | 'new_favorite'
  | 'profile_visit'
  | 'new_match'
  | 'admin_notice';

export interface Notification {
  id: number;
  type: NotificationType | string;
  read: boolean;
  createdAt: string;
  actorId?: string;
  actorName?: string;
  title?: string;
  body?: string;
  url?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: number | null) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/notifications`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (id: number | null) => {
    try {
      if (id === null) {
        const response = await fetch(`/api/notifications/mark-all-read`, {
          method: 'PATCH',
        });
        if (response.ok) {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
      } else {
        const response = await fetch(`/api/notifications/${id}`, {
          method: 'PATCH',
        });
        if (response.ok) {
          setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
          );
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Initial load
  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // Background polling — only when tab is visible
  useEffect(() => {
    if (!user) return undefined;

    const poll = () => {
      if (!document.hidden) void fetchNotifications();
    };

    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', poll);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', poll);
    };
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Browser tab badge
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, '');
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
  }, [unreadCount]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, markAsRead, refresh: fetchNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

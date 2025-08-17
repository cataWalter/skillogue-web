// src/context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import NotificationPopup from '../components/NotificationPopup';

// This is the raw data shape from Supabase, where a to-one join might be an object or an array.
interface RawNotification {
  id: number;
  read: boolean;
  type: string;
  created_at: string;
  actor: {
    id: string;
    first_name: string | null;
  } | {
    id: string;
    first_name: string | null;
  }[] | null;
}

// This is the clean shape we want to use consistently throughout the app.
interface Notification {
  id: number;
  read: boolean;
  type: string;
  created_at: string;
  actor: {
    id: string;
    first_name: string | null;
  } | null;
}

// ✅ MODIFIED: Added fetchNotifications to the context type
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number | null) => void;
  fetchNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // ✅ MODIFIED: Wrapped the function in useCallback for stability
    const fetchNotifications = useCallback(async () => {
        if (!session?.user) return;

        const { data, error } = await supabase
            .from('notifications')
            .select(`
                id, read, type, created_at,
                actor:actor_id (id, first_name)
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching notifications:', error);
            return;
        }
        
        const rawNotifications = (data as unknown as RawNotification[]) || [];

        const transformedNotifications: Notification[] = rawNotifications.map(n => ({
            ...n,
            actor: Array.isArray(n.actor) ? n.actor[0] || null : n.actor || null,
        }));

        setNotifications(transformedNotifications);
        setUnreadCount(transformedNotifications.filter(n => !n.read).length);
    }, [session]);

    useEffect(() => {
        if (session) {
            fetchNotifications();
        }
    }, [session, fetchNotifications]);

    useEffect(() => {
        if (!session?.user) return;

        const notificationChannel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
                (payload) => {
                    console.log('Notification table change detected:', payload.eventType);
                    fetchNotifications(); 
                }
            )
            .subscribe();

        const privateMessageChannel = supabase.channel(`private-messages-for-${session.user.id}`);
        
        privateMessageChannel
            .on('broadcast', { event: 'new-message' }, ({ payload }) => {
                console.log('New message broadcast received in context:', payload);
                fetchNotifications();
                
                const currentPath = window.location.pathname;
                const searchParams = new URLSearchParams(window.location.search);
                const isChatOpenWithSender = currentPath.startsWith('/messages') && searchParams.get('with') === payload.message.sender_id;

                if (!isChatOpenWithSender) {
                    toast.custom((t) => (
                        <NotificationPopup 
                            message={payload.message.content} 
                            sender={payload.message.sender.first_name || 'New Message'}
                            onClose={() => toast.dismiss(t.id)} 
                        />
                    ), { position: 'bottom-right' });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(notificationChannel);
            supabase.removeChannel(privateMessageChannel);
        };
    }, [session, fetchNotifications]);

    const markAsRead = async (id: number | null) => {
        if (!session?.user) return;
        
        const query = supabase.from('notifications').update({ read: true });
        
        if (id) {
            query.eq('id', id);
        } else {
            query.eq('user_id', session.user.id).eq('read', false);
        }

        const { error } = await query;
        if (error) {
            console.error('Error marking notification as read:', error);
        } else {
            setNotifications(prev => 
                prev.map(n => (id ? n.id === id : !n.read) ? { ...n, read: true } : n)
            );
            setUnreadCount(id ? Math.max(0, unreadCount - 1) : 0);
        }
    };

    return (
        // ✅ MODIFIED: Pass the fetchNotifications function in the provider's value
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, fetchNotifications }}>
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
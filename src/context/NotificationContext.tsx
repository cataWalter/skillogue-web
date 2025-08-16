// src/context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import NotificationPopup from '../components/NotificationPopup';

// ✅ STEP 1: Define BOTH the raw and clean types again.
// This tells TypeScript what we GET from Supabase.
interface RawNotification {
  id: number;
  read: boolean;
  type: string;
  created_at: string;
  actor: {
    id: string;
    first_name: string | null;
  }[] | null; // The type system expects an array here.
}

// This is the clean shape we WANT to use in our app.
interface Notification {
  id: number;
  read: boolean;
  type: string;
  created_at: string;
  actor: {
    id: string;
    first_name: string | null;
  } | null; // We want a single object.
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number | null) => void;
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

    const fetchNotifications = async () => {
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
        
        // ✅ STEP 2: Use the `RawNotification` type and the `unknown` keyword to bypass the strict error.
        // This tells TypeScript: "Trust me, I will handle the conversion."
        const rawNotifications = (data as unknown as RawNotification[]) || [];

        // ✅ STEP 3: Re-introduce the transformation logic. This correctly handles the data.
        const transformedNotifications: Notification[] = rawNotifications.map(n => ({
            ...n,
            actor: n.actor && n.actor.length > 0 ? n.actor[0] : null
        }));

        setNotifications(transformedNotifications);
        setUnreadCount(transformedNotifications.filter(n => !n.read).length);
    };

    useEffect(() => {
        if (session) {
            fetchNotifications();
        }
    }, [session]);

    useEffect(() => {
        if (!session?.user) return;

        const notificationChannel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
                (payload) => {
                    console.log('New standard notification received!', payload);
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
    }, [session]);

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
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead }}>
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
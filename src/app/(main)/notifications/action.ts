// src/app/(main)/notifications/actions.ts

'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type Notification = {
    id: number;
    created_at: string;
    message: string;
    read: boolean;
    type: 'new_follower' | 'new_message' | 'profile_view'; // Add other types as needed
    link: string | null;
    user_id: string;
}

export async function getNotifications(): Promise<{ notifications?: Notification[], error?: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to view notifications.' };
    }

    const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return { error: 'Failed to fetch notifications.' };
    }

    return { notifications: notifications as Notification[] };
}

export async function markNotificationsAsRead() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Authentication error.' };
    }

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

    if (error) {
        return { error: 'Failed to mark notifications as read.' };
    }

    revalidatePath('/notifications');
    revalidatePath('/components/layout/NotificationBell'); // Revalidate the bell component
    return { success: true };
}
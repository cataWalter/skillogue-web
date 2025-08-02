// src/components/profile/actions.ts

'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- FOLLOW USER ---
export async function followUser(profileId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'You must be logged in.' };

    const { error } = await supabase.from('followers').insert({ user_id: user.id, following_id: profileId });
    if (error) return { error: 'Failed to follow user.' };

    revalidatePath(`/user/${profileId}`);
    return { success: true };
}

// --- UNFOLLOW USER ---
export async function unfollowUser(profileId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'You must be logged in.' };

    const { error } = await supabase.from('followers').delete().match({ user_id: user.id, following_id: profileId });
    if (error) return { error: 'Failed to unfollow user.' };
    
    revalidatePath(`/user/${profileId}`);
    return { success: true };
}

// --- BLOCK USER ---
export async function blockUser(profileId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };
    if (user.id === profileId) return { error: "You cannot block yourself." };

    const { error } = await supabase.from('blocks').insert({ user_id: user.id, blocked_user_id: profileId });
    if (error) return { error: 'User is already blocked.' };

    revalidatePath('/discover');
    revalidatePath(`/user/${profileId}`);
    return { success: true };
}

// --- UNBLOCK USER ---
export async function unblockUser(profileId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    const { error } = await supabase.from('blocks').delete().match({ user_id: user.id, blocked_user_id: profileId });
    if (error) return { error: 'Failed to unblock user.' };

    revalidatePath('/discover');
    revalidatePath(`/user/${profileId}`);
    return { success: true };
}

// src/components/profile/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProfileById(userId: string) {
    // Correctly initialize the Supabase client for server-side actions.
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*, profile_passions(*, passions(*))')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    // Safely map passions, handling cases where profile_passions might be null or empty.
    const passions = data.profile_passions ? data.profile_passions.map((pp: { passions: any; }) => pp.passions) : [];

    const profileWithPassions = {
        ...data,
        passions,
    };

    return profileWithPassions;
}

export async function getPassionsByUserId(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profile_passions')
        .select('passions(id, name)')
        .eq('profile_id', userId);

    if (error) {
        console.error('Error fetching passions:', error);
        return [];
    }

    return data.map((item: any) => item.passions).filter(Boolean); // Filter out any null/undefined passions
}

export async function followUser(followerId: string, followingId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
    if (error) console.error('Error following user:', error);
    revalidatePath(`/user/${followingId}`);
}

export async function unfollowUser(followerId: string, followingId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('follows').delete().match({ follower_id: followerId, following_id: followingId });
    if (error) console.error('Error unfollowing user:', error);
    revalidatePath(`/user/${followingId}`);
}

export async function blockUser(blockerId: string, blockedId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
    if (error) console.error('Error blocking user:', error);
    revalidatePath(`/user/${blockedId}`);
}

export async function unblockUser(blockerId: string, blockedId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('blocks').delete().match({ blocker_id: blockerId, blocked_id: blockedId });
    if (error) console.error('Error unblocking user:', error);
    revalidatePath(`/user/${blockedId}`);
}

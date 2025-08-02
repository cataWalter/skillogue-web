// src/app/(main)/user/[userId]/follow/actions.ts

'use server'

import { createClient } from "@/utils/supabase/server";

type Profile = {
    id: string;
    username: string;
    email: string; // Used for avatar
};

export async function getFollowing(userId: string): Promise<Profile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('followers')
        .select('following_id, profile:profiles!followers_following_id_fkey(id, username, email)')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching following:', error);
        return [];
    }

    return data.map(item => item.profile).filter(Boolean) as Profile[];
}

export async function getFollowers(userId: string): Promise<Profile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('followers')
        .select('user_id, profile:profiles!followers_user_id_fkey(id, username, email)')
        .eq('following_id', userId);

    if (error) {
        console.error('Error fetching followers:', error);
        return [];
    }
    
    return data.map(item => item.profile).filter(Boolean) as Profile[];
}
// src/app/(main)/user/[userId]/follow/action.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import type { Profile } from '@/types';

export async function getFollowerCount(userId: string) {
  // FIX: Await the createClient() function to get the actual Supabase client instance.
  const supabase = await createClient();
  const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

  if (error) {
    console.error('Error fetching follower count:', error);
    return 0;
  }
  return count;
}

export async function getFollowingCount(userId: string) {
  // FIX: Await the createClient() function.
  const supabase = await createClient();
  const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

  if (error) {
    console.error('Error fetching following count:', error);
    return 0;
  }
  return count;
}

/**
 * Fetches the profiles of users who are following the specified user.
 * @param userId The ID of the user whose followers are to be fetched.
 * @returns A promise that resolves to an array of follower profiles.
 */
export async function getFollowers(userId: string): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
      .from('follows')
      .select('profiles!follower_id(*)')
      .eq('following_id', userId);

  if (error) {
    console.error('Error fetching followers:', error);
    return [];
  }

  return data.map((item: any) => item.profiles);
}

/**
 * Fetches the profiles of users that the specified user is following.
 * @param userId The ID of the user whose followed users are to be fetched.
 * @returns A promise that resolves to an array of followed profiles.
 */
export async function getFollowing(userId: string): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
      .from('follows')
      .select('profiles!following_id(*)')
      .eq('follower_id', userId);

  if (error) {
    console.error('Error fetching following:', error);
    return [];
  }

  return data.map((item: any) => item.profiles);
}

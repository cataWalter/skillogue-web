// src/components/profile/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProfileById(userId: string) {
  // FIX: Await the createClient() function to get the actual Supabase client instance.
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

  const profileWithAvatarPath = {
    ...data,
    passions: data.profile_passions.map((pp: { passions: any; }) => pp.passions),
  };

  return profileWithAvatarPath;
}

export async function getPassionsByUserId(userId: string) {
  // FIX: Await the createClient() function.
  const supabase = await createClient();
  const { data, error } = await supabase
      .from('profile_passions')
      .select('passions(id, name)')
      .eq('profile_id', userId);

  if (error) {
    console.error('Error fetching passions:', error);
    return [];
  }

  return data.map((item: any) => item.passions);
}

export async function followUser(followerId: string, followingId: string) {
  // FIX: Await the createClient() function.
  const supabase = await createClient();
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
  if (error) console.error('Error following user:', error);
  revalidatePath(`/user/${followingId}`);
}

export async function unfollowUser(followerId: string, followingId: string) {
  // FIX: Await the createClient() function.
  const supabase = await createClient();
  const { error } = await supabase.from('follows').delete().match({ follower_id: followerId, following_id: followingId });
  if (error) console.error('Error unfollowing user:', error);
  revalidatePath(`/user/${followingId}`);
}

export async function blockUser(blockerId: string, blockedId: string) {
  // FIX: Await the createClient() function.
  const supabase = await createClient();
  const { error } = await supabase.from('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) console.error('Error blocking user:', error);
  revalidatePath(`/user/${blockedId}`);
}

export async function unblockUser(blockerId: string, blockedId: string) {
  // FIX: Await the createClient() function.
  const supabase = await createClient();
  const { error } = await supabase.from('blocks').delete().match({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) console.error('Error unblocking user:', error);
  revalidatePath(`/user/${blockedId}`);
}

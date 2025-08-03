'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProfileById(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*, profile_passions(*)') // Use the actual relationship name from your schema
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  const profileWithAvatarPath = {
    ...data,
    avatar_url: Array.isArray(data.avatar) ? data.avatar[0]?.file_path : data.avatar?.file_path,
  };

  return profileWithAvatarPath;
}

export async function getPassionsByUserId(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('passions')
    .select(
      `
      passions (id, name, category)
      `
    )
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching passions:', error);
    return [];
  }

  return data.map((item: any) => item.passions);
}

export async function followUser(followerId: string, followingId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
  if (error) console.error('Error following user:', error);
  revalidatePath(`/user/${followingId}`);
}

export async function unfollowUser(followerId: string, followingId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('follows').delete().match({ follower_id: followerId, following_id: followingId });
  if (error) console.error('Error unfollowing user:', error);
  revalidatePath(`/user/${followingId}`);
}

export async function blockUser(blockerId: string, blockedId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) console.error('Error blocking user:', error);
  revalidatePath(`/user/${blockedId}`);
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('blocks').delete().match({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) console.error('Error unblocking user:', error);
  revalidatePath(`/user/${blockedId}`);
}
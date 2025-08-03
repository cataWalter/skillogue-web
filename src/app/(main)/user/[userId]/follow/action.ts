'use server';

import { createClient } from '@/utils/supabase/server';

// --- Added missing exports below ---

export async function getFollowerCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) {
    console.error('Error fetching follower count:', error);
    return 0;
  }

  return count || 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) {
    console.error('Error fetching following count:', error);
    return 0;
  }

  return count || 0;
}
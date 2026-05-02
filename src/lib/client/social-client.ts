'use client';

import { appClient } from '@/lib/appClient';

type MutationResult = { error: { message: string; code?: string } | null };

/** Returns true if the current user has blocked the given target. */
export const isBlocked = async (targetId: string): Promise<boolean> => {
    const { data } = await appClient.rpc('is_blocked', { target_id: targetId });
    return !!data;
};

/** Returns true if the current user has been blocked by the given target. */
export const isBlockedBy = async (targetId: string): Promise<boolean> => {
    const { data } = await appClient.rpc('is_blocked_by', { target_id: targetId });
    return !!data;
};

/** Returns true if the current user has saved the given profile. */
export const isSaved = async (targetId: string): Promise<boolean> => {
    const { data } = await appClient.rpc('is_saved', { target_id: targetId });
    return !!data;
};

/** Blocks the given user. */
export const blockUser = async (targetId: string): Promise<MutationResult> => {
    const { error } = await appClient.rpc('block_user', { target_id: targetId });
    return { error };
};

/** Unblocks the given user. */
export const unblockUser = async (targetId: string): Promise<MutationResult> => {
    const { error } = await appClient.rpc('unblock_user', { target_id: targetId });
    return { error };
};

/** Saves (favorites) the given profile. */
export const saveProfile = async (targetId: string): Promise<MutationResult> => {
    const { error } = await appClient.rpc('save_profile', { target_id: targetId });
    return { error };
};

/** Removes the given profile from saved. */
export const unsaveProfile = async (targetId: string): Promise<MutationResult> => {
    const { error } = await appClient.rpc('unsave_profile', { target_id: targetId });
    return { error };
};

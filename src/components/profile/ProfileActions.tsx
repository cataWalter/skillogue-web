// src/components/profile/ProfileActions.tsx

'use client'

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { followUser, unfollowUser, blockUser, unblockUser } from './actions';

interface ProfileActionsProps {
    profileId: string;
    isFollowing: boolean;
    isBlocked: boolean;
}

export function ProfileActions({ profileId, isFollowing, isBlocked }: ProfileActionsProps) {
    let [isPending, startTransition] = useTransition();

    const handleAction = async (action: (id: string) => Promise<{ success?: boolean; error?: string }>) => {
        startTransition(async () => {
            const result = await action(profileId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Action successful!');
            }
        });
    };

    const handleBlock = () => {
        if (confirm("Are you sure you want to block this user? This action is permanent and they won't be able to see your profile.")) {
            handleAction(blockUser);
        }
    }

    if (isBlocked) {
        return (
            <button
                onClick={() => handleAction(unblockUser)}
                disabled={isPending}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
            >
                {isPending ? 'Processing...' : 'Unblock'}
            </button>
        );
    }

    return (
        <div className="flex space-x-2">
            <button
                onClick={() => handleAction(isFollowing ? unfollowUser : followUser)}
                disabled={isPending}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-400"
            >
                {isPending ? '...' : (isFollowing ? 'Unfollow' : 'Follow')}
            </button>
            <button
                onClick={handleBlock}
                disabled={isPending}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:bg-red-400"
            >
                {isPending ? '...' : 'Block'}
            </button>
        </div>
    );
}
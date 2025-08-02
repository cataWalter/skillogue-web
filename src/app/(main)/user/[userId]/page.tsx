// src/app/(main)/user/[userId]/page.tsx

import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from 'next/link';
import { ProfileActions } from "@/components/profile/ProfileActions";
import { ReportUserButton } from "@/components/profile/ReportUserButton";
import Avatar from "@/components/Avatar";

export default async function UserProfilePage({ params }: { params: { userId: string } }) {
    const supabase = createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // 1. Fetch the profile being viewed
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.userId)
        .single();

    if (!profile) {
        notFound();
    }

    // Default values for logged-out users
    let isFollowing = false;
    let isFollowedBy = false; // Note: isFollowedBy logic not fully implemented in this example
    let isBlocked = false;
    let isOwnProfile = false;

    if (currentUser) {
        isOwnProfile = currentUser.id === profile.id;

        // 2. Security Check: Prevent viewing profile if the current user is blocked by them
        if (!isOwnProfile) {
            const { data: blockedByProfile } = await supabase
                .from('blocks')
                .select('user_id')
                .match({ user_id: profile.id, blocked_user_id: currentUser.id })
                .maybeSingle();

            if (blockedByProfile) {
                return (
                    <div className="text-center p-10">
                        <h2 className="text-xl font-semibold">User Not Available</h2>
                        <p className="text-gray-500">You cannot view this profile.</p>
                    </div>
                );
            }
        }

        // 3. Fetch relationship statuses (follow, block)
        const { data: follow } = await supabase
            .from('followers')
            .select('*')
            .match({ user_id: currentUser.id, following_id: profile.id })
            .maybeSingle();
        isFollowing = !!follow;

        const { data: block } = await supabase
            .from('blocks')
            .select('user_id')
            .match({ user_id: currentUser.id, blocked_user_id: profile.id })
            .maybeSingle();
        isBlocked = !!block;
    }

    // 4. Fetch follower and following counts for display
    const { count: followingCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

    const { count: followersCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profile.id);

    // This is a placeholder for fetching passions. You should replace this with your actual logic.
    const passions = ["Programming", "Hiking", "Photography"];

    return (
        <div className="container mx-auto p-4">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-2xl mx-auto">
                {/* Profile Header */}
                <div className="flex items-center space-x-4">
                    <Avatar email={profile.email} size={64} />
                    <div>
                        <h1 className="text-3xl font-bold">{profile.username}</h1>
                        {profile.verified && (
                             <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">Verified</span>
                        )}
                    </div>
                </div>

                {/* Follower/Following Stats */}
                <div className="mt-4 flex space-x-6 border-t pt-4">
                    <Link href={`/user/${profile.id}/following`} legacyBehavior>
                        <a className="text-center hover:text-blue-600">
                            <span className="font-bold block text-lg">{followingCount ?? 0}</span>
                            <span className="text-gray-500 text-sm">Following</span>
                        </a>
                    </Link>
                    <Link href={`/user/${profile.id}/followers`} legacyBehavior>
                        <a className="text-center hover:text-blue-600">
                            <span className="font-bold block text-lg">{followersCount ?? 0}</span>
                            <span className="text-gray-500 text-sm">Followers</span>
                        </a>
                    </Link>
                </div>

                {/* Bio and Passions */}
                <div className="mt-4 border-t pt-4">
                    <h3 className="font-semibold">About Me</h3>
                    <p className="text-gray-700 mt-1">{profile.bio || 'No bio yet.'}</p>
                </div>

                <div className="mt-4">
                    <h3 className="font-semibold">Passions</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {passions.map(passion => (
                            <span key={passion} className="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full">
                                {passion}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                {!isOwnProfile && currentUser && (
                    <div className="mt-6 flex space-x-4 border-t pt-4">
                        <ProfileActions
                            profileId={profile.id}
                            isFollowing={isFollowing}
                            isFollowedBy={isFollowedBy} // Prop is passed for completeness
                            isBlocked={isBlocked}
                        />
                        {!isBlocked && <ReportUserButton reportedUserId={profile.id} />}
                    </div>
                )}
            </div>
        </div>
    );
}
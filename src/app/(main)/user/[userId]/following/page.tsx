// src/app/(main)/user/[userId]/following/page.tsx

import { getFollowing } from '../follow/actions';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Avatar from '@/components/Avatar'; // Assuming you have an Avatar component

export default async function FollowingPage({ params }: { params: { userId: string } }) {
    const following = await getFollowing(params.userId);
    const supabase = createClient();
    const { data: { user } } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', params.userId)
        .single();

    return (
        <div className="container mx-auto p-4 max-w-lg">
            <h1 className="text-2xl font-bold mb-4">Users followed by {user?.username || 'user'}</h1>
            <div className="space-y-3">
                {following.length > 0 ? (
                    following.map(profile => (
                        <Link href={`/user/${profile.id}`} key={profile.id} legacyBehavior>
                            <a className="flex items-center space-x-4 p-3 bg-white shadow rounded-lg hover:bg-gray-50">
                                <Avatar email={profile.email} />
                                <span>{profile.username}</span>
                            </a>
                        </Link>
                    ))
                ) : (
                    <p>Not following any users.</p>
                )}
            </div>
        </div>
    );
}
// src/app/(main)/user/[userId]/followers/page.tsx

import { getFollowers } from '../follow/actions';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Avatar from '@/components/Avatar';

export default async function FollowersPage({ params }: { params: { userId: string } }) {
    const followers = await getFollowers(params.userId);
    const supabase = createClient();
    const { data: { user } } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', params.userId)
        .single();

    return (
        <div className="container mx-auto p-4 max-w-lg">
            <h1 className="text-2xl font-bold mb-4">Users following {user?.username || 'user'}</h1>
            <div className="space-y-3">
                {followers.length > 0 ? (
                    followers.map(profile => (
                        <Link href={`/user/${profile.id}`} key={profile.id} legacyBehavior>
                            <a className="flex items-center space-x-4 p-3 bg-white shadow rounded-lg hover:bg-gray-50">
                                <Avatar email={profile.email} />
                                <span>{profile.username}</span>
                            </a>
                        </Link>
                    ))
                ) : (
                    <p>No followers yet.</p>
                )}
            </div>
        </div>
    );
}
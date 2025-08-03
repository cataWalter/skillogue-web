// src/app/(main)/profile/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import Footer from '@/components/Footer';
import { getProfileById } from '@/components/profile/actions';
import { getFollowerCount, getFollowingCount } from '@/app/(main)/user/[userId]/follow/action';
import Avatar from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userProfile = await getProfileById(user.id);

  if (!userProfile) {
    redirect('/onboarding');
  }

  // Passions are now included in userProfile from getProfileById
  const { passions } = userProfile;
  const followerCount = await getFollowerCount(user.id);
  const followingCount = await getFollowingCount(user.id);

  return (
      <div className="flex flex-col flex-grow">
        <main className="flex-grow">
          <div className="bg-white shadow-lg rounded-lg p-6 max-w-2xl mx-auto">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Avatar email={user.email!} size={80} />
              <div className="flex-grow text-center sm:text-left">
                <h1 className="text-3xl font-bold">{userProfile.first_name} {userProfile.last_name}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  {userProfile.verified && (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">Verified</Badge>
                  )}
                </div>
              </div>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/profile/edit">Edit Profile</Link>
              </Button>
            </div>

            {/* Follower/Following Stats */}
            <div className="mt-6 flex space-x-6 border-t pt-4 justify-center">
              <Link href={`/user/${userProfile.id}/following`} className="text-center hover:text-blue-600">
                <span className="font-bold block text-lg">{followingCount ?? 0}</span>
                <span className="text-gray-500 text-sm">Following</span>
              </Link>
              <Link href={`/user/${userProfile.id}/followers`} className="text-center hover:text-blue-600">
                <span className="font-bold block text-lg">{followerCount ?? 0}</span>
                <span className="text-gray-500 text-sm">Followers</span>
              </Link>
            </div>

            {/* Bio, Passions, and other details */}
            <div className="mt-6 border-t pt-4 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">About Me</h3>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap">{userProfile.about_me || 'No bio yet. Click "Edit Profile" to add one!'}</p>
              </div>

              {passions && passions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg">Passions</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {passions.map((passion: any) => (
                          <Badge key={passion.id} variant="secondary">
                            {passion.name}
                          </Badge>
                      ))}
                    </div>
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-4 border-t">
                {userProfile.location && <div><span className="font-semibold">Location:</span> {userProfile.location}</div>}
                {userProfile.age && <div><span className="font-semibold">Age:</span> {userProfile.age}</div>}
                {userProfile.gender && <div><span className="font-semibold">Gender:</span> {userProfile.gender}</div>}
                {userProfile.languages && userProfile.languages.length > 0 && (
                    <div><span className="font-semibold">Languages:</span> {userProfile.languages.join(', ')}</div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
  );
}

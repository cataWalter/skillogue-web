import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { getProfileById, getPassionsByUserId } from '@/components/profile/actions';
import { getFollowerCount, getFollowingCount } from '@/app/(main)/user/[userId]/follow/action';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = createClient();

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

  const passions = await getPassionsByUserId(user.id);
  const followerCount = await getFollowerCount(user.id);
  const followingCount = await getFollowingCount(user.id);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileCard
          user={userProfile}
          passions={passions}
          isCurrentUser={true}
          followerCount={followerCount}
          followingCount={followingCount}
        />
      </main>
      <Footer />
    </div>
  );
}
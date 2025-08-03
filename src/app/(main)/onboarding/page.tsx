import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { getProfileById } from '@/components/profile/actions';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userProfile = await getProfileById(user.id);

  if (userProfile) {
    redirect('/dashboard');
  }

  return <OnboardingForm />;
}
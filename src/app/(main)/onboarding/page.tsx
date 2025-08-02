// src/app/(main)/onboarding/page.tsx

import { OnboardingForm } from './OnboardingForm';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check if the user has already completed onboarding (e.g., if their bio is not null)
    const { data: profile } = await supabase
        .from('profiles')
        .select('bio')
        .eq('id', user.id)
        .single();
    
    if (profile && profile.bio) {
        // If they have a bio, they've likely onboarded. Send them to their profile.
        redirect('/profile');
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Welcome to Skillogue!</h1>
                    <p className="text-gray-500">Let's set up your profile so you can start connecting.</p>
                </div>
                <OnboardingForm />
            </div>
        </div>
    );
}
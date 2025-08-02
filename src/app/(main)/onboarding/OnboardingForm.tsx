// src/app/(main)/onboarding/OnboardingForm.tsx

'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export function OnboardingForm() {
    const router = useRouter();
    const [bio, setBio] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        if (!bio) {
            setError('Please write a short bio to continue.');
            return;
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setError('You must be logged in to update your profile.');
            return;
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ bio: bio })
            .eq('id', user.id);
        
        if (updateError) {
            setError('Failed to update profile. Please try again.');
        } else {
            // Redirect to the edit profile page to add passions, etc.
            router.push('/profile/edit');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Your Bio
                </label>
                <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Tell us a little about yourself and what you're passionate about."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md"
            >
                Continue
            </button>
        </form>
    );
}
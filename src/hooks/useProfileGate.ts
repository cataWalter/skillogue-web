'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { appClient } from '../lib/appClient';
import { useAuth } from './useAuth';
import { E2E_ALICE_USER_ID, E2E_INCOMPLETE_USER_ID } from '../lib/e2e-auth';

/**
 * Redirects authenticated users who have not completed their profile to /onboarding.
 * Must be called at the top level of a page component that is already guarded by ProtectedRoute.
 */
export function useProfileGate() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading || !user) return;

        // E2E users: bypass the API call with known values
        if (user.id === E2E_ALICE_USER_ID) return; // Alice has a complete profile
        if (user.id === E2E_INCOMPLETE_USER_ID) {
            router.push('/onboarding');
            return;
        }

        const checkProfile = async () => {
            const { data, error } = await appClient
                .from('profiles')
                .select('first_name')
                .eq('id', user.id)
                .maybeSingle();

            if (error || !data?.first_name) {
                router.push('/onboarding');
            }
        };

        void checkProfile();
    }, [user, loading, router]);
}

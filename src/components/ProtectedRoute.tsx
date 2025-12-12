'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

// Define the shape of the profile data we're fetching for the check
interface ProfileCheckData {
    first_name: string | null;
    last_name: string | null;
    about_me: string | null;
    age: number | null;
    gender: string | null;
    location_id: number | null;
    passions_count: { count: number }[];
    languages_count: { count: number }[];
}

// Define the props for the component
interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [session, setSession] = useState<Session | null>(null);
    const [profileComplete, setProfileComplete] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkUserStatus = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);

            if (session?.user) {
                // Fetch the profile to check for completeness
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select(`
                        first_name,
                        last_name,
                        about_me,
                        age,
                        gender,
                        location_id,
                        passions_count: profile_passions(count),
                        languages_count: profile_languages(count)
                    `)
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    console.error('Error checking profile status:', error);
                    // If error (e.g. no profile row), treat as incomplete
                    setProfileComplete(false);
                } else {
                    // Check if critical fields are filled
                    const p = profile as any; // Cast to any to handle the count arrays easily
                    const isComplete =
                        p.first_name &&
                        p.last_name &&
                        p.age &&
                        p.gender &&
                        p.location_id &&
                        p.passions_count?.[0]?.count > 0 &&
                        p.languages_count?.[0]?.count > 0;

                    setProfileComplete(!!isComplete);
                }
            }
            setLoading(false);
        };

        checkUserStatus();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!session) {
        // Redirect to login
        if (typeof window !== 'undefined') {
             router.push('/login');
        }
        return null;
    }

    if (!profileComplete && pathname !== '/onboarding') {
        // If profile is incomplete and not already on onboarding, redirect there
        if (typeof window !== 'undefined') {
            router.push('/onboarding');
        }
        return null;
    }

    if (profileComplete && pathname === '/onboarding') {
        // If profile IS complete but user tries to go to onboarding, send to dashboard
        if (typeof window !== 'undefined') {
            router.push('/dashboard');
        }
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;

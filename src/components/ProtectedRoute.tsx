// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';

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
    const location = useLocation();

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

                // Handle potential errors, but ignore 'PGRST116' which just means no row was found
                if (error && error.code !== 'PGRST116') {
                    console.error("Error fetching profile for completeness check:", error);
                }

                // Safely access nested count
                const passionsCount = profile?.passions_count?.[0]?.count ?? 0;
                const languagesCount = profile?.languages_count?.[0]?.count ?? 0;

                // Define the conditions for a complete profile
                if (
                    profile &&
                    profile.first_name &&
                    profile.last_name &&
                    profile.about_me &&
                    profile.age &&
                    profile.gender &&
                    profile.location_id &&
                    passionsCount > 0 &&
                    languagesCount > 0
                ) {
                    setProfileComplete(true);
                } else {
                    setProfileComplete(false);
                }
            }
            setLoading(false);
        };

        checkUserStatus();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                // Re-run the check if the auth state changes
                setSession(session);
                checkUserStatus();
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    if (!session) {
        // If there's no session, redirect to the login page
        return <Navigate to="/login" replace />;
    }

    // If the profile is incomplete and the user is not on a page meant for profile completion,
    // redirect them to the edit profile page.
    if (!profileComplete && location.pathname !== '/onboarding' && location.pathname !== '/edit-profile') {
        return <Navigate to="/edit-profile" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
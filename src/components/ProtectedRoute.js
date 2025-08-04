// src/components/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ProtectedRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);

            if (session?.user) {
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('first_name')
                    .eq('id', session.user.id)
                    .single();

                // It's normal for a new user to not have a profile yet, so we don't log the error unless it's unexpected.
                if (error && error.code !== 'PGRST116') {
                    console.error("Error fetching profile:", error);
                }
                setProfile(profileData);
            }
            setLoading(false);
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                if (!session) {
                    setProfile(null);
                }
                // We call checkUser again to re-evaluate profile status on auth changes.
                checkUser();
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading session...</div>;
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    // If session exists but profile is incomplete (first_name is a good indicator),
    // redirect to onboarding unless they are already there.
    if (!profile || !profile.first_name) {
        if (location.pathname !== '/onboarding') {
            return <Navigate to="/onboarding" replace />;
        }
    }

    // If profile is complete and they try to visit onboarding, redirect to the dashboard.
    if (profile && profile.first_name && location.pathname === '/onboarding') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
// src/components/ProtectedRoute.js
import React, {useEffect, useState} from 'react';
import {Navigate} from 'react-router-dom';
import {supabase} from '../supabaseClient';

const ProtectedRoute = ({children}) => {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    useEffect(() => {
        // Fetch initial session
        const checkSession = async () => {
            const {data} = await supabase.auth.getSession();
            const {session} = data;
            setSession(session);
            setLoading(false);
        };

        // Listen for auth changes
        const {data: authListener} = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            setSession(newSession);
            if (!newSession) {
                // Optionally handle logout
            }
            setLoading(false);
        });

        checkSession();

        // Cleanup: unsubscribe if subscription exists
        return () => {
            if (authListener && typeof authListener.unsubscribe === 'function') {
                authListener.unsubscribe();
            }
        };
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!session) {
        return <Navigate to="/login" replace/>;
    }

    return children;
};

export default ProtectedRoute;
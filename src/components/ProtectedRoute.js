// src/components/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ProtectedRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                // ✅ Correct destructuring
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
            } catch (err) {
                console.error('Error getting session:', err);
            } finally {
                setLoading(false);
            }

            // Listen for auth changes (sign in, sign out)
            const {  { subscription }
        } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            setSession(newSession);
            if (!newSession) {
                window.location.href = '/login'; // Redirect to login if logged out
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    };

    checkSession();
}, []);

if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <p>Loading...</p>
        </div>
    );
}

if (!session) {
    return <Navigate to="/login" replace />;
}

return children;
};

export default ProtectedRoute;
// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';


const Dashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('first_name')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error("Error fetching profile:", error);
                } else if (!profileData || !profileData.first_name) {
                    // If profile is incomplete, redirect to onboarding
                    navigate('/onboarding');
                } else {
                    setProfile(profileData);
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, [navigate]);

    if (loading) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Navbar/>
            <main className="flex-grow pt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
                            Welcome,{' '}
                            <span className="text-indigo-400">
                                {profile?.first_name}
                            </span>
                            !
                        </h1>
                        <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-300">
                            Your space to build meaningful friendships through shared skills, passions, and real
                            conversations.
                        </p>

                        {/* Navigation Cards */}
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <Link
                                to="/profile"
                                className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-indigo-600 transition-all duration-300 transform hover:scale-105 text-left"
                            >
                                <h2 className="text-2xl font-bold text-white">Your Profile</h2>
                                <p className="mt-2 text-gray-400">View and edit your profile</p>
                            </Link>

                            <Link
                                to="/messages"
                                className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-purple-600 transition-all duration-300 transform hover:scale-105 text-left"
                            >
                                <h2 className="text-2xl font-bold text-white">Messages</h2>
                                <p className="mt-2 text-gray-400">Chat with your connections</p>
                            </Link>
                            <Link
                                to="/search"
                                className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition"
                            >
                                Start Searching by Passion
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default Dashboard;
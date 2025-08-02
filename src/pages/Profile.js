// src/pages/Profile.js
import React, {useEffect, useState} from 'react';
import {supabase} from '../supabaseClient';
import {Link} from 'react-router-dom';
import {ArrowLeft, Edit, ShieldCheck} from 'lucide-react';

function Profile() {
    const [profile, setProfile] = useState(null);
    const [passions, setPassions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            const {data: {user}} = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/login';
                return;
            }

            // Fetch profile
            const {data: profileData, error: profileError} = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) {
                alert('Profile not found. Please complete your profile.');
                window.location.href = '/setup'; // Optional: redirect to setup
                return;
            }

            setProfile(profileData);

            // Fetch passions via join table
            const {data: passionData, error: passionError} = await supabase
                .from('profile_passions')
                .select('passions (name)')
                .eq('profile_id', user.id);

            if (passionError) {
                console.error('Error loading passions:', passionError);
            } else {
                setPassions(passionData.map(p => p.passions.name));
            }

            setLoading(false);
        };

        loadProfile();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p>Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="p-6 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        to="/dashboard"
                        className="text-gray-400 hover:text-white transition"
                    >
                        <ArrowLeft size={20}/>
                    </Link>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Your Profile
                    </h1>
                </div>
                <Link
                    to="/edit-profile"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 transition"
                >
                    <Edit size={16}/> Edit
                </Link>
            </header>

            {/* Profile Content */}
            <main className="p-6 max-w-4xl mx-auto">
                <div className="bg-gray-900/70 p-8 rounded-2xl border border-gray-800 shadow-xl">
                    {/* Name & Verified Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold">
                            {profile.first_name} {profile.last_name}
                        </h2>
                        {profile.verified && (
                            <span className="flex items-center mt-2 sm:mt-0 text-green-400 text-sm font-medium">
                                <ShieldCheck size={16} className="mr-1"/> Verified
                            </span>
                        )}
                    </div>

                    {/* About Me */}
                    {profile.about_me && (
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold mb-2">About Me</h3>
                            <p className="text-gray-300 leading-relaxed">{profile.about_me}</p>
                        </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {profile.gender && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-400">Gender</h3>
                                <p className="text-white">{profile.gender}</p>
                            </div>
                        )}
                        {profile.age && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-400">Age</h3>
                                <p className="text-white">{profile.age}</p>
                            </div>
                        )}
                        {profile.location && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-400">Location</h3>
                                <p className="text-white">{profile.location}</p>
                            </div>
                        )}
                        {profile.languages && profile.languages.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-400">Languages</h3>
                                <p className="text-white">{profile.languages.join(', ')}</p>
                            </div>
                        )}
                    </div>

                    {/* Passions */}
                    {passions.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-3">Passions</h3>
                            <div className="flex flex-wrap gap-2">
                                {passions.map((passion, i) => (
                                    <span
                                        key={i}
                                        className="px-4 py-2 bg-indigo-900/50 text-indigo-200 rounded-full text-sm"
                                    >
                                        {passion}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Created At */}
                    <div className="mt-8 text-sm text-gray-500">
                        Joined on {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Profile;
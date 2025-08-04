// src/pages/Profile.js
import React, {useEffect, useState} from 'react';
import {supabase} from '../supabaseClient';
import {Link} from 'react-router-dom';
import {Edit, ShieldCheck} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Avatar from '../components/Avatar';

function Profile() {
    const [profile, setProfile] = useState(null);
    const [passions, setPassions] = useState([]);
    const [languages, setLanguages] = useState([]); // <-- State for languages
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            const {data: {user}} = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/login';
                return;
            }

            // Fetch profile and its related location in one query
            const {data: profileData, error: profileError} = await supabase
                .from('profiles')
                .select(`
                    *,
                    locations (*)
                `)
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error loading profile:', profileError);
                // Redirecting to edit profile might be a better user experience
                // if their profile is incomplete.
                if (profileError.code === 'PGRST116') { // 'PGRST116' is for "single() row not found"
                    alert('Profile not found. Please complete your profile.');
                    window.location.href = '/edit-profile';
                }
                setLoading(false);
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

            // Fetch languages via join table
            const {data: languageData, error: languageError} = await supabase
                .from('profile_languages')
                .select('languages (name)')
                .eq('profile_id', user.id);

            if (languageError) {
                console.error('Error loading languages:', languageError);
            } else {
                setLanguages(languageData.map(l => l.languages.name));
            }


            setLoading(false);
        };

        loadProfile();
    }, []);

    // Helper to format the location string
    const formatLocation = (location) => {
        if (!location) return null;
        return [location.city, location.region, location.country].filter(Boolean).join(', ');
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p>Loading your profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p>Could not load profile. <Link to="/edit-profile" className="text-indigo-400">Please create
                    one.</Link></p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Navbar/>

            {/* Profile Content */}
            <main className="flex-grow p-6 max-w-4xl mx-auto w-full">
                <div className="bg-gray-900/70 p-8 rounded-2xl border border-gray-800 shadow-xl">
                    <div className="flex items-center mb-6">
                        <Avatar seed={profile.id}
                                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500 mr-6"/>
                        <div className="flex-grow">
                            {/* Name & Edit Button */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-3xl font-bold">
                                        {profile.first_name} {profile.last_name}
                                    </h2>
                                    {profile.verified && (
                                        <span className="flex items-center text-green-400 text-sm font-medium">
                                            <ShieldCheck size={16} className="mr-1"/> Verified
                                        </span>
                                    )}
                                </div>
                                <Link
                                    to="/edit-profile"
                                    className="flex items-center gap-2 mt-4 sm:mt-0 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 transition"
                                >
                                    <Edit size={16}/> Edit Profile
                                </Link>
                            </div>
                        </div>
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
                        {profile.locations && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-400">Location</h3>
                                <p className="text-white">{formatLocation(profile.locations)}</p>
                            </div>
                        )}
                        {languages.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-400">Languages</h3>
                                <p className="text-white">{languages.join(', ')}</p>
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
            <Footer/>
        </div>
    );
}

export default Profile;
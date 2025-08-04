// src/pages/Profile.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import {
    Edit,
    ShieldCheck,
    User,
    MapPin,
    BookOpen,
    Heart,
    Calendar,
    Languages // Imported the Languages icon
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Avatar from '../components/Avatar';

// Helper function to format the location string
function formatLocation(location) {
    if (!location) return 'Not specified';
    return [location.city, location.region, location.country].filter(Boolean).join(', ') || 'Not specified';
}

function Profile() {
    const [profile, setProfile] = useState(null);
    const [passions, setPassions] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Redirect to login if no user is found
                window.location.href = '/login';
                return;
            }

            // Fetch profile data, including the related location
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select(`*, locations(*)`)
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error loading profile:', profileError);
                // Handle case where profile doesn't exist
                if (profileError.code === 'PGRST116') {
                    // Using alert for now, but a modal would be better UX
                    alert('Profile not found. Please complete your profile.');
                    window.location.href = '/edit-profile';
                }
                setLoading(false);
                return;
            }

            setProfile(profileData);

            // Fetch user's passions
            const { data: passionData, error: passionError } = await supabase
                .from('profile_passions')
                .select('passions (name)')
                .eq('profile_id', user.id);

            if (passionError) {
                console.error('Error loading passions:', passionError);
            } else {
                setPassions(passionData.map(p => p.passions.name));
            }

            // Fetch user's languages
            const { data: languageData, error: languageError } = await supabase
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

    // Loading state UI
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <p className="text-gray-400 animate-pulse">Loading your profile...</p>
            </div>
        );
    }

    // UI for when profile could not be loaded
    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
                <p className="mb-4">Could not load your profile.</p>
                <Link to="/edit-profile" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
                    Create Your Profile
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white font-sans">
            <Navbar />

            <main className="flex-grow p-4 sm:p-6 w-full">
                <div className="max-w-4xl mx-auto">
                    {/* Profile Card with improved styling */}
                    <div className="bg-gray-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-2xl shadow-indigo-900/20">

                        {/* Header: Avatar, Name, Edit Button */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                            <Avatar seed={profile.id} className="w-28 h-28 rounded-full object-cover border-4 border-indigo-500 shadow-lg" />
                            <div className="flex-grow text-center sm:text-left">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-2 sm:mb-0">
                                        <h1 className="text-3xl lg:text-4xl font-bold">{profile.first_name} {profile.last_name}</h1>
                                        {profile.verified && (
                                            <span className="flex items-center text-green-400 text-sm font-medium" title="Verified user">
                                                <ShieldCheck size={18} className="mr-1" />
                                            </span>
                                        )}
                                    </div>
                                    <Link
                                        to="/edit-profile"
                                        className="self-center sm:self-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all duration-300 transform hover:scale-105"
                                    >
                                        <Edit size={16} /> Edit Profile
                                    </Link>
                                </div>
                                <p className="text-gray-400 mt-1">Joined on {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>

                        {/* About Me Section */}
                        {profile.about_me && (
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-3">
                                    <BookOpen className="h-6 w-6 text-indigo-400" />
                                    <h2 className="text-xl font-semibold">About Me</h2>
                                </div>
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap pl-9">{profile.about_me}</p>
                            </div>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8 border-t border-b border-gray-800 py-8">
                            <DetailItem icon={<User className="text-indigo-400" />} label="Gender" value={profile.gender} />
                            <DetailItem icon={<Calendar className="text-indigo-400" />} label="Age" value={profile.age} />
                            <DetailItem icon={<MapPin className="text-indigo-400" />} label="Location" value={formatLocation(profile.locations)} />
                            {languages.length > 0 && (
                                <DetailItem icon={<Languages className="text-indigo-400" />} label="Languages">
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {languages.map((lang, i) => (
                                            <span key={i} className="px-3 py-1 bg-gray-700/50 text-indigo-200 rounded-full text-sm">
                                                {lang}
                                            </span>
                                        ))}
                                    </div>
                                </DetailItem>
                            )}
                        </div>

                        {/* Passions Section */}
                        {passions.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <Heart className="h-6 w-6 text-pink-400" />
                                    <h2 className="text-xl font-semibold">Passions</h2>
                                </div>
                                <div className="flex flex-wrap gap-3 pl-9">
                                    {passions.map((passion, i) => (
                                        <span key={i} className="px-4 py-2 bg-indigo-900/70 text-indigo-200 rounded-full text-sm border border-indigo-700/80 shadow-sm">
                                            {passion}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

// A reusable component for profile detail items to reduce repetition
const DetailItem = ({ icon, label, value, children }) => {
    if (!value && !children) return null;

    return (
        <div className="flex items-start gap-4">
            <div className="mt-1">{React.cloneElement(icon, { size: 20 })}</div>
            <div>
                <h3 className="text-sm font-medium text-gray-400">{label}</h3>
                {value && <p className="text-white font-medium">{value}</p>}
                {children}
            </div>
        </div>
    );
};

export default Profile;

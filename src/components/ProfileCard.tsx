// src/components/ProfileCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, User, MapPin, BookOpen, Heart, Calendar, Languages } from 'lucide-react';
import Avatar from './Avatar';
import { FullProfile } from '../types';

interface ProfileCardProps {
    profile: FullProfile;
    passions: string[];
    languages: string[];
    actionSlot: React.ReactNode;
}

const formatLocation = (location: FullProfile['locations']) => {
    if (!location) return 'Not specified';
    return [location.city, location.region, location.country].filter(Boolean).join(', ');
};

// 👇 CHANGE #1: Simplify the DetailItem component
const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string | number | null; children?: React.ReactNode }> = ({ icon, label, value, children }) => {
    if (!value && !children) return null;
    return (
        <div className="flex items-start gap-4">
            {/* Just render the icon directly, no cloning needed */}
            <div className="mt-1 text-indigo-400">{icon}</div>
            <div>
                <h3 className="text-sm font-medium text-gray-400">{label}</h3>
                {value && <p className="text-white font-medium">{value}</p>}
                {children}
            </div>
        </div>
    );
};

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, passions, languages, actionSlot }) => {
    return (
        <div className="bg-gray-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-2xl shadow-indigo-900/20">
            {/* Header: Avatar, Name, Action Button */}
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
                        {actionSlot}
                    </div>
                    <p className="text-gray-400 mt-1">Joined on {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* About Me Section */}
            {profile.about_me && (
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        {/* 👇 CHANGE #2: Pass props directly to the icon components */}
                        <BookOpen size={20} className="h-6 w-6 text-indigo-400" />
                        <h2 className="text-xl font-semibold">About {profile.first_name}</h2>
                    </div>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap pl-9">{profile.about_me}</p>
                </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8 border-t border-b border-gray-800 py-8">
                {/* 👇 CHANGE #2 (continued): Pass props directly to all icon components */}
                <DetailItem icon={<User size={20} />} label="Gender" value={profile.gender} />
                <DetailItem icon={<Calendar size={20} />} label="Age" value={profile.age} />
                <DetailItem icon={<MapPin size={20} />} label="Location" value={formatLocation(profile.locations)} />
                {languages.length > 0 && (
                    <DetailItem icon={<Languages size={20} />} label="Languages">
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
                        <Heart size={20} className="h-6 w-6 text-pink-400" />
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
    );
};

export default ProfileCard;
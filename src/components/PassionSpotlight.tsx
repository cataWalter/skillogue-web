// src/components/PassionSpotlight.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import Avatar from './Avatar';
import { Zap, Sparkles } from 'lucide-react';
// ✅ Import shared types
import { UserPassion, SuggestedProfile as SpotlightProfile } from '../types';

interface PassionSpotlightProps {
    userPassions: UserPassion[];
    userId: string;
}

const PassionSpotlight: React.FC<PassionSpotlightProps> = ({ userPassions, userId }) => {
    const [spotlightPassion, setSpotlightPassion] = useState<UserPassion | null>(null);
    const [profiles, setProfiles] = useState<SpotlightProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userPassions.length > 0) {
            const randomPassion = userPassions[Math.floor(Math.random() * userPassions.length)];
            setSpotlightPassion(randomPassion);

            const fetchProfiles = async () => {
                setLoading(true);
                const { data, error } = await supabase.rpc('get_profiles_for_passion', {
                    p_passion_id: randomPassion.passion_id,
                    p_exclude_user_id: userId,
                    p_limit: 5,
                });

                if (error) console.error('Error fetching passion profiles:', error);
                else setProfiles(data || []);
                setLoading(false);
            };

            fetchProfiles();
        }
    }, [userPassions, userId]);

    const passionName = spotlightPassion?.passions[0]?.name;

    if (!passionName || (loading && profiles.length === 0)) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-600/20 rounded-full blur-2xl" />
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={18} className="text-purple-400" />
                    <h3 className="text-xl font-bold">Explore: {passionName}</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                    Others who share your passion for {passionName}.
                </p>
                {profiles.length > 0 ? (
                    <>
                        <div className="flex flex-wrap gap-3 mb-4">
                            {profiles.map(p => (
                                <Link href={`/user/${p.id}`} key={p.id} title={p.first_name || 'User'}>
                                    <Avatar seed={p.id} className="w-10 h-10 rounded-full border-2 border-transparent hover:border-indigo-500 transition-all hover:scale-110" />
                                </Link>
                            ))}
                        </div>
                        <Link href={`/search?passion=${passionName}`} className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                            <Zap size={14} /> See more like-minded people
                        </Link>
                    </>
                ) : (
                    <p className="text-gray-500 text-sm">No other users with this passion yet.</p>
                )}
            </div>
        </div>
    );
};

export default PassionSpotlight;
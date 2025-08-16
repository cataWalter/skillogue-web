// src/components/PassionSpotlight.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { Zap } from 'lucide-react';
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
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold mb-2">Explore: {passionName}</h3>
            <p className="text-gray-400 text-sm mb-4">
                Others who share your passion for {passionName}.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
                {profiles.map(p => (
                    <Link to={`/profile/${p.id}`} key={p.id} title={p.first_name || 'User'}>
                        <Avatar seed={p.id} className="w-10 h-10 rounded-full border-2 border-transparent hover:border-indigo-500" />
                    </Link>
                ))}
            </div>
            <Link to={`/search?passion=${passionName}`} className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:underline">
                <Zap size={14} /> See more like-minded people
            </Link>
        </div>
    );
};

export default PassionSpotlight;
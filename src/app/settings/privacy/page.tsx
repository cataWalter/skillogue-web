'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Eye, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const PrivacySettings: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        is_private: false,
        show_age: true,
        show_location: true
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('is_private, show_age, show_location')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching privacy settings:', error);
                // Don't show error toast on initial load if columns don't exist yet, just default
            } else if (data) {
                setSettings({
                    is_private: data.is_private || false,
                    show_age: data.show_age ?? true,
                    show_location: data.show_location ?? true
                });
            }
            setLoading(false);
        };

        fetchSettings();
    }, [router]);

    const updateSetting = async (key: keyof typeof settings, value: boolean) => {
        // Optimistic update
        setSettings(prev => ({ ...prev, [key]: value }));

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({ [key]: value })
            .eq('id', user.id);

        if (error) {
            console.error(`Error updating ${key}:`, error);
            toast.error('Failed to update setting');
            // Rollback
            setSettings(prev => ({ ...prev, [key]: !value }));
        } else {
            toast.success('Settings updated');
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading settings...</div>;
    }

    return (
        <main className="flex-grow p-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center mb-8">
                <Link href="/settings" className="text-gray-400 hover:text-white transition flex items-center gap-2">
                    <ArrowLeft size={20} />
                    Back to Settings
                </Link>
            </div>

            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Lock className="text-indigo-400" /> Privacy Settings
            </h1>
            <p className="text-gray-400 mb-8">
                Control who can see your profile and personal details.
            </p>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                {/* Private Profile */}
                <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Eye size={20} className="text-gray-400" /> Private Profile
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                            When enabled, only your name and avatar will be visible to others. Your detailed profile info will be hidden.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.is_private}
                            onChange={(e) => updateSetting('is_private', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                {/* Show Age */}
                <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Calendar size={20} className="text-gray-400" /> Show Age
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                            Display your age on your public profile.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.show_age}
                            onChange={(e) => updateSetting('show_age', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                {/* Show Location */}
                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <MapPin size={20} className="text-gray-400" /> Show Location
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                            Display your city and country on your public profile.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.show_location}
                            onChange={(e) => updateSetting('show_location', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
            </div>
        </main>
    );
};

export default PrivacySettings;

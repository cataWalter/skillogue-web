'use client'

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

type Passion = { id: number; name: string; };

interface ProfileEditFormProps {
    profile: { username: string; bio: string | null; };
    allPassions: Passion[];
    initialSelectedPassions: number[];
}

export function ProfileEditForm({ profile, allPassions, initialSelectedPassions }: ProfileEditFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [bio, setBio] = useState(profile.bio || '');
    const [selectedPassions, setSelectedPassions] = useState<Set<number>>(new Set(initialSelectedPassions));

    const handlePassionChange = (passionId: number) => {
        setSelectedPassions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(passionId)) {
                newSet.delete(passionId);
            } else {
                newSet.add(passionId);
            }
            return newSet;
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        startTransition(async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in.");
                return;
            }

            // --- LOGGING THE PAYLOAD ---
            console.log(`Attempting to update profile for user: ${user.id}`);
            console.log("Payload for 'profiles' table update:", { bio });
            // --- END LOGGING ---

            // 1. Update the bio in the profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ about_me: bio }) // Corrected column name to 'about_me'
                .eq('id', user.id);

            if (profileError) {
                console.error("Supabase profile update error:", profileError);
                toast.error('Failed to update profile.');
                return;
            }

            // 2. Sync passions in the profile_passions table
            const passionsToInsert = Array.from(selectedPassions).map(passion_id => ({
                profile_id: user.id,
                passion_id
            }));

            // --- LOGGING THE PAYLOAD ---
            console.log("Payload for 'profile_passions' table insert:", passionsToInsert);
            // --- END LOGGING ---


            // Delete old passions first, then insert the new set
            const { error: deleteError } = await supabase.from('profile_passions').delete().eq('profile_id', user.id);
            if (deleteError) {
                console.error("Supabase passion delete error:", deleteError);
                toast.error('Failed to update passions. Please try again.');
                return;
            }

            if (passionsToInsert.length > 0) {
                const { error: insertError } = await supabase.from('profile_passions').insert(passionsToInsert);
                if (insertError) {
                    console.error("Supabase passion insert error:", insertError);
                    toast.error('Failed to save some passions. Please try again.');
                    return;
                }
            }

            toast.success("Profile updated successfully!");
            router.push('/profile');
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                    id="bio"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Your Passions</label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {allPassions.map(passion => (
                        <label key={passion.id} className="flex items-center space-x-2 p-2 border rounded-md">
                            <input
                                type="checkbox"
                                checked={selectedPassions.has(passion.id)}
                                onChange={() => handlePassionChange(passion.id)}
                                className="rounded border-gray-300 text-indigo-600"
                            />
                            <span>{passion.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="text-right">
                <button
                    type="submit"
                    disabled={isPending}
                    className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:bg-green-400"
                >
                    {isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}

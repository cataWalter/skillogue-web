// src/app/(main)/profile/edit/page.tsx

import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { ProfileEditForm } from './ProfileEditForm'; // We will create this client component

// Define types for clarity
type Passion = {
    id: number;
    name: string;
};

type ProfileData = {
    username: string;
    bio: string | null;
    selectedPassions: number[];
};

// Server function to get all necessary data
async function getProfileData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch profile and user's current passions simultaneously
    const profilePromise = await supabase.from('profiles').select('username, bio').eq('id', user.id).single();
    const passionsPromise = await supabase.from('passions').select('id, name');
    const selectedPassionsPromise = await supabase.from('profile_passions').select('passion_id').eq('profile_id', user.id);

    const [
        { data: profile, error: profileError },
        { data: allPassions, error: passionsError },
        { data: selectedPassionsData, error: selectedPassionsError }
    ] = await Promise.all([profilePromise, passionsPromise, selectedPassionsPromise]);

    if (profileError || !profile) return null;
    if (passionsError) console.error("Error fetching passions:", passionsError);
    if (selectedPassionsError) console.error("Error fetching selected passions:", selectedPassionsError);

    const selectedPassions = selectedPassionsData ? selectedPassionsData.map(p => p.passion_id) : [];

    return {
        profile: {
            username: profile.username,
            bio: profile.bio
        },
        allPassions: allPassions as Passion[],
        selectedPassions,
    };
}

export default async function ProfileEditPage() {
    const data = await getProfileData();

    if (!data) {
        notFound();
    }

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <h1 className="text-2xl font-bold mb-4">Edit Your Profile</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <ProfileEditForm
                    profile={data.profile}
                    allPassions={data.allPassions}
                    initialSelectedPassions={data.selectedPassions}
                />
            </div>
        </div>
    );
}
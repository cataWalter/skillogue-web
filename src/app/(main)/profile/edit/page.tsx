import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { ProfileEditForm } from './ProfileEditForm';

// --- Type Definitions ---
type Passion = {
    id: number;
    name: string;
};

// This type now matches what ProfileEditForm expects, based on the error.
type ProfileForEdit = {
    username: string;
    bio: string | null;
};

// This type can be used for the data returned from the server function
type ProfilePageData = {
    profile: ProfileForEdit;
    allPassions: Passion[];
    selectedPassions: number[];
}

// --- Server function to get all necessary data (with corrected error handling) ---
async function getProfileData(): Promise<ProfilePageData | null> {
    console.log("Attempting to fetch profile data for edit page...");
    const supabase = await createClient();

    // Safer way to get the user to prevent crash on error
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("No authenticated user found or error fetching user. Aborting.", userError);
        return null;
    }
    console.log("Authenticated user found:", user.id);

    // --- LOGGING THE QUERIES ---
    console.log("Preparing to query Supabase with the following requests:");
    console.log(`1. Fetch profile: from('profiles').select('first_name, last_name, about_me').eq('id', '${user.id}')`);
    console.log("2. Fetch all passions: from('passions').select('id, name')");
    console.log(`3. Fetch user's passions: from('profile_passions').select('passion_id').eq('profile_id', '${user.id}')`);
    // --- END LOGGING ---

    // Fetch profile, all passions, and user's current passions simultaneously
    // We fetch the real column names from the database.
    const profilePromise = supabase.from('profiles').select('first_name, last_name, about_me').eq('id', user.id).single();
    const passionsPromise = supabase.from('passions').select('id, name');
    const selectedPassionsPromise = supabase.from('profile_passions').select('passion_id').eq('profile_id', user.id);

    const [
        { data: profile, error: profileError },
        { data: allPassions, error: passionsError },
        { data: selectedPassionsData, error: selectedPassionsError }
    ] = await Promise.all([profilePromise, passionsPromise, selectedPassionsPromise]);

    if (profileError || !profile) {
        console.error("Error fetching profile for edit page:", profileError);
        return null;
    }
    console.log("Successfully fetched profile:", profile);

    if (passionsError) {
        console.error("Error fetching all passions:", passionsError);
    } else {
        console.log("Successfully fetched all passions:", allPassions);
    }

    if (selectedPassionsError) {
        console.error("Error fetching selected passions:", selectedPassionsError);
    } else {
        console.log("Successfully fetched user's selected passions:", selectedPassionsData);
    }

    // Safely map the data
    const selectedPassions = selectedPassionsData ? selectedPassionsData.map(p => p.passion_id) : [];

    // Transform the fetched data to match the expected ProfileForEdit type
    const dataToReturn: ProfilePageData = {
        profile: {
            username: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            bio: profile.about_me
        },
        allPassions: allPassions || [], // Ensure allPassions is an array
        selectedPassions,
    };

    console.log("Returning data for edit page:", dataToReturn);
    return dataToReturn;
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

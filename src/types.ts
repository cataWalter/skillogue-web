// src/types.ts

export interface ProfileData {
    id: string;
    first_name: string | null;
    about_me: string | null;
    passions_count: number;
    languages_count: number;
}

export interface RecentConversation {
    user_id: string;
    full_name: string;
    last_message: string;
    unread_count: number;
}

export interface SuggestedProfile {
    id: string;
    first_name: string | null;
    last_name: string | null;
}

export interface UserPassion {
    passion_id: number;
    // This is the correct shape based on the Supabase query result
    passions: { name: string }[];
}

export interface FullProfile {
    id: string;
    created_at: string;
    first_name: string | null;
    last_name: string | null;
    about_me: string | null;
    age: number | null;
    gender: string | null;
    verified: boolean;
    locations: { // Supabase returns relations as arrays, even for one-to-one
        city: string | null;
        region: string | null;
        country: string | null;
    } | null;
}
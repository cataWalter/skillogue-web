// Main profile type, matches the 'profiles' table in the database
export interface Profile {
    id: string;
    first_name: string | null;
    last_name: string | null;
    about_me: string | null;
    created_at: string;
    // New fields added to match the updated schema
    gender: string | null;
    location: string | null;
    age: number | null;
    languages: string[] | null;
    verified: boolean;
}

// Represents a single passion, matching the 'passions' table
export interface Passion {
    id: number;
    name: string;
    created_at: string;
}

// Represents the join table between profiles and passions
export interface ProfilePassion {
    id: number;
    profile_id: string;
    passion_id: number;
}

// Represents a single chat message, matching the 'messages' table
export interface Message {
    id: number;
    created_at: string;
    sender_id: string;
    receiver_id: string;
    content: string;
}

// Represents a user report, matching the 'reports' table
export interface Report {
    id: number;
    reporter_id: string;
    reported_user_id: string;
    reason: string;
    created_at: string;
}
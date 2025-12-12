// src/types.ts

// --- User & Profile Types ---

/**
 * Represents the detailed profile of a user, including location.
 * Used in ProfileCard, UserProfile, and EditProfile pages.
 [cite_start]* [cite: 1340, 1504, 1512, 1813]
 */
export interface FullProfile {
    id: string;
    created_at: string;
    first_name: string | null;
    last_name: string | null;
    about_me: string | null;
    age: number | null;
    gender: string | null;
    verified: boolean;
    is_private?: boolean;
    show_age?: boolean;
    show_location?: boolean;
    locations: {
        city: string | null;
        region: string | null;
        country: string | null;
    } | null;
}

/**
 * A summary of profile data for dashboard cards and lists.
 [cite_start]* [cite: 1340]
 */
export interface ProfileData {
    id: string;
    first_name: string | null;
    about_me: string | null;
    passions_count: number;
    languages_count: number;
}

/**
 * A minimal profile shape for suggestions.
 [cite_start]* [cite: 1340]
 */
export interface SuggestedProfile {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url?: string;
    shared_passions_count?: number;
}

/**
 * Shape of profile data used for the completeness check in ProtectedRoute.
 [cite_start]* [cite: 1505, 1507, 1508]
 */
export interface ProfileCheckData {
    first_name: string | null;
    last_name: string | null;
    about_me: string | null;
    age: number | null;
    gender: string | null;
    location_id: number | null;
    passions_count: { count: number }[];
    languages_count: { count: number }[];
}


// --- Passions & Languages ---

/**
 * Represents a single passion entity.
 * Used in EditProfile and Search pages.
 [cite_start]* [cite: 1847]
 */
export interface Passion {
    id: number;
    name: string;
}

/**
 * Represents the join table record for a user's passion.
 [cite_start]* [cite: 1340]
 */
export interface UserPassion {
    passion_id: number;
    passions: { name: string }[];
}

/**
 * Represents a single language entity.
 * Used in the EditProfile page.
 */
export interface Language {
    id: number;
    name: string;
}


// --- Messaging Types ---

/**
 * Represents a single message between two users.
 * Sourced from `Messages.tsx`.
 [cite_start]* [cite: 1689]
 */
export interface Message {
    id: number;
    created_at: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    sender: SuggestedProfile;   // Re-using SuggestedProfile for sender/receiver shape
    receiver: SuggestedProfile;
}

/**
 * Represents a conversation thread in the messages list.
 * Consolidates `RecentConversation` and `Conversation` types.
 [cite_start]* [cite: 1340, 1690]
 */
export interface Conversation {
    conversation_id?: string;
    user_id: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    last_message: string;
    last_message_time?: string;
    unread_count: number;
}


// --- Notification Types ---

/**
 * The raw notification shape from Supabase before transformation.
 * Sourced from `NotificationContext.tsx`.
 [cite_start]* [cite: 1517]
 */
export interface RawNotification {
    id: number;
    read: boolean;
    type: string;
    created_at: string;
    actor: {
        id: string;
        first_name: string | null;
    } | {
        id: string;
        first_name: string | null;
    }[] | null;
}

/**
 * The clean notification shape used throughout the app.
 * Sourced from `NotificationContext.tsx`.
 [cite_start]* [cite: 1517]
 */
export interface Notification {
    id: number;
    read: boolean;
    type: string;
    created_at: string;
    actor: {
        id: string;
        first_name: string | null;
    } | null;
}


// --- Search Types ---

/**
 * Represents the structure of a saved search.
 * Sourced from `Search.tsx`.
 [cite_start]* [cite: 1847]
 */
export interface SavedSearch {
    id: number;
    name: string;
    query: string | null;
    location: string | null;
    min_age: number | null;
    max_age: number | null;
    language: string | null;
    gender: string | null;
    passion_ids: number[] | null;
}

/**
 * Represents the structure of a single user profile in search results.
 * Sourced from `Search.tsx`.
 [cite_start]* [cite: 1847]
 */
export interface SearchResult {
    id: string;
    first_name: string | null;
    last_name: string | null;
    about_me: string | null;
    location: string | null;
    age: number | null;
    gender: string | null;
    profile_languages: string[] | null;
    created_at: string;
    profilepassions: string[];
}


// --- Page & Component State Types ---

/**
 * Represents the state of the profile form in `EditProfile.tsx`.
 [cite_start]* [cite: 1572]
 */
export interface ProfileState {
    first_name: string;
    last_name: string;
    about_me: string;
    age: string;
    gender: string;
}

/**
 * Represents the state of the location form in `EditProfile.tsx`.
 [cite_start]* [cite: 1572]
 */
export interface LocationState {
    city: string;
    region: string;
    country: string;
}
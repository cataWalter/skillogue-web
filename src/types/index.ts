// Main profile type, matches the 'profiles' table
export interface Profile {
    id: string;
    first_name: string | null;
    last_name: string | null;
    about_me: string | null;
    location: string | null;
    age: number | null;
    languages: string[] | null;
}

// Type for a single passion, matches the 'passions' table
export interface Passion {
    id: number;
    name: string;
}

// Type for the join table, matches 'user_passions'
export interface UserPassion {
    user_id: string;
    passion_id: number;
}
export interface ProfileWithPassions extends Profile {
    passions: Passion[];
}
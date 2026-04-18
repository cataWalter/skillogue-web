export type FullProfile = {
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
    id?: string;
    city: string | null;
    region: string | null;
    country: string | null;
  } | null;
};

export type ProfileData = {
  id: string;
  first_name: string | null;
  about_me: string | null;
  passions_count: number;
  languages_count: number;
};

export type Conversation = {
  conversation_id?: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  last_message: string;
  last_message_time?: string;
  unread?: number;
  unread_count?: number;
};

export type SuggestedProfile = {
  id: string;
  first_name: string | null;
  last_name?: string | null;
  avatar_url?: string;
  shared_passions_count?: number;
};

export type UserPassion = {
  passion_id: number | string;
  passions?: { name: string } | null;
};

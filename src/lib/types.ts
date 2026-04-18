export type FullProfile = {
  id: string;
  first_name: string;
  last_name: string;
  about_me: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  verified: boolean;
  created_at: string;
  user_id: string;
};

export type ProfileData = {
  data?: FullProfile;
  loading: boolean;
  error: string | null;
};

export type Conversation = {
  id: string;
  user_id: string;
  messages: any[];
  created_at: string;
};

export type SuggestedProfile = {
  id: string;
  first_name: string;
  last_name: string;
  passion: string[];
};

export type UserPassion = {
  passion: string[];
};

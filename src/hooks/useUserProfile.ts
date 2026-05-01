import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface FullProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  aboutMe?: string;
  age?: number;
  gender?: string;
  verified: boolean;
  isPrivate: boolean;
  showAge: boolean;
  showLocation: boolean;
  locationId?: number;
  avatarUrl?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };
  passions?: string[];
  languages?: string[];
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/profile/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<FullProfile>) => {
    if (!user) return;

    const response = await fetch(`/api/profile/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
    }
  };

  return { profile, loading, updateProfile };
};

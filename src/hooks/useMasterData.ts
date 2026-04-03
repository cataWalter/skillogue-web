import { useState, useEffect, useCallback } from 'react';

export interface Passion {
  id: number;
  name: string;
}

export interface Language {
  id: number;
  name: string;
}

export interface Location {
  id: number;
  city?: string;
  region?: string;
  country?: string;
}

export const useMasterData = () => {
  const [passions, setPassions] = useState<Passion[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [passionsRes, languagesRes, locationsRes] = await Promise.all([
        fetch('/api/passions'),
        fetch('/api/languages'),
        fetch('/api/locations'),
      ]);

      if (passionsRes.ok) setPassions(await passionsRes.json());
      if (languagesRes.ok) setLanguages(await languagesRes.json());
      if (locationsRes.ok) setLocations(await locationsRes.json());
    } catch (error) {
      console.error('Error fetching master data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { passions, languages, locations, loading, refresh: fetchData };
};
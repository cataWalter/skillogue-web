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

const readListResponse = async <T,>(path: string): Promise<T[]> => {
  const response = await fetch(path);

  if (!response || !response.ok || typeof response.json !== 'function') {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const useMasterData = () => {
  const [passions, setPassions] = useState<Passion[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [passionsData, languagesData, locationsData] = await Promise.all([
        readListResponse<Passion>('/api/passions'),
        readListResponse<Language>('/api/languages'),
        readListResponse<Location>('/api/locations'),
      ]);

      setPassions(passionsData);
      setLanguages(languagesData);
      setLocations(locationsData);
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
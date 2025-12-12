// src/hooks/useMasterData.ts
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface Passion {
    id: number;
    name: string;
}

interface Language {
    id: number;
    name: string;
}

interface MasterData {
    passions: Passion[];
    languages: Language[];
    countries: string[];
    loading: boolean;
}

// Keep data in a singleton cache outside the hook to prevent re-fetching
let cachedData: MasterData | null = null;

export const useMasterData = (): MasterData => {
    const [data, setData] = useState<MasterData>(
        cachedData || { passions: [], languages: [], countries: [], loading: true }
    );

    useEffect(() => {
        const fetchMasterData = async () => {
            if (cachedData) {
                setData(cachedData);
                return;
            }

            console.log('[useMasterData] Fetching master data...');
            try {
                const [passionRes, languageRes, countriesRes] = await Promise.all([
                    supabase.from('passions').select('id, name'),
                    supabase.from('languages').select('id, name'),
                    supabase.rpc('get_distinct_countries')
                ]);

                if (passionRes.error) throw passionRes.error;
                if (languageRes.error) throw languageRes.error;
                if (countriesRes.error) throw countriesRes.error;

                const newData = {
                    passions: passionRes.data || [],
                    languages: languageRes.data || [],
                    countries: countriesRes.data?.map((c: { country: string }) => c.country) || [],
                    loading: false,
                };

                cachedData = newData; // Cache the data
                setData(newData);

            } catch (error) {
                console.error("Error fetching master data:", error);
                setData(d => ({ ...d, loading: false }));
            }
        };

        fetchMasterData();
    }, []);

    return data;
};
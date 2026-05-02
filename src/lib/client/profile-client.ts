'use client';

import { appClient } from '@/lib/appClient';
import staticMasterData from '@/lib/static-master-data';

type PassionIdRow = { passion_id?: string | null };
type LanguageIdRow = { language_id?: string | null };
export type ReferenceItem = { id: string; name: string };

/** Returns the passion names for a given profile. */
export const getProfilePassions = async (profileId: string): Promise<string[]> => {
    const { data } = await appClient
        .from('profile_passions')
        .select('passion_id')
        .eq('profile_id', profileId);

    const ids = new Set((data as PassionIdRow[] | null)?.map((row) => row.passion_id).filter(Boolean) ?? []);
    return staticMasterData.passions
        .filter((p: { id: string }) => ids.has(p.id))
        .map((p: { name: string }) => p.name);
};

/** Returns the language names for a given profile. */
export const getProfileLanguages = async (profileId: string): Promise<string[]> => {
    const { data } = await appClient
        .from('profile_languages')
        .select('language_id')
        .eq('profile_id', profileId);

    const ids = new Set((data as LanguageIdRow[] | null)?.map((row) => row.language_id).filter(Boolean) ?? []);
    return staticMasterData.languages
        .filter((l: { id: string }) => ids.has(l.id))
        .map((l: { name: string }) => l.name);
};

/** Returns all passions available in the platform. */
export const getAllPassions = async (): Promise<ReferenceItem[]> => {
    return staticMasterData.passions as ReferenceItem[];
};

/** Returns all languages available in the platform. */
export const getAllLanguages = async (): Promise<ReferenceItem[]> => {
    return staticMasterData.languages as ReferenceItem[];
};

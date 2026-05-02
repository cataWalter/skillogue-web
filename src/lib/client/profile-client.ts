'use client';

import { appClient } from '@/lib/appClient';

type NamedRow = { passions?: { name: string } | null };
type LanguageRow = { languages?: { name: string } | null };
type ReferenceItem = { id: number; name: string };

/** Returns the passion names for a given profile. */
export const getProfilePassions = async (profileId: string): Promise<string[]> => {
    const { data } = await appClient
        .from('profile_passions')
        .select('passions(name)')
        .eq('profile_id', profileId);

    return (data as NamedRow[] | null)?.flatMap((row) =>
        row.passions?.name ? [row.passions.name] : []
    ) ?? [];
};

/** Returns the language names for a given profile. */
export const getProfileLanguages = async (profileId: string): Promise<string[]> => {
    const { data } = await appClient
        .from('profile_languages')
        .select('languages(name)')
        .eq('profile_id', profileId);

    return (data as LanguageRow[] | null)?.flatMap((row) =>
        row.languages?.name ? [row.languages.name] : []
    ) ?? [];
};

/** Returns all passions available in the platform. */
export const getAllPassions = async (): Promise<ReferenceItem[]> => {
    const { data } = await appClient.from('passions').select('id, name');
    return (data as ReferenceItem[] | null) ?? [];
};

/** Returns all languages available in the platform. */
export const getAllLanguages = async (): Promise<ReferenceItem[]> => {
    const { data } = await appClient.from('languages').select('id, name');
    return (data as ReferenceItem[] | null) ?? [];
};

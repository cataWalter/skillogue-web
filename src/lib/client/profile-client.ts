'use client';

import { appClient } from '@/lib/appClient';

export type ReferenceItem = { id: string; name: string };

/** Returns the passion names for a given profile. */
export const getProfilePassions = async (profileId: string): Promise<string[]> => {
    const { data } = await appClient.rpc<string[]>('get_profile_passions', { profile_id: profileId });
    return (data as string[] | null) ?? [];
};

/** Returns the language names for a given profile. */
export const getProfileLanguages = async (profileId: string): Promise<string[]> => {
    const { data } = await appClient.rpc<string[]>('get_profile_languages', { profile_id: profileId });
    return (data as string[] | null) ?? [];
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

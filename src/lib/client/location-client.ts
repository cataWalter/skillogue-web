'use client';

import { appClient } from '@/lib/appClient';

/** Returns distinct countries that have at least one location record. */
export const getCountries = async (): Promise<string[]> => {
    const { data } = await appClient.rpc('get_distinct_countries');
    return (data as Array<{ country: string }> | null)?.map((c) => c.country) ?? [];
};

/** Returns distinct regions for a given country. */
export const getRegions = async (country: string): Promise<string[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (appClient as any).rpc('get_distinct_regions', { p_country: country });
    return (data as Array<{ region: string }> | null)?.map((r) => r.region).filter(Boolean) ?? [];
};

/** Returns distinct cities for a given country and optional region. */
export const getCities = async (country: string, region?: string | null): Promise<string[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (appClient as any).rpc('get_distinct_cities', {
        p_country: country,
        p_region: region ?? null,
    });
    return (data as Array<{ city: string }> | null)?.map((c) => c.city) ?? [];
};

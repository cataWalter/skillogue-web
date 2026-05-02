import staticMasterData from '@/lib/static-master-data';

/** Returns distinct countries from static location data, sorted alphabetically. */
export const getCountries = async (): Promise<string[]> => {
    return [...new Set(staticMasterData.locations.map((l: { country: string }) => l.country))].sort();
};

/** Returns distinct regions for a given country from static location data, sorted alphabetically. */
export const getRegions = async (country: string): Promise<string[]> => {
    return [
        ...new Set(
            staticMasterData.locations
                .filter((l: { country: string }) => l.country === country)
                .map((l: { region: string }) => l.region)
                .filter(Boolean)
        ),
    ].sort();
};

/** Returns distinct cities for a given country and optional region from static location data, sorted alphabetically. */
export const getCities = async (country: string, region?: string | null): Promise<string[]> => {
    return staticMasterData.locations
        .filter(
            (l: { country: string; region: string }) =>
                l.country === country && (!region || l.region === region)
        )
        .map((l: { city: string }) => l.city)
        .sort();
};

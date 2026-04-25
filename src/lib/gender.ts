export const GENDER_OPTIONS = ['Male', 'Female'] as const;

export type GenderOption = (typeof GENDER_OPTIONS)[number];

const GENDER_LOOKUP: Record<string, GenderOption> = {
    male: 'Male',
    m: 'Male',
    uomo: 'Male',
    maschio: 'Male',
    female: 'Female',
    f: 'Female',
    donna: 'Female',
    femminile: 'Female',
};

export const normalizeGender = (value?: string | null): GenderOption | null => {
    const normalizedValue = value?.trim().toLowerCase();

    if (!normalizedValue) {
        return null;
    }

    return GENDER_LOOKUP[normalizedValue] ?? null;
};

import { normalizeGender } from './gender';

export const DEFAULT_PROFILE_NAME = 'Skillogue user';
export const DEFAULT_PROFILE_BIO = 'This user has not added a bio yet.';
export const DEFAULT_GENDER = 'Not specified';
export const DEFAULT_LOCATION = 'Not specified';
export const DEFAULT_MESSAGE_PREVIEW = 'No messages yet';

export const getOptionalText = (value?: string | null) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
};

export const getDisplayName = (firstName?: string | null, lastName?: string | null) => {
  const nameParts = [getOptionalText(firstName), getOptionalText(lastName)].filter(Boolean) as string[];
  return nameParts.length > 0 ? nameParts.join(' ') : DEFAULT_PROFILE_NAME;
};

export const getDisplayFullName = (fullName?: string | null) => getOptionalText(fullName) || DEFAULT_PROFILE_NAME;

export const getDisplayBio = (aboutMe?: string | null) => getOptionalText(aboutMe) || DEFAULT_PROFILE_BIO;

export const getDisplayGender = (gender?: string | null) => normalizeGender(gender) || DEFAULT_GENDER;

export const getDisplayLocation = (location?: string | null) => getOptionalText(location) || DEFAULT_LOCATION;

export const getDisplayLocationParts = (parts: Array<string | null | undefined>) => {
  const formattedLocation = parts
    .map((part) => getOptionalText(part))
    .filter(Boolean)
    .join(', ');

  return formattedLocation || DEFAULT_LOCATION;
};

export const getDisplayMessagePreview = (message?: string | null) => getOptionalText(message) || DEFAULT_MESSAGE_PREVIEW;

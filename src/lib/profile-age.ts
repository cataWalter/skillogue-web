const BIRTH_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type ParsedBirthDate = {
  year: number;
  month: number;
  day: number;
};

const padDatePart = (value: number) => String(value).padStart(2, '0');

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());

  return `${year}-${month}-${day}`;
};

const isValidCalendarDate = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const parseBirthDate = (value: unknown): ParsedBirthDate | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  const match = trimmedValue.match(BIRTH_DATE_PATTERN);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  if (!isValidCalendarDate(year, month, day)) {
    return null;
  }

  return { year, month, day };
};

const shiftDateByYears = (date: Date, years: number) =>
  new Date(date.getFullYear() + years, date.getMonth(), date.getDate());

export const normalizeBirthDate = (value: unknown): string | null => {
  const parsedBirthDate = parseBirthDate(value);

  if (!parsedBirthDate) {
    return null;
  }

  return `${parsedBirthDate.year}-${padDatePart(parsedBirthDate.month)}-${padDatePart(parsedBirthDate.day)}`;
};

export const calculateAgeFromBirthDate = (birthDate: unknown, now = new Date()): number | null => {
  const parsedBirthDate = parseBirthDate(birthDate);

  if (!parsedBirthDate) {
    return null;
  }

  let age = now.getFullYear() - parsedBirthDate.year;
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const hasHadBirthdayThisYear =
    currentMonth > parsedBirthDate.month ||
    (currentMonth === parsedBirthDate.month && currentDay >= parsedBirthDate.day);

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

export const calculateProfileAge = (
  profile: { birth_date?: unknown; age?: unknown } | null | undefined,
  now = new Date()
): number | null => {
  if (!profile) {
    return null;
  }

  const derivedAge = calculateAgeFromBirthDate(profile.birth_date, now);

  if (derivedAge !== null) {
    return derivedAge;
  }

  const legacyAge = typeof profile.age === 'number' ? profile.age : Number(profile.age);

  return Number.isFinite(legacyAge) ? legacyAge : null;
};

export const isBirthDateWithinAgeRange = (
  birthDate: unknown,
  { minimumAge = 18, maximumAge = 120 }: { minimumAge?: number; maximumAge?: number } = {},
  now = new Date()
) => {
  const age = calculateAgeFromBirthDate(birthDate, now);

  return age !== null && age >= minimumAge && age <= maximumAge;
};

export const getBirthDateRange = (minimumAge = 18, maximumAge = 120, now = new Date()) => ({
  min: formatDateInput(shiftDateByYears(now, -maximumAge)),
  max: formatDateInput(shiftDateByYears(now, -minimumAge)),
});
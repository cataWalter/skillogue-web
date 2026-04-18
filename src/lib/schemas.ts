import { z } from 'zod';
import { normalizeGender } from './gender';
import { isBirthDateWithinAgeRange, normalizeBirthDate } from '@/lib/profile-age';
import staticMasterData from '@/lib/static-master-data';

const EVENT_STATUSES = ['draft', 'published', 'cancelled'] as const;

const staticLocationIds = new Set(staticMasterData.locations.map((location) => location.id));

const supportedTimeZones =
  typeof Intl.supportedValuesOf === 'function'
    ? new Set(Intl.supportedValuesOf('timeZone'))
    : null;

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const coerceNullablePositiveInteger = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    return Number(trimmedValue);
  }

  return value;
}, z.number().int('Capacity must be a whole number').positive('Capacity must be greater than 0').nullable());

const datetimeField = (requiredMessage: string) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Must be a valid datetime')
    .transform((value) => new Date(value).toISOString());

const optionalDatetimeField = z.preprocess(
  (value) => normalizeOptionalString(value),
  z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Must be a valid datetime')
    .transform((value) => new Date(value).toISOString())
    .optional()
);

const locationIdSchema = z
  .string()
  .trim()
  .min(1, 'Location is required')
  .refine((value) => staticLocationIds.has(value), 'Location must be selected from the list');

const optionalLocationIdSchema = z.preprocess(
  (value) => normalizeOptionalString(value),
  z
    .string()
    .trim()
    .refine((value) => staticLocationIds.has(value), 'Location must be selected from the list')
    .optional()
);

const timezoneSchema = z
  .string()
  .trim()
  .min(1, 'Timezone is required')
  .refine(
    (value) => supportedTimeZones === null || supportedTimeZones.has(value),
    'Timezone must be a valid IANA timezone'
  );

const optionalDatetimeRangeSchema = (
  startsAtKey: 'starts_at' | 'starts_from',
  endsAtKey: 'ends_at' | 'starts_to'
) =>
  (value: Record<string, unknown>, ctx: z.RefinementCtx) => {
    const startsAt = typeof value[startsAtKey] === 'string' ? value[startsAtKey] : undefined;
    const endsAt = typeof value[endsAtKey] === 'string' ? value[endsAtKey] : undefined;

    if (!startsAt || !endsAt) {
      return;
    }

    if (Date.parse(endsAt) < Date.parse(startsAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [endsAtKey],
        message:
          endsAtKey === 'ends_at'
            ? 'End date/time must be on or after the start date/time'
            : 'End date/time filter must be on or after the start date/time filter',
      });
    }
  };

export const eventStatusSchema = z.enum(EVENT_STATUSES);

const genderSchema = z
  .string()
  .trim()
  .min(1, 'Gender is required')
  .transform((value, ctx) => {
    const normalizedGender = normalizeGender(value);

    if (!normalizedGender) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Gender must be Male or Female',
      });
      return z.NEVER;
    }

    return normalizedGender;
  });

export const profileSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  about_me: z.string().trim().max(2000).optional().default(''),
  birth_date: z
    .string()
    .trim()
    .min(1, 'Birth date is required')
    .refine((value) => normalizeBirthDate(value) !== null, 'Birth date must be a valid date')
    .refine((value) => isBirthDateWithinAgeRange(value), 'You must be between 18 and 120 years old')
    .transform((value) => normalizeBirthDate(value) as string),
  gender: genderSchema,
  location: z.object({
    city: z.string().trim().nullable().optional(),
    region: z.string().trim().nullable().optional(),
    country: z.string().trim().nullable().optional(),
  }),
  languages: z.array(z.string().trim()).max(5, 'Please select no more than 5 languages.').default([]),
  passions: z.array(z.string().trim()).max(10, 'Please select no more than 10 passions.').default([]),
});

export const createEventSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(255, 'Title must be 255 characters or fewer'),
    description: z.string().trim().max(4000, 'Description must be 4000 characters or fewer').default(''),
    location_id: locationIdSchema,
    starts_at: datetimeField('Start date/time is required'),
    ends_at: optionalDatetimeField,
    timezone: timezoneSchema,
    capacity: coerceNullablePositiveInteger,
    status: eventStatusSchema.default('draft'),
  })
  .superRefine(optionalDatetimeRangeSchema('starts_at', 'ends_at'));

export const updateEventSchema = createEventSchema.extend({
  id: z.string().trim().min(1, 'Event is required'),
});

export const eventSearchSchema = z
  .object({
    query: z.string().trim().max(255, 'Search query must be 255 characters or fewer').default(''),
    location_id: optionalLocationIdSchema,
    starts_from: z.preprocess((value) => normalizeOptionalString(value), optionalDatetimeField),
    starts_to: z.preprocess((value) => normalizeOptionalString(value), optionalDatetimeField),
    page: z.coerce.number().int('Page must be a whole number').min(1, 'Page must be at least 1').default(1),
    page_size: z.coerce
      .number()
      .int('Page size must be a whole number')
      .min(1, 'Page size must be at least 1')
      .max(50, 'Page size must be 50 or fewer')
      .default(12),
  })
  .superRefine(optionalDatetimeRangeSchema('starts_from', 'starts_to'));

export const eventIdSchema = z.object({
  event_id: z.string().trim().min(1, 'Event is required'),
});

export const setEventRsvpSchema = eventIdSchema;
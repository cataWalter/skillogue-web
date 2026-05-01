import { z } from 'zod';
import { normalizeGender } from './gender';
import { isBirthDateWithinAgeRange, normalizeBirthDate } from '@/lib/profile-age';

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

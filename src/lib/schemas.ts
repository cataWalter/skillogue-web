import { z } from 'zod';

export const profileSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  about_me: z.string().trim().max(2000).optional().default(''),
  age: z.number().int().min(18).nullable(),
  gender: z.string().trim().min(1, 'Gender is required'),
  location: z.object({
    city: z.string().trim().nullable().optional(),
    region: z.string().trim().nullable().optional(),
    country: z.string().trim().nullable().optional(),
  }),
  languages: z.array(z.string().trim()).default([]),
  passions: z.array(z.string().trim()).default([]),
});
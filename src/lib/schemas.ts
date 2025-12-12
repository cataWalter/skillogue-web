import { z } from 'zod';

export const profileSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters").max(50).nullable().optional(),
  last_name: z.string().min(2, "Last name must be at least 2 characters").max(50).nullable().optional(),
  about_me: z.string().max(500, "About me cannot exceed 500 characters").nullable().optional(),
  age: z.number().min(13, "You must be at least 13 years old").max(120).nullable().optional(),
  gender: z.string().nullable().optional(),
  location: z.object({
    city: z.string().nullable().optional(),
    region: z.string().nullable().optional(),
    country: z.string().min(1, "Country is required").nullable().optional(),
  }).nullable().optional(),
  is_private: z.boolean().optional(),
  show_age: z.boolean().optional(),
  show_location: z.boolean().optional(),
});

export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(1000),
  receiver_id: z.string().uuid(),
});

export const reportSchema = z.object({
  reported_user_id: z.string().uuid(),
  reason: z.string().min(10, "Please provide a detailed reason (min 10 chars)"),
});

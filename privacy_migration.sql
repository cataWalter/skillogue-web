ALTER TABLE public.profiles
ADD COLUMN is_private boolean DEFAULT false,
ADD COLUMN show_age boolean DEFAULT true,
ADD COLUMN show_location boolean DEFAULT true;

--
-- TBL: profiles
--
-- This table will store public user profile information.
--
CREATE TABLE IF NOT EXISTS public.profiles (
                                               id uuid PRIMARY KEY NOT NULL,
                                               first_name text,
                                               last_name text,
                                               about_me text,
                                               created_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Set up the foreign key relationship to the auth.users table
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id)
    REFERENCES auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE
    );
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- TBL: passions
--
-- This table stores the master list of all available passions.
--
CREATE TABLE IF NOT EXISTS public.passions (
                                               id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
                                               name text UNIQUE NOT NULL
);
ALTER TABLE public.passions ENABLE ROW LEVEL SECURITY;

--
-- TBL: user_passions
--
-- This join table links users from the 'profiles' table to their
-- selected passions from the 'passions' table.
--
CREATE TABLE IF NOT EXISTS public.user_passions (
                                                    user_id uuid NOT NULL,
                                                    passion_id bigint NOT NULL,
                                                    PRIMARY KEY (user_id, passion_id),
    CONSTRAINT user_passions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT user_passions_passion_id_fkey FOREIGN KEY (passion_id) REFERENCES public.passions(id) ON DELETE CASCADE
    );
ALTER TABLE public.user_passions ENABLE ROW LEVEL SECURITY;

--
-- TBL: messages
--
-- This table stores individual chat messages between two users.
--
CREATE TABLE IF NOT EXISTS public.messages (
                                               id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
                                               sender_id uuid NOT NULL,
                                               receiver_id uuid NOT NULL,
                                               content text NOT NULL,
                                               created_at timestamp with time zone DEFAULT now() NOT NULL,

    CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE
    );
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;


-- =============================================
-- TRIGGERS & AUTOMATIONS
-- =============================================

--
-- FUNC: create_profile_on_signup
--
-- This function runs automatically when a new user signs up and
-- inserts a corresponding row into the public.profiles table.
--
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
INSERT INTO public.profiles (id)
VALUES (NEW.id);
RETURN NEW;
END;
$$;

--
-- TRIGGER: on_auth_user_created
--
-- This trigger calls the function above whenever a new row is inserted
-- into the auth.users table.
--
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_profile_on_signup();


-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

--
-- RLS: profiles
--
-- 1. Allow any user to view any profile.
-- 2. Allow a user to update ONLY their own profile.
--
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

--
-- RLS: passions
--
-- Allow any user to view the list of passions.
--
CREATE POLICY "Allow public read access to passions" ON public.passions FOR SELECT USING (true);

--
-- RLS: user_passions
--
-- 1. Allow any user to view which passions other users have.
-- 2. Allow users to insert/delete passions ONLY for themselves.
--
CREATE POLICY "Allow public read access to user_passions" ON public.user_passions FOR SELECT USING (true);
CREATE POLICY "Allow users to manage their own passions" ON public.user_passions FOR ALL USING (auth.uid() = user_id);

--
-- RLS: messages
--
-- 1. Allow users to view messages they have sent or received.
-- 2. Allow users to insert messages where they are the sender.
--
CREATE POLICY "Allow users to read their own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Allow users to send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);


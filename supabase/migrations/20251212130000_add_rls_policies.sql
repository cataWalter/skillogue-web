-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_passions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Messages
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages as sender"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Blocks
CREATE POLICY "Users can view their own blocks"
ON public.blocks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blocks"
ON public.blocks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blocks"
ON public.blocks FOR DELETE
USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Saved Searches
CREATE POLICY "Users can manage their own saved searches"
ON public.saved_searches FOR ALL
USING (auth.uid() = user_id);

-- Profile Languages
CREATE POLICY "Profile languages are viewable by everyone"
ON public.profile_languages FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own profile languages"
ON public.profile_languages FOR ALL
USING (auth.uid() = profile_id);

-- Profile Passions
CREATE POLICY "Profile passions are viewable by everyone"
ON public.profile_passions FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own profile passions"
ON public.profile_passions FOR ALL
USING (auth.uid() = profile_id);

-- Reference Data (Read Only for users)
CREATE POLICY "Languages are viewable by everyone"
ON public.languages FOR SELECT
USING (true);

CREATE POLICY "Passions are viewable by everyone"
ON public.passions FOR SELECT
USING (true);

CREATE POLICY "Locations are viewable by everyone"
ON public.locations FOR SELECT
USING (true);

-- Reports
CREATE POLICY "Users can insert reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Note: Reports are usually viewed by admins only.

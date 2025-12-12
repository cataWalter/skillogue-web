-- Add indexes for foreign keys to improve performance

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_location_id ON public.profiles(location_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
-- Composite index for conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);

-- Blocks
CREATE INDEX IF NOT EXISTS idx_blocks_user_id ON public.blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_user_id ON public.blocks(blocked_user_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON public.notifications(actor_id);

-- Saved Searches
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches(user_id);

-- Profile Languages
CREATE INDEX IF NOT EXISTS idx_profile_languages_profile_id ON public.profile_languages(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_languages_language_id ON public.profile_languages(language_id);

-- Profile Passions
CREATE INDEX IF NOT EXISTS idx_profile_passions_profile_id ON public.profile_passions(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_passions_passion_id ON public.profile_passions(passion_id);

-- Reports
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON public.reports(reported_user_id);

-- Locations
-- Index on country, region, city for search/filtering
CREATE INDEX IF NOT EXISTS idx_locations_country_region_city ON public.locations(country, region, city);

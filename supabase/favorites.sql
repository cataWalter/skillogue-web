-- Create saved_profiles table
CREATE TABLE IF NOT EXISTS saved_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    saved_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, saved_user_id)
);

-- RLS Policies
ALTER TABLE saved_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their saved profiles" ON saved_profiles;
CREATE POLICY "Users can view their saved profiles"
    ON saved_profiles FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save profiles" ON saved_profiles;
CREATE POLICY "Users can save profiles"
    ON saved_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave profiles" ON saved_profiles;
CREATE POLICY "Users can unsave profiles"
    ON saved_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- RPC to save a profile
CREATE OR REPLACE FUNCTION save_profile(target_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO saved_profiles (user_id, saved_user_id)
    VALUES (auth.uid(), target_id)
    ON CONFLICT (user_id, saved_user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to unsave a profile
CREATE OR REPLACE FUNCTION unsave_profile(target_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM saved_profiles
    WHERE user_id = auth.uid() AND saved_user_id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to check if saved
CREATE OR REPLACE FUNCTION is_saved(target_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM saved_profiles
        WHERE user_id = auth.uid() AND saved_user_id = target_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to get saved profiles
CREATE OR REPLACE FUNCTION get_saved_profiles()
RETURNS TABLE (
    id uuid,
    first_name text,
    last_name text,
    about_me text,
    location text,
    age int,
    gender text,
    profile_languages text[],
    created_at timestamptz,
    profilepassions text[],
    is_private boolean,
    show_age boolean,
    show_location boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.about_me,
        (l.city || ', ' || l.country) as location,
        p.age,
        p.gender,
        ARRAY_AGG(DISTINCT lang.name) FILTER (WHERE lang.name IS NOT NULL) as profile_languages,
        p.created_at,
        ARRAY_AGG(DISTINCT pass.name) FILTER (WHERE pass.name IS NOT NULL) as profilepassions,
        p.is_private,
        p.show_age,
        p.show_location
    FROM profiles p
    JOIN saved_profiles sp ON p.id = sp.saved_user_id
    LEFT JOIN locations l ON p.location_id = l.id
    LEFT JOIN profile_languages pl ON p.id = pl.profile_id
    LEFT JOIN languages lang ON pl.language_id = lang.id
    LEFT JOIN profile_passions pp ON p.id = pp.profile_id
    LEFT JOIN passions pass ON pp.passion_id = pass.id
    WHERE sp.user_id = auth.uid()
    GROUP BY p.id, l.city, l.country, sp.created_at
    ORDER BY sp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- RLS Policies
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view who they blocked" ON blocked_users;
CREATE POLICY "Users can view who they blocked"
    ON blocked_users FOR SELECT
    USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
CREATE POLICY "Users can block others"
    ON blocked_users FOR INSERT
    WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock others" ON blocked_users;
CREATE POLICY "Users can unblock others"
    ON blocked_users FOR DELETE
    USING (auth.uid() = blocker_id);

-- RPC to block a user
CREATE OR REPLACE FUNCTION block_user(target_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO blocked_users (blocker_id, blocked_id)
    VALUES (auth.uid(), target_id)
    ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to unblock a user
CREATE OR REPLACE FUNCTION unblock_user(target_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM blocked_users
    WHERE blocker_id = auth.uid() AND blocked_id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to check if blocked (useful for UI)
CREATE OR REPLACE FUNCTION is_blocked(target_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM blocked_users
        WHERE blocker_id = auth.uid() AND blocked_id = target_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to get blocked users
CREATE OR REPLACE FUNCTION get_blocked_users()
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.first_name, p.last_name
    FROM profiles p
    JOIN blocked_users b ON p.id = b.blocked_id
    WHERE b.blocker_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated search_profiles to exclude blocked users
CREATE OR REPLACE FUNCTION search_profiles(
    p_query text DEFAULT null,
    p_location text DEFAULT null,
    p_min_age int DEFAULT null,
    p_max_age int DEFAULT null,
    p_language text DEFAULT null,
    p_gender text DEFAULT null,
    p_passion_ids bigint[] DEFAULT null,
    p_limit int DEFAULT 10,
    p_offset int DEFAULT 0,
    p_current_user_id uuid DEFAULT null
)
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
    LEFT JOIN locations l ON p.location_id = l.id
    LEFT JOIN profile_languages pl ON p.id = pl.profile_id
    LEFT JOIN languages lang ON pl.language_id = lang.id
    LEFT JOIN profile_passions pp ON p.id = pp.profile_id
    LEFT JOIN passions pass ON pp.passion_id = pass.id
    WHERE
        (p_current_user_id IS NULL OR p.id != p_current_user_id) -- Exclude self
        AND (p_query IS NULL OR (
            p.first_name ILIKE '%' || p_query || '%' OR
            p.last_name ILIKE '%' || p_query || '%' OR
            p.about_me ILIKE '%' || p_query || '%'
        ))
        AND (p_location IS NULL OR (
            l.city ILIKE '%' || p_location || '%' OR
            l.country ILIKE '%' || p_location || '%'
        ))
        AND (p_min_age IS NULL OR p.age >= p_min_age)
        AND (p_max_age IS NULL OR p.age <= p_max_age)
        AND (p_gender IS NULL OR p.gender = p_gender)
        AND (p_language IS NULL OR EXISTS (
            SELECT 1 FROM profile_languages pl2
            JOIN languages l2 ON pl2.language_id = l2.id
            WHERE pl2.profile_id = p.id AND l2.name ILIKE p_language
        ))
        AND (p_passion_ids IS NULL OR EXISTS (
            SELECT 1 FROM profile_passions pp2
            WHERE pp2.profile_id = p.id AND pp2.passion_id = ANY(p_passion_ids)
        ))
        -- Exclude blocked users (both directions)
        AND NOT EXISTS (
            SELECT 1 FROM blocked_users b 
            WHERE (b.blocker_id = p_current_user_id AND b.blocked_id = p.id)
               OR (b.blocker_id = p.id AND b.blocked_id = p_current_user_id)
        )
    GROUP BY p.id, l.city, l.country
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated get_conversations to exclude blocked users
CREATE OR REPLACE FUNCTION get_conversations(current_user_id uuid)
RETURNS TABLE (
    user_id uuid,
    full_name text,
    last_message text,
    unread bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH last_msgs AS (
        SELECT DISTINCT ON (
            CASE WHEN sender_id = current_user_id THEN receiver_id ELSE sender_id END
        )
            id,
            CASE WHEN sender_id = current_user_id THEN receiver_id ELSE sender_id END AS other_user_id,
            content,
            created_at,
            sender_id,
            is_read
        FROM messages
        WHERE sender_id = current_user_id OR receiver_id = current_user_id
        ORDER BY 
            CASE WHEN sender_id = current_user_id THEN receiver_id ELSE sender_id END,
            created_at DESC
    ),
    unread_counts AS (
        SELECT
            sender_id,
            COUNT(*) as count
        FROM messages
        WHERE receiver_id = current_user_id AND is_read = false
        GROUP BY sender_id
    )
    SELECT
        p.id as user_id,
        (p.first_name || ' ' || COALESCE(p.last_name, '')) as full_name,
        lm.content as last_message,
        COALESCE(uc.count, 0) as unread
    FROM last_msgs lm
    JOIN profiles p ON p.id = lm.other_user_id
    LEFT JOIN unread_counts uc ON uc.sender_id = p.id
    WHERE NOT EXISTS (
        SELECT 1 FROM blocked_users b 
        WHERE (b.blocker_id = current_user_id AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = current_user_id)
    )
    ORDER BY lm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

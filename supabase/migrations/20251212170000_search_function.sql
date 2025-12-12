-- Function to search profiles with filters
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
    GROUP BY p.id, l.city, l.country
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

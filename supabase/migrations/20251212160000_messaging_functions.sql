-- Function to get conversations for a user
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
    ORDER BY lm.created_at DESC;
END;
$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(sender_id_param uuid, receiver_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE messages
    SET is_read = true
    WHERE sender_id = sender_id_param AND receiver_id = receiver_id_param AND is_read = false;
END;
$$;

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Policies for verification_requests
CREATE POLICY "Users can insert their own verification requests"
    ON public.verification_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own verification requests"
    ON public.verification_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification requests"
    ON public.verification_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update verification requests"
    ON public.verification_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create delete_user_account RPC function
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    requesting_user_id uuid;
BEGIN
    -- Get the ID of the user executing the function
    requesting_user_id := auth.uid();

    -- Ensure a user is logged in
    IF requesting_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Delete related data (explicitly to ensure cleanup)
    DELETE FROM public.messages WHERE sender_id = requesting_user_id OR receiver_id = requesting_user_id;
    DELETE FROM public.profile_passions WHERE profile_id = requesting_user_id;
    DELETE FROM public.profile_languages WHERE profile_id = requesting_user_id;
    DELETE FROM public.blocks WHERE user_id = requesting_user_id OR blocked_user_id = requesting_user_id;
    DELETE FROM public.reports WHERE reporter_id = requesting_user_id OR reported_user_id = requesting_user_id;
    DELETE FROM public.saved_searches WHERE user_id = requesting_user_id;
    DELETE FROM public.notifications WHERE user_id = requesting_user_id OR actor_id = requesting_user_id;
    DELETE FROM public.verification_requests WHERE user_id = requesting_user_id;
    
    -- Delete profile
    DELETE FROM public.profiles WHERE id = requesting_user_id;

    -- Delete user from auth.users
    DELETE FROM auth.users WHERE id = requesting_user_id;
END;
$$;

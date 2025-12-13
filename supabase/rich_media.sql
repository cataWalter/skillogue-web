-- Add columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Storage bucket (requires storage schema to be enabled)
-- Note: Creating buckets via SQL might require specific permissions or extensions.
-- If this fails, the user might need to create the bucket manually in Supabase Dashboard.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies
-- Note: These policies assume storage.objects table exists and RLS is enabled.
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

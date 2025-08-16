// supabase/functions/send-message-broadcast/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts'; // This line will now work!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { receiver_id, message } = await req.json();
    if (!receiver_id || !message) {
      throw new Error("Missing receiver_id or message payload");
    }

    const channelName = `private-messages-for-${receiver_id}`;
    const channel = supabaseClient.channel(channelName);

    const status = await channel.send({
      type: 'broadcast',
      event: 'new-message',
      payload: { message },
    });

    if (status !== 'ok') {
        throw new Error(`Failed to broadcast message: ${status}`);
    }

    return new Response(JSON.stringify({ success: true, status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
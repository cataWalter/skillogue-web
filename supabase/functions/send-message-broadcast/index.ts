import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message_id, sender_id, recipient_id, message_text } = await req
      .json();

    if (!message_id || !sender_id || !recipient_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get sender profile for display
    const { data: senderProfile } = await supabaseClient
      .from("users")
      .select("id, username, avatar_seed")
      .eq("id", sender_id)
      .single();

    // Broadcast message to recipient via Realtime
    await supabaseClient
      .channel(`messages:user:${recipient_id}`)
      .send("broadcast", {
        event: "new_message",
        payload: {
          message_id,
          sender_id,
          sender_username: senderProfile?.username || "Unknown",
          sender_avatar: senderProfile?.avatar_seed || "",
          text: message_text,
          created_at: new Date().toISOString(),
        },
      });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Broadcast error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

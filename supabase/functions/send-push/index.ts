import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      recipient_id,
      title,
      message,
      notification_type,
      related_id,
    } = await req.json();

    if (!recipient_id || !title || !message) {
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

    // Get user's push subscriptions
    const { data: subscriptions } = await supabaseClient
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", recipient_id)
      .eq("active", true);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active subscriptions found" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT");

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
      console.error("Missing VAPID keys");
      return new Response(
        JSON.stringify({ error: "Push service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: notification_type,
      data: {
        notification_type,
        related_id,
        url: getNotificationUrl(notification_type, related_id),
      },
    });

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendPushNotification(
          sub.subscription as PushSubscription,
          payload,
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY,
          VAPID_SUBJECT
        )
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function sendPushNotification(
  subscription: PushSubscription,
  payload: string,
  publicKey: string,
  privateKey: string,
  subject: string
): Promise<Response> {
  // Future VAPID implementation: publicKey, privateKey, and subject will be used
  // for signing the VAPID Authorization header
  void publicKey;
  void privateKey;
  void subject;

  // For production Web Push with VAPID signing, use:
  // import { sendNotification } from "https://deno.land/x/webpush/mod.ts";

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      // VAPID Authorization header would be signed with privateKey
      // Format: "vapid t=<JWT>,k=<base64_publicKey>"
    },
    body: payload,
  });

  return response;
}

function getNotificationUrl(
  notificationType: string,
  relatedId: string
): string {
  const baseUrl = Deno.env.get("PUBLIC_URL") || "https://skillogue.app";

  switch (notificationType) {
    case "message":
      return `${baseUrl}/messages`;
    case "favorite":
      return `${baseUrl}/favorites`;
    case "match":
      return `${baseUrl}/dashboard`;
    case "profile_visit":
      return `${baseUrl}/profile/${relatedId}`;
    default:
      return baseUrl;
  }
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 500 })
  }

  const { record } = await req.json()
  
  // Only send for new messages
  if (!record) {
      return new Response(JSON.stringify({ message: 'No record' }), { status: 200 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Get receiver email
  const { data: receiver, error: userError } = await supabase.auth.admin.getUserById(record.receiver_id)
  if (userError || !receiver) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
  }

  // Send email via Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Skillogue <notifications@skillogue.com>',
      to: receiver.user.email,
      subject: 'New Message on Skillogue',
      html: `
        <div style="font-family: sans-serif; color: #333;">
            <h2>You have a new message!</h2>
            <p>Someone sent you a message on Skillogue.</p>
            <a href="https://skillogue.com/messages" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Message</a>
        </div>
      `
    })
  })

  const data = await res.json()

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  })
})

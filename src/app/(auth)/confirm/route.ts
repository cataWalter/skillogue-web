// src/app/api/auth/confirm/route.ts

import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  // If the user is signing up, send them to the onboarding page after confirmation.
  // Otherwise, send them to their profile page or the homepage.
  const next = type === 'signup' ? '/onboarding' : '/profile';

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = createClient()

    // Verify the OTP (one-time password) from the email link
    const { error, data } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    // If verification is successful and we have user data
    if (!error && data.user) {
        // Now, update the public.profiles table to mark the user as verified.
        // This is crucial for the "Verified" badge on their profile.
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ verified: true })
            .eq('id', data.user.id)

        if (updateError) {
            // If updating our public table fails, log it and redirect to an error page
            console.error("Error updating profile verified status:", updateError.message)
            redirectTo.pathname = '/error' // A generic error page
            return NextResponse.redirect(redirectTo)
        }

      // On success, redirect the user to the next step (onboarding or their profile)
      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
  }

  // If the token is missing or invalid, redirect to a specific error page
  // so the user knows what went wrong.
  redirectTo.pathname = '/auth/auth-code-error'
  return NextResponse.redirect(redirectTo)
}
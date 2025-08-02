// src/app/api/auth/confirm/route.ts

import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = createClient()

    const { error, data } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error && data.user) {
        // Verification was successful, now update the public profiles table
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ verified: true })
            .eq('id', data.user.id)

        if (updateError) {
            // Handle error updating profile
            console.error("Error updating profile:", updateError.message)
            redirectTo.pathname = '/error' // Redirect to an error page
            return NextResponse.redirect(redirectTo)
        }

      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
  }

  // return the user to an error page if the verification fails
  redirectTo.pathname = '/auth/auth-code-error'
  return NextResponse.redirect(redirectTo)
}
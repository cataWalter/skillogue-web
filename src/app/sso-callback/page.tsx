'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

/**
 * Clerk SSO callback page.
 * After a successful OAuth redirect, Clerk returns here to complete authentication.
 */
export default function SSOCallbackPage() {
  return <AuthenticateWithRedirectCallback />;
}

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * OAuth callback is now handled by Clerk.
 * This stub exists for backward-compatibility with any redirects pointing at this URL.
 */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}

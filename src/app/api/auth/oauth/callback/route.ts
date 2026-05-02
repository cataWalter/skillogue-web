import { NextRequest, NextResponse } from 'next/server';
import {
    buildAppUrl,
    createAppwriteAdminAccount,
    createAppwriteAdminDatabases,
    getAppwriteErrorMessage,
    setAppwriteSessionCookie,
} from '@/lib/appwrite/server';
import { getAppwriteCollectionId, getAppwriteDatabaseId } from '@/lib/appwrite/config';

export const runtime = 'nodejs';

/**
 * GET /api/auth/oauth/callback
 *
 * Appwrite redirects here after a successful OAuth2 token exchange with the
 * identity provider.  Query params: ?userId=<id>&secret=<token>
 *
 * We create a permanent session from the token, set the session cookie, then
 * redirect the user to the dashboard.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId')?.trim();
    const secret = searchParams.get('secret')?.trim();

    if (!userId || !secret) {
        return NextResponse.redirect(
            new URL('/login?error=oauth', request.url),
        );
    }

    try {
        const userAgent = request.headers.get('user-agent') ?? undefined;
        const account = createAppwriteAdminAccount(userAgent);

        // Exchange the OAuth token for a persistent session.
        const session = await account.createSession({ userId, secret });

        const response = NextResponse.redirect(buildAppUrl('/dashboard'));
        setAppwriteSessionCookie(response, session.secret, session.expire);

        // Update last_login (best-effort, non-blocking).
        try {
            const databases = createAppwriteAdminDatabases(userAgent);
            await databases.updateDocument(
                getAppwriteDatabaseId(),
                getAppwriteCollectionId('profiles'),
                userId,
                { last_login: new Date().toISOString() },
            );
        } catch {
            // Non-critical; do not fail OAuth sign-in if profile update fails.
        }

        return response;
    } catch (error) {
        const message = encodeURIComponent(getAppwriteErrorMessage(error, 'OAuth sign-in failed.'));
        return NextResponse.redirect(new URL(`/login?error=oauth&message=${message}`, request.url));
    }
}

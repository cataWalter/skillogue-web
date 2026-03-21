import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserFromRequest } from '@/lib/server/current-user';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    const payload = (await request.json()) as {
      userId?: string;
      endpoint?: string;
      p256dh?: string;
      auth?: string;
      keys?: { p256dh?: string; auth?: string };
    };
    const resolvedUserId = typeof payload.userId === 'string' ? payload.userId : currentUser?.id;
    const endpoint = typeof payload.endpoint === 'string' ? payload.endpoint : undefined;
    const p256dh = typeof payload.p256dh === 'string' ? payload.p256dh : payload.keys?.p256dh;
    const auth = typeof payload.auth === 'string' ? payload.auth : payload.keys?.auth;

    if (!resolvedUserId || !endpoint) {
      return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 });
    }
    
    await db.insert(pushSubscriptions).values({
      userId: resolvedUserId,
      endpoint,
      p256dh,
      auth,
    }).onConflictDoNothing();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Failed to save push subscription' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUserFromRequest(request as NextRequest);
    const payload = (await request.json().catch(() => ({}))) as { userId?: string; endpoint?: string };
    const userId = typeof payload.userId === 'string' ? payload.userId : currentUser?.id;
    const endpoint = typeof payload.endpoint === 'string' ? payload.endpoint : undefined;

    if (typeof userId !== 'string') {
      return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 });
    }

    if (endpoint) {
      await db.delete(pushSubscriptions).where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );
    } else {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json({ error: 'Failed to remove push subscription' }, { status: 500 });
  }
}
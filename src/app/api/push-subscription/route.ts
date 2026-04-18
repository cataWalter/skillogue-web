import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/server/current-user';
import { AppDataService } from '@/lib/server/app-data-service';

export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
    process.env.NEXT_PUBLIC_VAPID_KEY ??
    process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json({ error: 'Missing VAPID public key' }, { status: 500 });
  }

  return NextResponse.json({ publicKey });
}

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

    const service = new AppDataService();
    await service.savePushSubscription({
      userId: resolvedUserId,
      endpoint,
      p256dh,
      auth,
    });
    
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

    const service = new AppDataService();
    await service.deletePushSubscription(userId, endpoint);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json({ error: 'Failed to remove push subscription' }, { status: 500 });
  }
}
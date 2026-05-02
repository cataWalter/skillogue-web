import { NextRequest, NextResponse } from 'next/server';
import { getAppwriteSessionSecret } from '@/lib/appwrite/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function GET(request: NextRequest) {
  const sessionSecret = getAppwriteSessionSecret(request);
  if (!sessionSecret) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  try {
    const service = new AppDataService(
      sessionSecret,
      request.headers.get('user-agent') ?? undefined
    );
    const data = await service.listNotifications();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

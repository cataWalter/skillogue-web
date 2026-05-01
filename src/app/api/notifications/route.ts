import { NextRequest, NextResponse } from 'next/server';
import { getAppwriteSessionSecret } from '@/lib/appwrite/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function GET(request: NextRequest) {
  try {
    const service = new AppDataService(
      getAppwriteSessionSecret(request),
      request.headers.get('user-agent') ?? undefined
    );
    const data = await service.listNotifications();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

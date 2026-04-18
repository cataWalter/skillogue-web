import { NextRequest, NextResponse } from 'next/server';
import { getAppwriteSessionSecret } from '@/lib/appwrite/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function PATCH(request: NextRequest) {
  try {
    const service = new AppDataService(
      getAppwriteSessionSecret(request),
      request.headers.get('user-agent') ?? undefined
    );
    await service.markAllNotificationsRead();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getAppwriteSessionSecret } from '@/lib/appwrite/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = new AppDataService(
      getAppwriteSessionSecret(request),
      request.headers.get('user-agent') ?? undefined
    );
    await service.markNotificationRead(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
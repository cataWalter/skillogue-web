import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function PATCH() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  try {
    const service = new AppDataService(userId);
    await service.markAllNotificationsRead();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

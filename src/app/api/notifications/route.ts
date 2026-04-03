import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';

export async function GET() {
  try {
    // In a real implementation, you would get the user ID from the session
    const data = await db.select().from(notifications).orderBy(notifications.createdAt);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
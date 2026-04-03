import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analyticsEvents } from '@/lib/db/schema';

export async function POST(request: Request) {
  try {
    const { eventName, properties, path } = await request.json();
    
    await db.insert(analyticsEvents).values({
      eventName,
      properties: properties || {},
      path,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking analytics:', error);
    return NextResponse.json({ error: 'Failed to track analytics' }, { status: 500 });
  }
}
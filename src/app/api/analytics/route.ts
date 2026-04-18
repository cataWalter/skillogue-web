import { NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function POST(request: Request) {
  try {
    const { eventName, properties, path } = await request.json();
    const service = new AppDataService();

    await service.trackAnalyticsEvent({
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
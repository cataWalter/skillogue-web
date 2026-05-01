import { NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

function isAnalyticsProperties(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  try {
    let payload: {
      eventName?: unknown;
      properties?: unknown;
      path?: unknown;
    };

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid analytics payload.' }, { status: 400 });
    }

    const { eventName, properties, path } = payload;

    if (
      typeof eventName !== 'string' ||
      !eventName.trim() ||
      typeof path !== 'string' ||
      !path.trim()
    ) {
      return NextResponse.json({ error: 'Invalid analytics payload.' }, { status: 400 });
    }

    const service = new AppDataService();

    await service.trackAnalyticsEvent({
      eventName: eventName.trim(),
      properties: isAnalyticsProperties(properties) ? properties : {},
      path: path.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking analytics:', error);
    return NextResponse.json({ error: 'Failed to track analytics' }, { status: 500 });
  }
}

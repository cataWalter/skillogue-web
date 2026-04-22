import { NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

type AnalyticsPayload = {
  eventName: string;
  properties?: Record<string, unknown>;
  path?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function parseAnalyticsPayload(request: Request): Promise<
  | { ok: true; payload: AnalyticsPayload }
  | { ok: false; response: ReturnType<typeof NextResponse.json> }
> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return {
      ok: false,
      response: NextResponse.json({ success: true, ignored: true }, { status: 202 }),
    };
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  if (!isRecord(parsedBody) || typeof parsedBody.eventName !== 'string' || !parsedBody.eventName.trim()) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'eventName is required' }, { status: 400 }),
    };
  }

  return {
    ok: true,
    payload: {
      eventName: parsedBody.eventName.trim(),
      properties: isRecord(parsedBody.properties) ? parsedBody.properties : {},
      path: typeof parsedBody.path === 'string' ? parsedBody.path : undefined,
    },
  };
}

export async function POST(request: Request) {
  const payloadResult = await parseAnalyticsPayload(request);

  if (payloadResult.ok === false) {
    return payloadResult.response;
  }

  try {
    const service = new AppDataService();

    await service.trackAnalyticsEvent({
      eventName: payloadResult.payload.eventName,
      properties: payloadResult.payload.properties,
      path: payloadResult.payload.path,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking analytics:', error);
    return NextResponse.json({ error: 'Failed to track analytics' }, { status: 500 });
  }
}
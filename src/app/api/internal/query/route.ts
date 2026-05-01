import { NextRequest, NextResponse } from 'next/server';
import { getAppwriteSessionSecret } from '@/lib/appwrite/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const service = new AppDataService(
      getAppwriteSessionSecret(request),
      request.headers.get('user-agent') ?? undefined
    );
    const result = await service.executeCompatQuery(payload.query, payload.params);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

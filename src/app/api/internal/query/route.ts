import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const payload = await request.json();
    const service = new AppDataService(userId);
    const result = await service.executeCompatQuery(payload.query, payload.params);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { userId } = await auth();
    const payload = await request.json();
    const { collection } = await params;
    const service = new AppDataService(userId);
    const result = payload.action
      ? await service.executeCollectionOperation(collection, payload)
      : await service.executeCompatRpc(payload.name ?? collection, payload.args ?? payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { data: null, error: { message: error instanceof Error ? error.message : 'Internal server error' } },
      { status: 500 }
    );
  }
}

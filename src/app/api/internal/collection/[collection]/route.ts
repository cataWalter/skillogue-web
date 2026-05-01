import { NextRequest, NextResponse } from 'next/server';
import { getAppwriteSessionSecret } from '@/lib/appwrite/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const payload = await request.json();
    const { collection } = await params;
    const service = new AppDataService(
      getAppwriteSessionSecret(request),
      request.headers.get('user-agent') ?? undefined
    );
    const result = await service.executeCollectionOperation(collection, payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}

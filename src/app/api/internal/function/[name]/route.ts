import { NextRequest, NextResponse } from 'next/server';
import { invokeCompatFunction } from '@/lib/server/app-data';
import { getCurrentUserFromRequest } from '@/lib/server/current-user';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const payload = (await request.json()) as { body?: Record<string, unknown> };
  const currentUser = await getCurrentUserFromRequest(request);
  const result = await invokeCompatFunction(name, payload.body ?? {}, currentUser);

  return NextResponse.json(result);
}
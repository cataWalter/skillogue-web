import { NextRequest, NextResponse } from 'next/server';
import { executeCompatRpc } from '@/lib/server/app-data';
import { getCurrentUserFromRequest } from '@/lib/server/current-user';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { name?: string; args?: Record<string, unknown> };
  const currentUser = await getCurrentUserFromRequest(request);
  const result = await executeCompatRpc(payload.name ?? '', payload.args ?? {}, currentUser);

  return NextResponse.json(result);
}
import { NextRequest, NextResponse } from 'next/server';
import { executeCompatQuery } from '@/lib/server/app-data';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const result = await executeCompatQuery(payload);

  return NextResponse.json(result);
}
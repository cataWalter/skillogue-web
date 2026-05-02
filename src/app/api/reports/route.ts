import { NextRequest, NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';
import { getCurrentUserFromRequest } from '@/lib/server/current-user';
import { checkRateLimit } from '@/lib/rate-limit';

/** Rate limit: 5 reports per minute per IP. */
const REPORT_RATE_LIMIT = { limit: 5, windowMs: 60_000 } as const;

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, REPORT_RATE_LIMIT);
  if (limited) return limited;

  try {
    const currentUser = await getCurrentUserFromRequest(request);

    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { reportedId, reason } = await request.json();
    const service = new AppDataService();

    await service.createReport({
      reporterId: currentUser.id,
      reportedId,
      reason,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}

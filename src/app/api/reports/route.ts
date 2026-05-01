import { NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function POST(request: Request) {
  try {
    const { reporterId, reportedId, reason } = await request.json();
    const service = new AppDataService();

    await service.createReport({
      reporterId,
      reportedId,
      reason,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}

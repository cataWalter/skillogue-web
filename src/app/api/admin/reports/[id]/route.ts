import { NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json();
    const { id } = await params;
    const service = new AppDataService();
    await service.updateReportStatus(id, status);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';
import { requireAdminRequest } from '@/lib/server/admin-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminRequest(request);

    if ('response' in admin) {
      return admin.response;
    }

    const { status } = await request.json();
    const { id } = await params;
    const service = new AppDataService(undefined, admin.userAgent);
    await service.updateReportStatus(id, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

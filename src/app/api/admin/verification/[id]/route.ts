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

    const { status, userId } = await request.json();
    const { id } = await params;
    const service = new AppDataService(undefined, admin.userAgent);
    await service.updateVerificationRequest(id, status, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating verification request:', error);
    return NextResponse.json({ error: 'Failed to update verification request' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status, userId } = await request.json();
    const { id } = await params;
    const service = new AppDataService();
    await service.updateVerificationRequest(id, status, userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating verification request:', error);
    return NextResponse.json({ error: 'Failed to update verification request' }, { status: 500 });
  }
}
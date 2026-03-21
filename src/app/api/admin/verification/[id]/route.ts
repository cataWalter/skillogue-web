import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verificationRequests, profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status, userId } = await request.json();
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    
    // Update verification request status
    await db.update(verificationRequests).set({ status }).where(eq(verificationRequests.id, id));
    
    // If approved, update profile verified status
    if (status === 'approved' && userId) {
      await db.update(profiles).set({ verified: true }).where(eq(profiles.id, userId));
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating verification request:', error);
    return NextResponse.json({ error: 'Failed to update verification request' }, { status: 500 });
  }
}
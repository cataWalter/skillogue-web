import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verificationRequests } from '@/lib/db/schema';

export async function GET() {
  try {
    const data = await db.select().from(verificationRequests).orderBy(verificationRequests.createdAt);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    return NextResponse.json({ error: 'Failed to fetch verification requests' }, { status: 500 });
  }
}
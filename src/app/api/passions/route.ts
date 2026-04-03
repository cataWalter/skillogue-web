import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { passions } from '@/lib/db/schema';

export async function GET() {
  try {
    const data = await db.select().from(passions).orderBy(passions.name);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching passions:', error);
    return NextResponse.json({ error: 'Failed to fetch passions' }, { status: 500 });
  }
}
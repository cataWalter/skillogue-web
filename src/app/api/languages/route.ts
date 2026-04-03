import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { languages } from '@/lib/db/schema';

export async function GET() {
  try {
    const data = await db.select().from(languages).orderBy(languages.name);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json({ error: 'Failed to fetch languages' }, { status: 500 });
  }
}
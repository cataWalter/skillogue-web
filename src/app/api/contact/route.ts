import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactRequests } from '@/lib/db/schema';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message, category } = await request.json();
    
    await db.insert(contactRequests).values({
      name,
      email,
      subject,
      message,
      status: 'pending',
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving contact request:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
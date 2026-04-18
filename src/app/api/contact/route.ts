import { NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message, category } = await request.json();
    const service = new AppDataService();

    await service.createContactRequest({
      name,
      email,
      subject,
      message,
      category,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving contact request:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
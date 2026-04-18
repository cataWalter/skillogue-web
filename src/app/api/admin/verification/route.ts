import { NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function GET() {
  try {
    const service = new AppDataService();
    const data = await service.listVerificationRequests();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    return NextResponse.json({ error: 'Failed to fetch verification requests' }, { status: 500 });
  }
}
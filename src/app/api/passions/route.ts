import { NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function GET() {
  try {
    const service = new AppDataService();
    const data = await service.listPassions();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching passions:', error);
    return NextResponse.json({ error: 'Failed to fetch passions' }, { status: 500 });
  }
}
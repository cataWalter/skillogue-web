import { NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function GET() {
  try {
    const service = new AppDataService();
    const data = await service.listLanguages();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json({ error: 'Failed to fetch languages' }, { status: 500 });
  }
}

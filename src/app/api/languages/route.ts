import { NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function GET() {
  try {
    const service = new AppDataService();
    const response = await service.executeCollectionOperation('languages', {
      action: 'select',
      order: { column: 'name', ascending: true },
      select: 'id, name',
    });
    const data = (response.data as any[]) ?? [];
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json({ error: 'Failed to fetch languages' }, { status: 500 });
  }
}
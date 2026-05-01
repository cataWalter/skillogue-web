import { NextRequest, NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function GET(_request: NextRequest) {
  const service = new AppDataService();
  const locations = await service.listLocations();

  return NextResponse.json(locations);
}

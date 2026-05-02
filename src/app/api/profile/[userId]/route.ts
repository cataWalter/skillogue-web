import { NextRequest, NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';
import { getCurrentUserFromRequest } from '@/lib/server/current-user';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const service = new AppDataService();

    const profile = await service.getProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const currentUser = await getCurrentUserFromRequest(request);

    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    if (currentUser.id !== userId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const data = await request.json();
    const service = new AppDataService();

    const updatedProfile = await service.saveProfile(userId, data);

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

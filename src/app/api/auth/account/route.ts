import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function POST(request: NextRequest) {
  return handleDeleteAccount(request);
}

export async function DELETE(request: NextRequest) {
  return handleDeleteAccount(request);
}

async function handleDeleteAccount(_request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
  }

  try {
    const service = new AppDataService(userId);
    await service.deleteProfile(userId);

    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete account.' },
      { status: 500 }
    );
  }
}

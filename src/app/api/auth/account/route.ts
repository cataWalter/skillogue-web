import { NextRequest, NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';
import {
  clearAppwriteSessionCookie,
  createAppwriteAdminUsers,
  createAppwriteSessionAccount,
  getAppwriteErrorMessage,
  getAppwriteErrorStatus,
  getAppwriteSessionSecret,
} from '@/lib/appwrite/server';

export const runtime = 'nodejs';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(request: NextRequest) {
  const sessionSecret = getAppwriteSessionSecret(request);

  if (!sessionSecret) {
    return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
  }

  const userAgent = request.headers.get('user-agent') ?? undefined;

  try {
    const account = createAppwriteSessionAccount(sessionSecret, userAgent);
    const currentUser = await account.get();

    if (UUID_PATTERN.test(currentUser.$id)) {
      const service = new AppDataService(sessionSecret);
      await service.deleteDocument('profiles', currentUser.$id);
    }

    const users = createAppwriteAdminUsers(userAgent);
    await users.delete(currentUser.$id);

    const response = NextResponse.json({ success: true });
    clearAppwriteSessionCookie(response);

    return response;
  } catch (error) {
    const status = getAppwriteErrorStatus(error, 500);
    const response = NextResponse.json(
      { message: getAppwriteErrorMessage(error, 'Failed to delete account.') },
      { status }
    );

    if (status === 401) {
      clearAppwriteSessionCookie(response);
    }

    return response;
  }
}
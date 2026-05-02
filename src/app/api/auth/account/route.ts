import { NextRequest, NextResponse } from 'next/server';
import {
  clearAppwriteSessionCookie,
  createAppwriteAdminUsers,
  createAppwriteSessionAccount,
  getAppwriteErrorMessage,
  getAppwriteErrorStatus,
  getAppwriteSessionSecret,
} from '@/lib/appwrite/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function POST(request: NextRequest) {
  try {
    const sessionSecret = getAppwriteSessionSecret(request);
    if (!sessionSecret) {
      return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
    }
    const userAgent = request.headers.get('user-agent') ?? undefined;
    const account = createAppwriteSessionAccount(sessionSecret, userAgent);
    const currentUser = await account.get();

    if (currentUser.$id) {
      const service = new AppDataService(sessionSecret, userAgent);
      await service.deleteProfile(currentUser.$id);
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
    clearAppwriteSessionCookie(response);
    return response;
  }
}

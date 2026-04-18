'use server';

import { cookies } from 'next/headers';
import { getAppwriteSessionCookieName } from '@/lib/appwrite/config';
import { AppDataService } from '@/lib/server/app-data-service';

const getSessionSecret = async () => {
  const cookieStore = await cookies();
  return cookieStore.get(getAppwriteSessionCookieName())?.value;
};

export async function getUserData() {
  const sessionSecret = await getSessionSecret();

  if (!sessionSecret) {
    throw new Error('Not authenticated');
  }

  const service = new AppDataService(sessionSecret);
  return service.exportCurrentUserData();
}

export async function exportUserData() {
  try {
    const data = await getUserData();
    const json = JSON.stringify(data, null, 2);

    return {
      success: true,
      data: json,
    };
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: 'Failed to export data',
    };
  }
}
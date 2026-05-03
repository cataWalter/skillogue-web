'use server';

import { auth } from '@clerk/nextjs/server';
import { AppDataService } from '@/lib/server/app-data-service';

export async function getUserData() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Not authenticated');
  }

  const service = new AppDataService(userId);
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

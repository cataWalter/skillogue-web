import { AppDataService } from './app-data-service';

/**
 * Migration shim for app-data.ts
 * This file now delegates to AppDataService which uses Appwrite.
 * In a full migration, you would update all callers to use AppDataService directly.
 */

export const getAppData = (sessionSecret?: string) => {
  const service = new AppDataService(sessionSecret);
  
  return {
    profiles: {
      get: (id: string) => service.getProfile(id),
      save: (id: string, data: any) => service.saveProfile(id, data),
    },
    passions: {
      list: () => service.listPassions(),
    },
    locations: {
      list: () => service.listLocations(),
    },
    messages: {
      list: (userId: string) => service.getMessages(userId),
      send: (senderId: string, receiverId: string, content: string) => service.sendMessage(senderId, receiverId, content),
    },
    favorites: {
      list: (userId: string) => service.getFavorites(userId),
      toggle: (userId: string, favoriteId: string) => service.toggleFavorite(userId, favoriteId),
    }
  };
};

// Legacy Export Compatibility
export { AppDataService };

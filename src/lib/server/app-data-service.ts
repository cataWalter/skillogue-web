import { AppwriteRepository } from './appwrite-repo';
import { Query } from 'node-appwrite';

/**
 * AppDataService abstracts the data layer, providing standard methods
 * that previously came from Drizzle/Postgres but now use Appwrite.
 */
export class AppDataService {
  private repo: AppwriteRepository;

  constructor(sessionSecret?: string) {
    this.repo = new AppwriteRepository(sessionSecret);
  }

  // --- Profiles ---
  async getProfile(userId: string) {
    try {
      const profile = await this.repo.getDocument<any>('profiles', userId);
      return profile;
    } catch (error: any) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  async saveProfile(userId: string, data: any) {
    const existing = await this.getProfile(userId);
    if (existing) {
      return await this.repo.updateDocument('profiles', userId, data);
    } else {
      return await this.repo.createDocument('profiles', data, userId);
    }
  }

  // --- Passions ---
  async listPassions() {
    const result = await this.repo.listDocuments('passions', [Query.limit(100)]);
    return result.documents;
  }

  // --- Locations ---
  async listLocations() {
    const result = await this.repo.listDocuments('locations', [Query.limit(1000)]);
    return result.documents;
  }

  // --- Messages ---
  async getMessages(userId: string) {
    return await this.repo.listDocuments('messages', [
      Query.or([
        Query.equal('senderId', userId),
        Query.equal('receiverId', userId)
      ]),
      Query.orderDesc('$createdAt')
    ]);
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    return await this.repo.createDocument('messages', {
      senderId,
      receiverId,
      content,
      read: false
    });
  }

  // --- Favorites ---
  async getFavorites(userId: string) {
    return await this.repo.listDocuments('favorites', [
      Query.equal('userId', userId)
    ]);
  }

  async toggleFavorite(userId: string, favoriteId: string) {
    const existing = await this.repo.listDocuments('favorites', [
      Query.equal('userId', userId),
      Query.equal('favoriteId', favoriteId)
    ]);

    if (existing.total > 0) {
      await this.repo.deleteDocument('favorites', existing.documents[0].$id);
      return { favorited: false };
    } else {
      await this.repo.createDocument('favorites', { userId, favoriteId });
      return { favorited: true };
    }
  }

  // --- Generic Helpers (for migration) ---
  async listDocuments(collectionId: string, queries: string[] = []) {
    return await this.repo.listDocuments(collectionId, queries);
  }

  async deleteDocument(collectionId: string, documentId: string) {
    return await this.repo.deleteDocument(collectionId, documentId);
  }
}

import {
  createAppwriteAdminDatabases,
  createAppwriteSessionDatabases,
} from '@/lib/appwrite/server';
import { getAppwriteDatabaseId } from '@/lib/appwrite/config';
import { ID, Query } from 'node-appwrite';

/**
 * Repository for Appwrite Database operations.
 * This provides a high-level API for interacting with Appwrite collections.
 */
export class AppwriteRepository {
  private databases;
  private databaseId: string;

  constructor(sessionSecret?: string) {
    this.databases = sessionSecret 
      ? createAppwriteSessionDatabases(sessionSecret)
      : createAppwriteAdminDatabases();
    this.databaseId = getAppwriteDatabaseId();
  }

  async listDocuments<T>(collectionId: string, queries: string[] = []) {
    return await this.databases.listDocuments<T>(
      this.databaseId,
      collectionId,
      queries
    );
  }

  async getDocument<T>(collectionId: string, documentId: string) {
    return await this.databases.getDocument<T>(
      this.databaseId,
      collectionId,
      documentId
    );
  }

  async createDocument<T>(collectionId: string, data: any, documentId: string = ID.unique()) {
    return await this.databases.createDocument<T>(
      this.databaseId,
      collectionId,
      documentId,
      data
    );
  }

  async updateDocument<T>(collectionId: string, documentId: string, data: any) {
    return await this.databases.updateDocument<T>(
      this.databaseId,
      collectionId,
      documentId,
      data
    );
  }

  async deleteDocument(collectionId: string, documentId: string) {
    return await this.databases.deleteDocument(
      this.databaseId,
      collectionId,
      documentId
    );
  }

  async listCollections() {
    return await this.databases.listCollections(this.databaseId);
  }
}

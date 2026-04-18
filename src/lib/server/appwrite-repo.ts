import {
  createAppwriteAdminDatabases,
  createAppwriteSessionDatabases,
} from '@/lib/appwrite/server';
import { getAppwriteDatabaseId } from '@/lib/appwrite/config';
import { Databases, ID, Models } from 'node-appwrite';

/**
 * Repository for Appwrite Database operations.
 * This provides a high-level API for interacting with Appwrite collections.
 */
export class AppwriteRepository {
  private databases: Databases;
  private databaseId: string;

  constructor(sessionSecret?: string, userAgent?: string) {
    this.databases = sessionSecret 
      ? createAppwriteSessionDatabases(sessionSecret, userAgent)
      : createAppwriteAdminDatabases(userAgent);
    this.databaseId = getAppwriteDatabaseId();
  }

  async listDocuments<T extends Models.Document>(collectionId: string, queries: string[] = []) {
    return await this.databases.listDocuments<T>(
      this.databaseId,
      collectionId,
      queries
    );
  }

  async getDocument<T extends Models.Document>(collectionId: string, documentId: string) {
    return await this.databases.getDocument<T>(
      this.databaseId,
      collectionId,
      documentId
    );
  }

  async createDocument<T extends Models.Document>(collectionId: string, data: any, documentId: string = ID.unique()) {
    return await this.databases.createDocument<T>(
      this.databaseId,
      collectionId,
      documentId,
      data
    );
  }

  async createDocuments<T extends Models.Document>(collectionId: string, documents: object[]) {
    return await this.databases.createDocuments<T>(
      this.databaseId,
      collectionId,
      documents
    );
  }

  async updateDocument<T extends Models.Document>(collectionId: string, documentId: string, data: any) {
    return await this.databases.updateDocument<T>(
      this.databaseId,
      collectionId,
      documentId,
      data
    );
  }

  async updateDocuments<T extends Models.Document>(collectionId: string, data: any, queries: string[] = []) {
    return await this.databases.updateDocuments<T>(
      this.databaseId,
      collectionId,
      data,
      queries
    );
  }

  async deleteDocument(collectionId: string, documentId: string) {
    return await this.databases.deleteDocument(
      this.databaseId,
      collectionId,
      documentId
    );
  }

  async deleteDocuments<T extends Models.Document>(collectionId: string, queries: string[] = []) {
    return await this.databases.deleteDocuments<T>(
      this.databaseId,
      collectionId,
      queries
    );
  }

  async listCollections() {
    return await this.databases.listCollections(this.databaseId);
  }
}

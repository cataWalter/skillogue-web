import { Client, Databases } from 'appwrite';
import {
  getAppwriteEndpoint,
  getAppwriteProjectId,
} from '@/lib/appwrite/config';

const createBaseClient = () => {
  return new Client()
    .setEndpoint(getAppwriteEndpoint())
    .setProject(getAppwriteProjectId());
};

export const createClientDatabases = () => {
  return new Databases(createBaseClient());
};

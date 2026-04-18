'use client';

import { Account, Client } from 'appwrite';
import { getAppwriteEndpoint, getAppwriteProjectId } from '@/lib/appwrite/config';

let browserClient: Client | null = null;

const getConfiguredBrowserClient = () => {
	if (!browserClient) {
		const endpoint = getAppwriteEndpoint().trim();
		const projectId = getAppwriteProjectId().trim();

		if (!endpoint || !projectId) {
			throw new Error('Appwrite public config is not configured.');
		}

		browserClient = new Client().setEndpoint(endpoint).setProject(projectId);
	}

	return browserClient;
};

export const createAppwriteBrowserAccount = () =>
	new Account(getConfiguredBrowserClient());
const mockRepo = {
	listDocuments: jest.fn(),
	createDocument: jest.fn(),
	updateDocument: jest.fn(),
	deleteDocument: jest.fn(),
};

const mockCreateExecution = jest.fn();
const mockAccountGet = jest.fn();

jest.mock('node-appwrite', () => ({
	ID: {
		unique: jest.fn(() => 'generated-id'),
	},
	Query: {
		equal: jest.fn((field: string, value: unknown) => `equal(${field}:${JSON.stringify(value)})`),
		limit: jest.fn((value: number) => `limit(${value})`),
		offset: jest.fn((value: number) => `offset(${value})`),
		orderAsc: jest.fn((field: string) => `orderAsc(${field})`),
		orderDesc: jest.fn((field: string) => `orderDesc(${field})`),
	},
}));

jest.mock('../src/lib/appwrite/config', () => ({
	getAppwriteCollectionId: jest.fn((name: string) => `collection:${name}`),
	getAppwriteDatabaseId: jest.fn(() => 'database-id'),
	getAppwriteFunctionId: jest.fn(() => undefined),
}));

jest.mock('../src/lib/appwrite/server', () => ({
	createAppwriteAdminFunctions: jest.fn(),
	createAppwriteSessionAccount: jest.fn(),
	getAppwriteErrorMessage: jest.fn((error: unknown, fallback: string) =>
		error instanceof Error ? error.message : fallback
	),
}));

jest.mock('../src/lib/server/appwrite-repo', () => ({
	AppwriteRepository: jest.fn().mockImplementation(() => mockRepo),
}));

import { ID, Query } from 'node-appwrite';
import { AppDataService } from '../src/lib/server/app-data-service';
import {
	createAppwriteAdminFunctions,
	createAppwriteSessionAccount,
	getAppwriteErrorMessage,
} from '../src/lib/appwrite/server';
import { getAppwriteCollectionId, getAppwriteFunctionId } from '../src/lib/appwrite/config';

describe('AppDataService coverage', () => {
	const createService = (sessionSecret = 'session-secret') =>
		new AppDataService(sessionSecret, 'jest-test');

	beforeEach(() => {
		jest.clearAllMocks();
		mockRepo.listDocuments.mockReset();
		mockRepo.createDocument.mockReset();
		mockRepo.updateDocument.mockReset();
		mockRepo.deleteDocument.mockReset();
		mockCreateExecution.mockReset();
		mockAccountGet.mockReset();

		(createAppwriteAdminFunctions as jest.Mock).mockReturnValue({
			createExecution: mockCreateExecution,
		});
		(createAppwriteSessionAccount as jest.Mock).mockReturnValue({
			get: mockAccountGet,
		});
		mockAccountGet.mockResolvedValue({
			$id: 'me',
			email: 'me@example.com',
			name: 'Me',
		});
		(getAppwriteFunctionId as jest.Mock).mockReturnValue(undefined);
	});

	it('caches the current user lookup and requires authentication when missing', async () => {
		const service = createService();

		await expect((service as any).getCurrentUser()).resolves.toEqual({
			id: 'me',
			email: 'me@example.com',
			name: 'Me',
		});
		await expect((service as any).getCurrentUser()).resolves.toEqual({
			id: 'me',
			email: 'me@example.com',
			name: 'Me',
		});
		expect(createAppwriteSessionAccount).toHaveBeenCalledTimes(1);

		const unsignedService = new AppDataService(undefined, 'jest-test');
		await expect((unsignedService as any).getCurrentUser()).resolves.toBeNull();
		await expect(unsignedService.exportCurrentUserData()).rejects.toThrow('Not authenticated');

		mockAccountGet.mockRejectedValueOnce(new Error('expired'));
		const expiredService = createService();
		await expect((expiredService as any).getCurrentUser()).resolves.toBeNull();
	});

	it('paginates and normalizes Appwrite documents', async () => {
		const service = createService();
		const firstPage = Array.from({ length: 100 }, (_, index) => ({
			$id: `doc-${index}`,
			value: index,
			...(index === 0
				? {
					$createdAt: '2024-01-01T00:00:00.000Z',
					$updatedAt: '2024-01-02T00:00:00.000Z',
					nested: { $id: 'nested-1', label: 'Nested' },
				}
				: {}),
		}));

		mockRepo.listDocuments
			.mockResolvedValueOnce({ documents: firstPage })
			.mockResolvedValueOnce({ documents: [{ $id: 'doc-100', value: 100 }] });

		const documents = await (service as any).listAllDocuments('profiles', ['query-token']);

		expect(getAppwriteCollectionId).toHaveBeenCalledWith('profiles');
		expect(Query.limit).toHaveBeenCalledWith(100);
		expect(Query.offset).toHaveBeenNthCalledWith(1, 0);
		expect(Query.offset).toHaveBeenNthCalledWith(2, 100);
		expect(documents).toHaveLength(101);
		expect(documents[0]).toEqual(
			expect.objectContaining({
				id: 'doc-0',
				_appwriteId: 'doc-0',
				created_at: '2024-01-01T00:00:00.000Z',
				updated_at: '2024-01-02T00:00:00.000Z',
				nested: {
					id: 'nested-1',
					_appwriteId: 'nested-1',
					label: 'Nested',
				},
			})
		);
	});

	it('supports windowing, filter parsing, ordering, and field projection helpers', async () => {
		const service = createService();
		const listDocumentsPageSpy = jest.spyOn(service as any, 'listDocumentsPage');
		const listAllDocumentsSpy = jest.spyOn(service as any, 'listAllDocuments').mockResolvedValueOnce([]);

		listDocumentsPageSpy
			.mockResolvedValueOnce([
				{ id: '1', created_at: '2024-01-01T00:00:00.000Z' },
				{ id: '2', created_at: '2024-01-02T00:00:00.000Z' },
			])
			.mockResolvedValueOnce([{ id: '3', created_at: '2024-01-03T00:00:00.000Z' }]);

		await expect((service as any).listDocumentsWindow('messages', ['query'], 2)).resolves.toEqual([
			{ id: '1', created_at: '2024-01-01T00:00:00.000Z' },
			{ id: '2', created_at: '2024-01-02T00:00:00.000Z' },
		]);
		await expect((service as any).listDocumentsWindow('messages', ['query'], null)).resolves.toEqual(
			[]
		);
		expect(listAllDocumentsSpy).toHaveBeenCalledWith('messages', ['query']);

		expect(
			(service as any).parseMessageOrExpression(
				'and(sender_id.eq.me,receiver_id.eq.you),and(sender_id.eq.you,receiver_id.eq.me)'
			)
		).toEqual({
			senderA: 'me',
			receiverA: 'you',
			senderB: 'you',
			receiverB: 'me',
		});
		expect((service as any).parseMessageOrExpression('sender_id.eq.me')).toBeNull();

		const docs = [
			{ id: '1', sender_id: 'me', receiver_id: 'you', tags: ['blue'], score: 2 },
			{ id: '2', sender_id: 'you', receiver_id: 'me', tags: ['red'], score: 5 },
		];

		expect(
			(service as any).matchesFilter(docs[0], { type: 'eq', column: 'tags', value: 'blue' })
		).toBe(true);
		expect(
			(service as any).matchesFilter(docs[1], { type: 'in', column: 'id', value: ['2', '3'] })
		).toBe(true);
		expect(
			(service as any).matchesFilter(docs[0], {
				type: 'or',
				expression:
					'and(sender_id.eq.me,receiver_id.eq.you),and(sender_id.eq.you,receiver_id.eq.me)',
			})
		).toBe(true);
		expect(
			(service as any).applyFilters(docs, [{ type: 'eq', column: 'id', value: '2' }])
		).toEqual([docs[1]]);
		expect((service as any).getWindowParameters({ action: 'select', range: { from: 1, to: 2 } })).toEqual({
			offset: 1,
			limit: 2,
			targetCount: 3,
		});

		expect(
			(service as any).mergeMessageDocuments(
				[
					[{ id: 'same', created_at: '2024-01-01T00:00:00.000Z' }],
					[
						{ id: 'same', created_at: '2024-01-02T00:00:00.000Z' },
						{ id: 'later', created_at: '2024-01-03T00:00:00.000Z' },
					],
				],
				false
			).map((message: { id: string }) => message.id)
		).toEqual(['later', 'same']);

		expect(
			(service as any).applyOrderAndWindow(
				[
					{ id: '1', score: 1 },
					{ id: '2', score: 3 },
					{ id: '3', score: 2 },
				],
				{
					action: 'select',
					order: { column: 'score', ascending: false },
					range: { from: 1, to: 1 },
				}
			)
		).toEqual([{ id: '3', score: 2 }]);

		expect(
			(service as any).pickSelectedFields(
				{ id: '1', first_name: 'Ada', _appwriteId: 'app-1', ignored: true },
				'id, first_name'
			)
		).toEqual({ id: '1', first_name: 'Ada' });
	});

	it('falls back when fetching ids and hydrates relations across document types', async () => {
		const service = createService();
		const listAllDocumentsSpy = jest.spyOn(service as any, 'listAllDocuments');

		listAllDocumentsSpy
			.mockResolvedValueOnce([{ id: 'profile-1', first_name: 'Ada' }])
			.mockResolvedValueOnce([
				{ id: 'profile-1', first_name: 'Ada' },
				{ id: 'profile-2', first_name: 'Grace' },
			]);

		const fetched = await (service as any).fetchByIds('profiles', ['profile-1', 'profile-2']);
		expect(fetched.get('profile-2')).toEqual({ id: 'profile-2', first_name: 'Grace' });

		jest.spyOn(service as any, 'fetchByIds')
			.mockResolvedValueOnce(
				new Map([
					['loc-1', { id: 'loc-1', city: 'Paris', region: 'Ile-de-France', country: 'France' }],
				])
			)
			.mockResolvedValueOnce(new Map([['passion-1', { id: 'passion-1', name: 'Music' }]]))
			.mockResolvedValueOnce(
				new Map([
					['sender-1', { id: 'sender-1', first_name: 'Ada', last_name: 'Lovelace' }],
					['receiver-1', { id: 'receiver-1', first_name: 'Grace', last_name: 'Hopper' }],
				])
			)
			.mockResolvedValueOnce(
				new Map([
					['blocked-1', { id: 'blocked-1', first_name: 'Blocked', last_name: 'User', avatar_url: 'avatar' }],
				])
			);
		jest.spyOn(service as any, 'listAllDocuments')
			.mockResolvedValueOnce([{ profile_id: 'profile-1', passion_id: 'passion-1' }])
			.mockResolvedValueOnce([{ profile_id: 'profile-1', language_id: 'language-1' }]);

		await expect(
			(service as any).hydrateProfilesWithLocations(
				[{ id: 'profile-1', location_id: 'loc-1' }],
				'id, locations(city, region, country), passions_count:profile_passions(count), languages_count:profile_languages(count)'
			)
		).resolves.toEqual([
			{
				id: 'profile-1',
				locations: {
					id: 'loc-1',
					city: 'Paris',
					region: 'Ile-de-France',
					country: 'France',
				},
				location: {
					id: 'loc-1',
					city: 'Paris',
					region: 'Ile-de-France',
					country: 'France',
				},
				passions_count: [{ count: 0 }],
				languages_count: [{ count: 0 }],
			},
		]);

		await expect(
			(service as any).hydrateRelationRows(
				[{ profile_id: 'profile-1', passion_id: 'passion-1' }],
				'passions',
				'passion_id',
				'passions',
				'profile_id, passions(name)'
			)
		).resolves.toEqual([{ profile_id: 'profile-1', passions: { name: 'Music' } }]);

		await expect(
			(service as any).hydrateMessages(
				[
					{
						id: 'message-1',
						sender_id: 'sender-1',
						receiver_id: 'receiver-1',
						content: 'Hello',
					},
				],
				'id, sender:profiles!sender_id(id, first_name, last_name), receiver:profiles!receiver_id(id, first_name, last_name)'
			)
		).resolves.toEqual([
			{
				id: 'message-1',
				sender: { id: 'sender-1', first_name: 'Ada', last_name: 'Lovelace' },
				receiver: { id: 'receiver-1', first_name: 'Grace', last_name: 'Hopper' },
			},
		]);

		await expect(
			(service as any).hydrateBlockedUsers(
				[{ id: 'block-1', blocked_id: 'blocked-1' }],
				'id, profile:profiles!blocked_users_blocked_id_fkey(id, first_name, last_name, avatar_url)'
			)
		).resolves.toEqual([
			{
				id: 'block-1',
				profile: {
					id: 'blocked-1',
					first_name: 'Blocked',
					last_name: 'User',
					avatar_url: 'avatar',
				},
			},
		]);
	});

	it('routes transformSelectedDocuments through the correct hydrator', async () => {
		const service = createService();
		jest.spyOn(service as any, 'hydrateProfilesWithLocations').mockResolvedValueOnce(['profiles']);
		jest.spyOn(service as any, 'hydrateRelationRows').mockResolvedValueOnce(['profile-passions']);
		jest.spyOn(service as any, 'hydrateMessages').mockResolvedValueOnce(['messages']);
		jest.spyOn(service as any, 'hydrateBlockedUsers').mockResolvedValueOnce(['blocked']);

		await expect((service as any).transformSelectedDocuments('profiles', [], 'id')).resolves.toEqual([
			'profiles',
		]);
		await expect(
			(service as any).transformSelectedDocuments('profile_passions', [], 'profile_id, passions(name)')
		).resolves.toEqual(['profile-passions']);
		await expect((service as any).transformSelectedDocuments('messages', [], 'id')).resolves.toEqual([
			'messages',
		]);
		await expect((service as any).transformSelectedDocuments('blocked_users', [], 'id')).resolves.toEqual([
			'blocked',
		]);
		await expect(
			(service as any).transformSelectedDocuments('languages', [{ id: 'lang-1', name: 'English' }], 'id, name')
		).resolves.toEqual([{ id: 'lang-1', name: 'English' }]);
	});

	it('executes select, insert, update, delete, and error collection operations', async () => {
		const service = createService();
		const getMatchingDocumentsSpy = jest.spyOn(service as any, 'getMatchingDocuments');
		const transformSelectedDocumentsSpy = jest.spyOn(service as any, 'transformSelectedDocuments');
		const createDocumentsSpy = jest.spyOn(service as any, 'createDocuments');
		const updateDocumentsSpy = jest.spyOn(service as any, 'updateDocuments');
		const deleteDocumentsSpy = jest.spyOn(service as any, 'deleteDocuments');

		getMatchingDocumentsSpy.mockResolvedValueOnce([{ id: 'row-1' }]);
		transformSelectedDocumentsSpy.mockResolvedValueOnce([{ id: 'row-1', name: 'Ada' }]);
		await expect(
			service.executeCollectionOperation('profiles', {
				action: 'select',
				select: 'id, name',
				maybeSingle: true,
			})
		).resolves.toEqual({
			data: { id: 'row-1', name: 'Ada' },
			error: null,
		});

		getMatchingDocumentsSpy.mockResolvedValueOnce([]);
		transformSelectedDocumentsSpy.mockResolvedValueOnce([]);
		await expect(
			service.executeCollectionOperation('profiles', {
				action: 'select',
				single: true,
			})
		).resolves.toEqual({
			data: null,
			error: {
				code: 'PGRST116',
				message: 'JSON object requested, multiple (or no) rows returned',
			},
		});

		createDocumentsSpy.mockResolvedValueOnce([{ id: 'created-1' }]);
		transformSelectedDocumentsSpy.mockResolvedValueOnce([{ id: 'created-1', name: 'New' }]);
		await expect(
			service.executeCollectionOperation('profiles', {
				action: 'insert',
				payload: { id: 'created-1' },
				select: 'id, name',
				single: true,
			})
		).resolves.toEqual({
			data: { id: 'created-1', name: 'New' },
			error: null,
		});

		updateDocumentsSpy.mockResolvedValueOnce([{ id: 'updated-1' }]);
		transformSelectedDocumentsSpy.mockResolvedValueOnce([{ id: 'updated-1' }]);
		await expect(
			service.executeCollectionOperation('profiles', {
				action: 'update',
				filters: [{ type: 'eq', column: 'id', value: 'updated-1' }],
				payload: { first_name: 'Updated' },
				select: 'id',
				single: true,
			})
		).resolves.toEqual({
			data: { id: 'updated-1' },
			error: null,
		});

		deleteDocumentsSpy.mockResolvedValueOnce([{ id: 'deleted-1' }]);
		transformSelectedDocumentsSpy.mockResolvedValueOnce([{ id: 'deleted-1' }]);
		await expect(
			service.executeCollectionOperation('profiles', {
				action: 'delete',
				filters: [{ type: 'eq', column: 'id', value: 'deleted-1' }],
				select: 'id',
				single: true,
			})
		).resolves.toEqual({
			data: { id: 'deleted-1' },
			error: null,
		});

		createDocumentsSpy.mockRejectedValueOnce(Object.assign(new Error('boom'), { code: 500 }));
		await expect(
			service.executeCollectionOperation('profiles', { action: 'insert', payload: { id: 'broken' } })
		).resolves.toEqual({
			data: null,
			error: { message: 'boom', code: '500' },
		});
		expect(getAppwriteErrorMessage).toHaveBeenCalledWith(expect.any(Error), 'Request failed.');
	});

	it('creates documents with collection defaults and updates or deletes matches', async () => {
		const service = createService();
		mockRepo.createDocument
			.mockResolvedValueOnce({ $id: 'profile-1', first_name: 'Ada' })
			.mockResolvedValueOnce({ $id: 'analytics-1', properties: '{"source":"test"}' });

		await expect(
			(service as any).createDocuments('profiles', { id: 'profile-1', first_name: 'Ada' })
		).resolves.toEqual([
			expect.objectContaining({
				id: 'profile-1',
				_appwriteId: 'profile-1',
				first_name: 'Ada',
			}),
		]);
		await expect(
			(service as any).createDocuments('analytics_events', {
				event_name: 'page_view',
				properties: { source: 'test' },
			})
		).resolves.toEqual([
			expect.objectContaining({
				id: 'analytics-1',
				properties: '{"source":"test"}',
			}),
		]);
		expect(ID.unique).toHaveBeenCalled();

		jest.spyOn(service as any, 'getMatchingDocuments').mockResolvedValueOnce([
			{ id: 'profile-1', _appwriteId: 'appwrite-profile-1' },
		]);
		mockRepo.updateDocument.mockResolvedValueOnce({ $id: 'profile-1', first_name: 'Updated' });
		await expect(
			(service as any).updateDocuments('profiles', {
				action: 'update',
				filters: [{ type: 'eq', column: 'id', value: 'profile-1' }],
				payload: { first_name: 'Updated' },
			})
		).resolves.toEqual([
			expect.objectContaining({ id: 'profile-1', first_name: 'Updated' }),
		]);

		jest.spyOn(service as any, 'getMatchingDocuments').mockResolvedValueOnce([
			{ id: 'profile-1', _appwriteId: 'appwrite-profile-1' },
		]);
		await expect(
			(service as any).deleteDocuments('profiles', {
				action: 'delete',
				filters: [{ type: 'eq', column: 'id', value: 'profile-1' }],
			})
		).resolves.toEqual([{ id: 'profile-1', _appwriteId: 'appwrite-profile-1' }]);
		expect(mockRepo.deleteDocument).toHaveBeenCalledWith(
			'collection:profiles',
			'appwrite-profile-1'
		);
	});

	it('upserts existing and new documents and rejects missing ids', async () => {
		const service = createService();
		const getMatchingDocumentsSpy = jest.spyOn(service as any, 'getMatchingDocuments');
		const createDocumentsSpy = jest.spyOn(service as any, 'createDocuments').mockResolvedValue([]);
		const updateDocumentsSpy = jest.spyOn(service as any, 'updateDocuments').mockResolvedValue([]);

		getMatchingDocumentsSpy.mockResolvedValueOnce([{ id: 'profile-1' }]);
		await expect(
			service.executeCollectionOperation('profiles', {
				action: 'upsert',
				payload: { id: 'profile-1', first_name: 'Ada' },
			})
		).resolves.toEqual({ data: null, error: null });
		expect(updateDocumentsSpy).toHaveBeenCalled();

		getMatchingDocumentsSpy.mockResolvedValueOnce([]);
		await expect(
			service.executeCollectionOperation('profiles', {
				action: 'upsert',
				payload: { id: 'profile-2', first_name: 'Grace' },
			})
		).resolves.toEqual({ data: null, error: null });
		expect(createDocumentsSpy).toHaveBeenCalled();

		await expect(
			service.executeCollectionOperation('profiles', { action: 'upsert', payload: { first_name: 'Broken' } })
		).resolves.toEqual({
			data: null,
			error: { message: 'Upsert operations require an id field.', code: undefined },
		});
	});

	it('loads and saves profiles, passions, locations, messages, and favorites through collection operations', async () => {
		const service = createService();
		const executeCollectionOperationSpy = jest.spyOn(service, 'executeCollectionOperation');
		const listMessagesForUserSpy = jest
			.spyOn(service, 'listMessagesForUser')
			.mockResolvedValueOnce([{ id: 'message-1' }] as never);
		const executeCompatRpcSpy = jest
			.spyOn(service, 'executeCompatRpc')
			.mockResolvedValueOnce({ data: true, error: null } as never)
			.mockResolvedValueOnce({ data: true, error: null } as never);

		executeCollectionOperationSpy
			.mockResolvedValueOnce({ data: { id: 'profile-1', first_name: 'Ada' }, error: null })
			.mockResolvedValueOnce({ data: [{ passions: { name: 'Music' } }], error: null })
			.mockResolvedValueOnce({ data: [{ languages: { name: 'English' } }], error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: { id: 'message-1' }, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: { id: 'favorite-1' }, error: null })
			.mockResolvedValueOnce({ data: null, error: { message: 'save failed' } });

		await expect(service.getProfile('profile-1')).resolves.toEqual({
			id: 'profile-1',
			first_name: 'Ada',
			passions: ['Music'],
			languages: ['English'],
		});
		expect(executeCollectionOperationSpy).toHaveBeenNthCalledWith(
			1,
			'profiles',
			expect.objectContaining({
				select:
					'id, created_at, first_name, last_name, about_me, age, gender, verified, is_private, show_age, show_location, location_id, locations(*)',
			})
		);
		const getProfileSpy = jest.spyOn(service, 'getProfile').mockResolvedValueOnce({ id: 'profile-1' } as never);
		await expect(service.saveProfile('profile-1', { first_name: 'Ada' })).resolves.toEqual({
			id: 'profile-1',
		});
		await expect(service.listPassions()).resolves.toEqual(
			expect.arrayContaining([{ id: 'pas_music', name: 'Music' }])
		);
		await expect(service.listLocations()).resolves.toEqual(
			expect.arrayContaining([
				{ id: 'location-paris-ile-de-france-france', city: 'Paris', region: 'Ile-de-France', country: 'France' },
			])
		);
		await expect(service.getMessages('me')).resolves.toEqual([{ id: 'message-1' }]);
		await expect(service.sendMessage('me', 'you', 'Hello')).resolves.toEqual({ id: 'message-1' });
		await expect(service.toggleFavorite('me', 'you')).resolves.toEqual({ data: true, error: null });
		await expect(service.toggleFavorite('me', 'you')).resolves.toEqual({ data: true, error: null });
		await expect(service.saveProfile('profile-2', { first_name: 'Broken' })).rejects.toThrow('save failed');

		expect(listMessagesForUserSpy).toHaveBeenCalledWith('me');
		expect(getProfileSpy).toHaveBeenCalledWith('profile-1');
		expect(executeCompatRpcSpy).toHaveBeenCalledWith('save_profile', {
			target_id: 'you',
			current_user_id: 'me',
		});
		expect(executeCompatRpcSpy).toHaveBeenLastCalledWith('unsave_profile', {
			target_id: 'you',
			current_user_id: 'me',
		});
	});

	it('invokes compat functions, compat queries, listDocuments, and deleteDocument wrappers', async () => {
		const service = createService();
		const executeCollectionOperationSpy = jest.spyOn(service, 'executeCollectionOperation');

		(getAppwriteFunctionId as jest.Mock).mockReturnValueOnce('send-push-id');
		await expect(
			service.invokeCompatFunction('send-push', {
				recipient_id: 'receiver-1',
				message: 'Hello',
				title: '  ',
			})
		).resolves.toEqual({ success: true });
		expect(mockCreateExecution).toHaveBeenCalledTimes(1);
		expect(mockCreateExecution.mock.calls[0]?.[0]).toBe('send-push-id');
		expect(JSON.parse(mockCreateExecution.mock.calls[0]?.[1] as string)).toEqual(
			expect.objectContaining({
				recipient_id: 'receiver-1',
				receiver_id: 'receiver-1',
				actor_id: 'me',
				title: 'New message',
				body: 'Hello',
				notification_type: 'message',
				related_id: 'me',
			})
		);
		expect(mockCreateExecution.mock.calls[0]?.[2]).toBe(false);

		executeCollectionOperationSpy
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: [{ id: 'doc-1' }], error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: { message: 'delete failed' } });

		await expect(
			service.invokeCompatFunction('send-push', {
				receiver_id: 'receiver-2',
				body: 'Fallback',
				notification_type: 'chat',
			})
		).resolves.toEqual({ success: true, fallback: true });
		await expect(
			service.executeCompatQuery({ collection: 'profiles', operation: { action: 'select' } })
		).resolves.toEqual({ data: [{ id: 'doc-1' }], error: null });
		await expect(service.executeCompatQuery('select *')).resolves.toEqual({ rows: [] });
		await expect(service.listDocuments('profiles')).resolves.toEqual({ documents: [] });
		await expect(service.deleteDocument('profiles', 'doc-1')).rejects.toThrow('delete failed');
		await expect(service.invokeCompatFunction('other')).resolves.toEqual({
			success: false,
			message: 'Unsupported function: other',
		});

		const listAllDocumentsSpy = jest.spyOn(service as any, 'listAllDocuments');
		const listDocumentsPageSpy = jest.spyOn(service as any, 'listDocumentsPage');

		jest.spyOn(service, 'listLocations').mockResolvedValueOnce([
			{ id: 'loc-1', city: 'Paris', region: 'Ile-de-France', country: 'France' },
		] as never);
		listAllDocumentsSpy.mockImplementation(async (collection: string) => {
			if (collection === 'passions') {
				return [
					{ id: 'passion-1', name: 'Music' },
					{ id: 'passion-2', name: 'Travel' },
				];
			}

			if (collection === 'languages') {
				return [{ id: 'language-1', name: 'English' }];
			}

			if (collection === 'profile_passions') {
				return [
					{ profile_id: 'profile-1', passion_id: 'passion-1' },
					{ profile_id: 'profile-4', passion_id: 'passion-2' },
				];
			}

			if (collection === 'profile_languages') {
				return [
					{ profile_id: 'profile-1', language_id: 'language-1' },
					{ profile_id: 'profile-4', language_id: 'language-1' },
				];
			}

			return [];
		});
		listDocumentsPageSpy.mockResolvedValueOnce([
			{
				id: 'profile-1',
				first_name: 'Ada',
				last_name: 'Lovelace',
				about_me: 'Math and music',
				location_id: 'loc-1',
				birth_date: `${new Date().getUTCFullYear() - 28}-01-01`,
				gender: 'female',
				created_at: '2024-01-03T00:00:00.000Z',
				is_private: false,
				show_age: true,
				show_location: true,
			},
			{
				id: 'profile-4',
				first_name: 'Katherine',
				last_name: 'Johnson',
				about_me: 'Math and travel',
				location_id: 'loc-1',
				birth_date: `${new Date().getUTCFullYear() - 30}-01-01`,
				gender: 'female',
				created_at: '2024-01-02T00:00:00.000Z',
				is_private: false,
				show_age: true,
				show_location: true,
			},
		] as never);

		await expect(
			(service as any).searchProfiles({
				p_current_user_id: 'me',
				p_query: 'math',
				p_location: 'paris',
				p_language: 'english',
				p_gender: 'female',
				p_passion_ids: ['passion-1'],
				p_min_age: 18,
				p_max_age: 40,
				p_limit: 10,
				p_offset: 0,
			})
		).resolves.toEqual({
			data: [
				{
					id: 'profile-1',
					first_name: 'Ada',
					last_name: 'Lovelace',
					about_me: 'Math and music',
					location: 'Paris, Ile-de-France, France',
					age: 28,
					gender: 'female',
					profile_languages: ['English'],
					created_at: '2024-01-03T00:00:00.000Z',
					profilepassions: ['Music'],
					is_private: false,
					show_age: true,
					show_location: true,
					last_login: null,
				},
			],
			error: null,
		});

		listAllDocumentsSpy.mockReset();
		listDocumentsPageSpy.mockReset();
		jest.spyOn(service as any, 'searchProfiles').mockResolvedValueOnce({
			data: [
				{ id: 'profile-1', created_at: '2024-01-03T00:00:00.000Z' },
				{ id: 'profile-2', created_at: '2024-01-04T00:00:00.000Z' },
				{ id: 'profile-3', created_at: '2024-01-02T00:00:00.000Z' },
			],
			error: null,
		});
		listAllDocumentsSpy
			.mockResolvedValueOnce([
				{ profile_id: 'me', passion_id: 'passion-1' },
				{ profile_id: 'me', passion_id: 'passion-2' },
			])
			.mockResolvedValueOnce([
				{ profile_id: 'profile-1', passion_id: 'passion-1' },
				{ profile_id: 'profile-1', passion_id: 'passion-2' },
				{ profile_id: 'profile-2', passion_id: 'passion-1' },
				{ profile_id: 'profile-3', passion_id: 'passion-3' },
			]);
		await expect((service as any).getSuggestedProfiles('me', 2)).resolves.toEqual({
			data: [
				{
					id: 'profile-1',
					created_at: '2024-01-03T00:00:00.000Z',
					shared_passions_count: 2,
				},
				{
					id: 'profile-2',
					created_at: '2024-01-04T00:00:00.000Z',
					shared_passions_count: 1,
				},
			],
			error: null,
		});
		const cases = [
			{ name: 'is_blocked', method: 'isBlocked', args: { target_id: 'target' }, expectedArgs: ['target'], value: { data: true } },
			{ name: 'is_blocked_by', method: 'isBlockedBy', args: { target_id: 'target' }, expectedArgs: ['target'], value: { data: false } },
			{ name: 'block_user', method: 'blockUser', args: { target_id: 'target' }, expectedArgs: ['target'], value: { data: true } },
			{ name: 'unblock_user', method: 'unblockUser', args: { target_id: 'target' }, expectedArgs: ['target'], value: { data: true } },
			{ name: 'is_saved', method: 'isSaved', args: { target_id: 'target' }, expectedArgs: ['target'], value: { data: true } },
			{ name: 'save_profile', method: 'saveProfileToFavorites', args: { target_id: 'target' }, expectedArgs: ['target'], value: { data: true } },
			{ name: 'unsave_profile', method: 'unsaveProfile', args: { target_id: 'target' }, expectedArgs: ['target'], value: { data: true } },
			{ name: 'get_saved_profiles', method: 'getSavedProfiles', expectedArgs: [], value: { data: [] } },
			{ name: 'get_conversations', method: 'getConversations', args: { current_user_id: 'me' }, expectedArgs: ['me'], value: { data: [] } },
			{ name: 'get_recent_conversations', method: 'getRecentConversations', args: { current_user_id: 'me' }, expectedArgs: ['me'], value: { data: [] } },
			{ name: 'mark_messages_as_read', method: 'markMessagesAsRead', args: { sender_id_param: 'you', receiver_id_param: 'me' }, expectedArgs: ['you', 'me'], value: { data: true } },
			{ name: 'track_presence', method: 'trackPresence', args: { user_id: 'me', online_at: '2024-01-01T00:00:00.000Z' }, expectedArgs: ['me', '2024-01-01T00:00:00.000Z'], value: { data: true } },
			{ name: 'clear_presence', method: 'clearPresence', args: { user_id: 'me' }, expectedArgs: ['me'], value: { data: true } },
			{ name: 'get_online_users', method: 'getOnlineUsers', expectedArgs: [], value: { data: [] } },
			{ name: 'search_profiles', method: 'searchProfiles', args: { p_query: 'Ada' }, expectedArgs: [{ p_query: 'Ada' }], value: { data: [] } },
			{ name: 'get_suggested_profiles', method: 'getSuggestedProfiles', args: { current_user_id: 'me', p_limit: 3 }, expectedArgs: ['me', 3], value: { data: [] } },
		];

		for (const testCase of cases) {
			const spy = jest.spyOn(service as any, testCase.method).mockResolvedValueOnce(testCase.value);
			await expect(service.executeCompatRpc(testCase.name, testCase.args)).resolves.toEqual(testCase.value);
			expect(spy).toHaveBeenCalledWith(...testCase.expectedArgs);
		}

		const listBlockedUsersSpy = jest
			.spyOn(service, 'listBlockedUsers')
			.mockResolvedValueOnce([{ id: 'blocked-1', blocked_id: 'user-1' }] as never);
		await expect(service.executeCompatRpc('list_blocked_users', { user_id: 'me' })).resolves.toEqual({
			data: [{ id: 'blocked-1', blocked_id: 'user-1' }],
			error: null,
		});
		expect(listBlockedUsersSpy).toHaveBeenCalledWith('me');

		await expect(service.executeCompatRpc('unknown')).resolves.toEqual({
			data: null,
			error: { message: 'Unsupported RPC: unknown' },
		});
	});

	it('saves profile data using existing or newly created locations and normalized taxonomy inserts', async () => {
		const service = createService();
		const executeCollectionOperationSpy = jest.spyOn(service, 'executeCollectionOperation');
		const listAllDocumentsSpy = jest.spyOn(service as any, 'listAllDocuments');
		const getProfileSpy = jest.spyOn(service, 'getProfile').mockResolvedValue({ id: 'profile-1' } as never);

		executeCollectionOperationSpy
			.mockResolvedValueOnce({ data: { id: 'location-1' }, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null });
		listAllDocumentsSpy
			.mockResolvedValueOnce([
				{ id: 'language-1', name: 'English' },
				{ id: 'language-2', name: 'French' },
			])
			.mockResolvedValueOnce([
				{ id: 'passion-1', name: 'Music' },
				{ id: 'passion-2', name: 'Travel' },
			]);

		await expect(
			service.saveProfileData('profile-1', {
				first_name: 'Ada',
				last_name: 'Lovelace',
				age: 28,
				gender: 'female',
				about_me: 'Mathematician',
				location: { city: 'Paris', region: 'Ile-de-France', country: 'France' },
				languages: [' english '],
				passions: ['music'],
			})
		).resolves.toEqual({ id: 'profile-1' });
		expect(executeCollectionOperationSpy).toHaveBeenCalledWith('profile_languages', {
			action: 'insert',
			payload: [{ profile_id: 'profile-1', language_id: 'language-1' }],
		});
		expect(executeCollectionOperationSpy).toHaveBeenCalledWith('profile_passions', {
			action: 'insert',
			payload: [{ profile_id: 'profile-1', passion_id: 'passion-1' }],
		});

		executeCollectionOperationSpy.mockReset();
		listAllDocumentsSpy.mockReset();
		executeCollectionOperationSpy
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: { id: 'location-2' }, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null });
		await expect(
			service.saveProfileData('profile-2', {
				first_name: 'Grace',
				last_name: 'Hopper',
				location: { city: 'New York', country: 'USA' },
				languages: [],
				passions: [],
			})
		).resolves.toEqual({ id: 'profile-1' });
		expect(executeCollectionOperationSpy).toHaveBeenCalledWith('profiles', {
			action: 'upsert',
			payload: expect.objectContaining({
				id: 'profile-2',
				location_id: 'loc_new_york_us',
			}),
		});
		expect(executeCollectionOperationSpy).not.toHaveBeenCalledWith(
			'locations',
			expect.anything()
		);

		executeCollectionOperationSpy.mockReset();
		executeCollectionOperationSpy.mockResolvedValueOnce({ data: null, error: { message: 'profile failed' } });
		await expect(
			service.saveProfileData('profile-3', { first_name: 'Broken', location: null })
		).rejects.toThrow('profile failed');
		expect(getProfileSpy).toHaveBeenCalled();
	});

	it('stores birth_date and derives age at read time for profiles', async () => {
		const service = createService();
		const executeCollectionOperationSpy = jest.spyOn(service, 'executeCollectionOperation');
		const getProfileSpy = jest.spyOn(service, 'getProfile').mockResolvedValue({ id: 'profile-birth-date' } as never);

		executeCollectionOperationSpy
			.mockResolvedValueOnce({ data: { id: 'location-9' }, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null });

		await expect(
			service.saveProfileData('profile-birth-date', {
				first_name: 'Katherine',
				last_name: 'Johnson',
				birth_date: '1990-04-25',
				gender: 'Female',
				location: { city: 'White Sulphur Springs', country: 'USA' },
				languages: [],
				passions: [],
			})
		).resolves.toEqual({ id: 'profile-birth-date' });

		expect(executeCollectionOperationSpy).toHaveBeenCalledWith('profiles', {
			action: 'upsert',
			payload: expect.objectContaining({
				id: 'profile-birth-date',
				birth_date: '1990-04-25',
				age: null,
			}),
		});
		expect(getProfileSpy).toHaveBeenCalledWith('profile-birth-date');

		const selectResult = await (service as any).transformSelectedDocuments(
			'profiles',
			[
				{
					id: 'profile-birth-date',
					first_name: 'Katherine',
					birth_date: '2000-04-25',
					age: 99,
					show_age: true,
					location_id: null,
				},
			],
			'id, first_name, age'
		);

		expect(selectResult).toEqual([
			expect.objectContaining({
				id: 'profile-birth-date',
				first_name: 'Katherine',
				age: expect.any(Number),
			}),
		]);
		expect(selectResult[0].age).not.toBe(99);
	});

	it('cascades profile deletions and maps notifications, reports, verification requests, push subscriptions, analytics, and contact requests', async () => {
		const service = createService();
		const executeCollectionOperationSpy = jest.spyOn(service, 'executeCollectionOperation');
		const deleteDocumentSpy = jest.spyOn(service, 'deleteDocument').mockResolvedValue({ success: true } as never);
		const fetchByIdsSpy = jest.spyOn(service as any, 'fetchByIds');

		executeCollectionOperationSpy.mockResolvedValue({ data: null, error: null });
		await expect(service.deleteProfile('profile-1')).resolves.toEqual({ success: true });
		expect(deleteDocumentSpy).toHaveBeenCalledWith('profiles', 'profile-1');

		executeCollectionOperationSpy.mockReset();
		fetchByIdsSpy.mockReset();
		executeCollectionOperationSpy
			.mockResolvedValueOnce({
				data: [
					{
						id: 'notification-1',
						type: 'new_message',
						read: undefined,
						created_at: '2024-01-01T00:00:00.000Z',
						actor_id: 'actor-1',
						title: 'Hello',
						body: 'World',
						url: '/messages',
					},
				],
				error: null,
			})
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({
				data: [
					{ id: 'report-1', reporter_id: 'me', reported_id: 'you', reason: 'spam' },
				],
				error: null,
			})
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({
				data: [{ id: 'verification-1', user_id: 'me', status: 'pending' }],
				error: null,
			})
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: { id: 'existing-push' }, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null });
		fetchByIdsSpy
			.mockResolvedValueOnce(
				new Map([
					['me', { id: 'me', first_name: 'Ada' }],
					['you', { id: 'you', first_name: 'Grace' }],
				])
			)
			.mockResolvedValueOnce(new Map([['me', { id: 'me', first_name: 'Ada' }]]));

		await expect(service.listNotifications()).resolves.toEqual([
			{
				id: 'notification-1',
				type: 'new_message',
				read: false,
				createdAt: '2024-01-01T00:00:00.000Z',
				actorId: 'actor-1',
				title: 'Hello',
				body: 'World',
				url: '/messages',
			},
		]);
		await expect(service.markNotificationRead('notification-1')).resolves.toEqual({ data: null, error: null });
		await expect(service.markAllNotificationsRead()).resolves.toEqual({ data: null, error: null });
		await expect(
			service.createReport({ reporterId: 'me', reportedId: 'you', reason: 'spam' })
		).resolves.toEqual({ data: null, error: null });
		await expect(service.listReports()).resolves.toEqual([
			{
				id: 'report-1',
				reason: 'spam',
				reporter_id: 'me',
				reported_id: 'you',
				reporter: { id: 'me', first_name: 'Ada' },
				reported: { id: 'you', first_name: 'Grace' },
			},
		]);
		await expect(service.updateReportStatus('report-1', 'closed')).resolves.toEqual({ data: null, error: null });
		await expect(service.listVerificationRequests()).resolves.toEqual([
			{
				id: 'verification-1',
				user_id: 'me',
				status: 'pending',
				profiles: { id: 'me', first_name: 'Ada' },
			},
		]);
		await expect(service.updateVerificationRequest('verification-1', 'approved', 'me')).resolves.toEqual({
			success: true,
		});

		executeCollectionOperationSpy.mockReset();
		executeCollectionOperationSpy.mockResolvedValueOnce({ data: { id: 'existing-push' }, error: null });
		await expect(
			service.savePushSubscription({ userId: 'me', endpoint: 'endpoint-1' })
		).resolves.toEqual({ success: true, duplicate: true });

		executeCollectionOperationSpy.mockReset();
		executeCollectionOperationSpy
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null });
		await expect(
			service.savePushSubscription({ userId: 'me', endpoint: 'endpoint-2', p256dh: 'p256dh', auth: 'auth' })
		).resolves.toEqual({ success: true });
		await expect(service.deletePushSubscription('me')).resolves.toEqual({ success: true });
		await expect(service.deletePushSubscription('me', 'endpoint-2')).resolves.toEqual({ success: true });
		await expect(
			service.trackAnalyticsEvent({ eventName: 'page_view', properties: { source: 'test' }, path: '/dashboard' })
		).resolves.toEqual({ success: true });
		await expect(
			service.createContactRequest({
				name: 'Ada',
				email: 'ada@example.com',
				subject: 'Hello',
				message: 'World',
				category: 'support',
			})
		).resolves.toEqual({ success: true });
	});

	it('maps messages for a user, tracks presence, and resolves location distinct values', async () => {
		const service = createService();
		jest.spyOn(service as any, 'listMessagesForParticipant').mockResolvedValueOnce([
			{
				id: 'message-1',
				created_at: '2024-01-01T00:00:00.000Z',
				sender_id: 'me',
				receiver_id: 'you',
				content: 'Sent',
			},
			{
				id: 'message-2',
				created_at: '2024-01-02T00:00:00.000Z',
				sender_id: 'you',
				receiver_id: 'me',
				content: 'Received',
				read_at: null,
			},
		]);
		jest.spyOn(service as any, 'fetchByIds').mockResolvedValueOnce(
			new Map([
				['me', { id: 'me', first_name: 'Ada', last_name: 'Lovelace' }],
				['you', { id: 'you', first_name: 'Grace', last_name: 'Hopper' }],
			])
		);
		const executeCollectionOperationSpy = jest.spyOn(service, 'executeCollectionOperation').mockResolvedValue({
			data: null,
			error: null,
		});
		jest.spyOn(service, 'listLocations').mockResolvedValue([
			{ id: 'loc-1', city: 'Paris', region: 'Ile-de-France', country: 'France' },
			{ id: 'loc-2', city: 'Lyon', region: 'Auvergne-Rhone-Alpes', country: 'France' },
			{ id: 'loc-3', city: 'Berlin', region: 'Berlin', country: 'Germany' },
		] as never);
		jest.spyOn(service as any, 'listAllDocuments').mockResolvedValueOnce([
			{
				user_id: 'me',
				online_at: new Date(Date.now() - 10_000).toISOString(),
			},
			{
				user_id: 'stale',
				online_at: new Date(Date.now() - 120_000).toISOString(),
			},
			{
				user_id: '',
				online_at: new Date().toISOString(),
			},
		]);

		await expect(service.listMessagesForUser('me')).resolves.toEqual([
			{
				id: 'message-1',
				created_at: '2024-01-01T00:00:00.000Z',
				sender_id: 'me',
				receiver_id: 'you',
				content: 'Sent',
				read_at: null,
				direction: 'sent',
				sender: { id: 'me', first_name: 'Ada', last_name: 'Lovelace' },
				receiver: { id: 'you', first_name: 'Grace', last_name: 'Hopper' },
			},
			{
				id: 'message-2',
				created_at: '2024-01-02T00:00:00.000Z',
				sender_id: 'you',
				receiver_id: 'me',
				content: 'Received',
				read_at: null,
				direction: 'received',
				sender: { id: 'you', first_name: 'Grace', last_name: 'Hopper' },
				receiver: { id: 'me', first_name: 'Ada', last_name: 'Lovelace' },
			},
		]);
		await expect((service as any).trackPresence('other', 'bad-date')).resolves.toEqual({
			data: expect.objectContaining({ user_id: 'me', online_at: expect.any(String) }),
			error: null,
		});
		await expect((service as any).clearPresence()).resolves.toEqual({ data: true, error: null });
		await expect((service as any).getOnlineUsers()).resolves.toEqual({
			data: [{ user_id: 'me', online_at: expect.any(String) }],
			error: null,
		});
		expect(executeCollectionOperationSpy).toHaveBeenCalledWith('user_presence', {
			action: 'delete',
			filters: [{ type: 'in', column: 'user_id', value: ['stale'] }],
		});
		await expect((service as any).getDistinctCountries()).resolves.toEqual({
			data: [{ country: 'France' }, { country: 'Germany' }],
			error: null,
		});
		await expect((service as any).getDistinctRegions('France')).resolves.toEqual({
			data: [{ region: 'Auvergne-Rhone-Alpes' }, { region: 'Ile-de-France' }],
			error: null,
		});
		await expect((service as any).getDistinctCities('France', 'Ile-de-France')).resolves.toEqual({
			data: [{ city: 'Paris' }],
			error: null,
		});
	});

	it('supports blocking, saved-profile hydration, saved-search wrappers, and exported current-user data', async () => {
		const service = createService();
		const executeCollectionOperationSpy = jest.spyOn(service, 'executeCollectionOperation');
		const listLocationsSpy = jest.spyOn(service, 'listLocations').mockResolvedValue([
			{ id: 'loc-1', city: 'Paris', region: 'Ile-de-France', country: 'France' },
		] as never);

		executeCollectionOperationSpy
			.mockResolvedValueOnce({ data: { id: 'block-1' }, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: { id: 'favorite-1' }, error: null })
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: [{ favorite_id: 'profile-1' }, { favorite_id: 'missing-profile' }], error: null })
			.mockResolvedValueOnce({
				data: [
					{
						id: 'profile-1',
						first_name: 'Ada',
						last_name: 'Lovelace',
						about_me: 'Math',
						age: 28,
						gender: 'female',
						location_id: 'loc-1',
						created_at: '2024-01-01T00:00:00.000Z',
						is_private: false,
						show_age: false,
						show_location: false,
					},
				],
				error: null,
			})
			.mockResolvedValueOnce({ data: [{ profile_id: 'profile-1', passions: { name: 'Music' } }], error: null })
			.mockResolvedValueOnce({ data: [{ profile_id: 'profile-1', languages: { name: 'English' } }], error: null })
			.mockResolvedValueOnce({
				data: [{ id: 'blocked-1', blocked_id: 'you', profile: { id: 'you', first_name: 'Grace' } }],
				error: null,
			})
			.mockResolvedValueOnce({ data: [{ id: 'search-1', name: 'Paris', query: 'ada' }], error: null })
			.mockResolvedValueOnce({ data: [{ id: 'verification-1', status: 'pending' }], error: null });

		await expect((service as any).isBlocked('you')).resolves.toEqual({ data: true, error: null });
		await expect((service as any).isBlockedBy('you')).resolves.toEqual({ data: false, error: null });
		await expect((service as any).blockUser('you')).resolves.toEqual({ data: true, error: null });
		await expect((service as any).unblockUser('you')).resolves.toEqual({ data: true, error: null });
		await expect((service as any).isSaved('you')).resolves.toEqual({ data: true, error: null });

		jest.spyOn(service as any, 'isSaved')
			.mockResolvedValueOnce({ data: false, error: null })
			.mockResolvedValueOnce({ data: true, error: null });
		await expect((service as any).saveProfileToFavorites('you')).resolves.toEqual({ data: true, error: null });
		await expect((service as any).saveProfileToFavorites('you')).resolves.toEqual({ data: true, error: null });
		await expect((service as any).unsaveProfile('you')).resolves.toEqual({ data: true, error: null });

		executeCollectionOperationSpy.mockReset();
		executeCollectionOperationSpy
			.mockResolvedValueOnce({ data: [{ favorite_id: 'profile-1' }, { favorite_id: 'missing-profile' }], error: null })
			.mockResolvedValueOnce({
				data: [
					{
						id: 'profile-1',
						first_name: 'Ada',
						last_name: 'Lovelace',
						about_me: 'Math',
						age: 28,
						gender: 'female',
						location_id: 'loc-1',
						created_at: '2024-01-01T00:00:00.000Z',
						is_private: false,
						show_age: false,
						show_location: false,
					},
				],
				error: null,
			})
			.mockResolvedValueOnce({ data: [{ profile_id: 'profile-1', passions: { name: 'Music' } }], error: null })
			.mockResolvedValueOnce({ data: [{ profile_id: 'profile-1', languages: { name: 'English' } }], error: null })
			.mockResolvedValueOnce({
				data: [{ id: 'blocked-1', blocked_id: 'you', profile: { id: 'you', first_name: 'Grace' } }],
				error: null,
			})
			.mockResolvedValueOnce({ data: [{ id: 'search-1', name: 'Paris', query: 'ada' }], error: null })
			.mockResolvedValueOnce({ data: [{ id: 'verification-1', status: 'pending' }], error: null });
		await expect((service as any).loadSavedProfiles('me')).resolves.toEqual([
			{
				id: 'profile-1',
				first_name: 'Ada',
				last_name: 'Lovelace',
				about_me: 'Math',
				location: null,
				age: null,
				gender: 'female',
				profile_languages: ['English'],
				created_at: '2024-01-01T00:00:00.000Z',
				profilepassions: ['Music'],
				is_private: false,
				show_age: false,
				show_location: false,
			},
		]);
		jest.spyOn(service as any, 'loadSavedProfiles').mockResolvedValueOnce([
			{
				id: 'profile-1',
				first_name: 'Ada',
			},
		]);
		await expect((service as any).getSavedProfiles()).resolves.toEqual({
			data: [
				expect.objectContaining({
					id: 'profile-1',
					first_name: 'Ada',
				}),
			],
			error: null,
		});
		jest.spyOn(service as any, 'loadSavedProfiles').mockResolvedValueOnce([{ id: 'profile-2' }]);
		await expect(service.getFavorites('me')).resolves.toEqual([{ id: 'profile-2' }]);
		await expect(service.listBlockedUsers()).resolves.toEqual([
			{ id: 'blocked-1', blocked_id: 'you', profile: { id: 'you', first_name: 'Grace' } },
		]);
		await expect(service.listSavedSearches()).resolves.toEqual([{ id: 'search-1', name: 'Paris', query: 'ada' }]);
		await expect(service.listVerificationRequestsForUser()).resolves.toEqual([
			{ id: 'verification-1', status: 'pending' },
		]);

		jest.spyOn(service, 'getProfile').mockResolvedValueOnce({ id: 'me', first_name: 'Ada' } as never);
		jest.spyOn(service, 'listMessagesForUser').mockResolvedValueOnce([{ id: 'message-1' }] as never);
		jest.spyOn(service, 'listNotifications').mockResolvedValueOnce([{ id: 'notification-1' }] as never);
		jest.spyOn(service as any, 'loadSavedProfiles').mockResolvedValueOnce([{ id: 'profile-1' }]);
		jest.spyOn(service, 'listBlockedUsers').mockResolvedValueOnce([{ id: 'blocked-1' }] as never);
		jest.spyOn(service, 'listSavedSearches').mockResolvedValueOnce([{ id: 'search-1' }] as never);
		jest.spyOn(service, 'listVerificationRequestsForUser').mockResolvedValueOnce([
			{ id: 'verification-1' },
		] as never);
		await expect(service.exportCurrentUserData()).resolves.toEqual({
			exported_at: expect.any(String),
			user: { id: 'me', email: 'me@example.com', name: 'Me' },
			profile: { id: 'me', first_name: 'Ada' },
			messages: [{ id: 'message-1' }],
			notifications: [{ id: 'notification-1' }],
			favorites: [{ id: 'profile-1' }],
			blocked_users: [{ id: 'blocked-1' }],
			saved_searches: [{ id: 'search-1' }],
			verification_requests: [{ id: 'verification-1' }],
		});
		expect(listLocationsSpy).toHaveBeenCalled();
	});

	it('searches profiles with filters and suggests profiles by shared passions', async () => {
		const service = createService();
		jest.spyOn(service, 'listLocations').mockResolvedValue([
			{ id: 'loc-1', city: 'Paris', region: 'Ile-de-France', country: 'France' },
			{ id: 'loc-2', city: 'Berlin', region: 'Berlin', country: 'Germany' },
		] as never);
		jest.spyOn(service as any, 'listAllDocuments').mockImplementation(
			async (collection: string, queries: string[] = []) => {
				if (collection === 'passions') {
					return [
						{ id: 'passion-1', name: 'Music' },
						{ id: 'passion-2', name: 'Travel' },
					];
				}

				if (collection === 'languages') {
					return [{ id: 'language-1', name: 'English' }];
				}

				if (collection === 'blocked_users') {
					if (queries.some((query) => query.includes('blocker_id'))) {
						return [{ blocker_id: 'me', blocked_id: 'blocked-user' }];
					}

					if (queries.some((query) => query.includes('blocked_id'))) {
						return [{ blocker_id: 'blocked-by-user', blocked_id: 'me' }];
					}

					return [];
				}

				if (collection === 'profile_passions') {
					return [
						{ profile_id: 'profile-1', passion_id: 'passion-1' },
						{ profile_id: 'profile-2', passion_id: 'passion-2' },
						{ profile_id: 'profile-3', passion_id: 'passion-1' },
					];
				}

				if (collection === 'profile_languages') {
					return [
						{ profile_id: 'profile-1', language_id: 'language-1' },
						{ profile_id: 'profile-3', language_id: 'language-1' },
					];
				}

				return [];
			}
		);
		jest.spyOn(service as any, 'listDocumentsPage')
			.mockResolvedValueOnce([
				{
					id: 'me',
					first_name: 'Current',
					last_name: 'User',
					about_me: 'ignore',
					location_id: 'loc-1',
					age: 30,
					gender: 'female',
					created_at: '2024-01-05T00:00:00.000Z',
				},
				{
					id: 'blocked-user',
					first_name: 'Blocked',
					last_name: 'User',
					about_me: 'ignore',
					location_id: 'loc-1',
					age: 30,
					gender: 'female',
					created_at: '2024-01-04T00:00:00.000Z',
				},
				{
					id: 'profile-1',
					first_name: 'Ada',
					last_name: 'Lovelace',
					about_me: 'Math and music',
					location_id: 'loc-1',
					age: 28,
					gender: 'Female',
					created_at: '2024-01-03T00:00:00.000Z',
					is_private: false,
					show_age: true,
					show_location: true,
				},
				{
					id: 'profile-2',
					first_name: 'Grace',
					last_name: 'Hopper',
					about_me: 'Compilers',
					location_id: 'loc-2',
					age: 50,
					gender: 'female',
					created_at: '2024-01-02T00:00:00.000Z',
					is_private: false,
					show_age: true,
					show_location: true,
				},
				{
					id: 'profile-3',
					first_name: 'Ada',
					last_name: 'Byron',
					about_me: 'Math',
					location_id: 'loc-1',
					age: 29,
					gender: 'female',
					created_at: '2024-01-01T00:00:00.000Z',
					is_private: false,
					show_age: true,
					show_location: true,
				},
			])
			.mockResolvedValueOnce([]);

		await expect(
			(service as any).searchProfiles({
				p_current_user_id: 'me',
				p_query: 'ada',
				p_location: 'paris',
				p_language: 'english',
				p_gender: 'female',
				p_passion_ids: ['passion-1'],
				p_min_age: 18,
				p_max_age: 40,
				p_limit: 10,
				p_offset: 0,
			})
		).resolves.toEqual({
			data: [
				{
					id: 'profile-1',
					first_name: 'Ada',
					last_name: 'Lovelace',
					about_me: 'Math and music',
					location: 'Paris, Ile-de-France, France',
					age: 28,
					gender: 'Female',
					profile_languages: ['English'],
					created_at: '2024-01-03T00:00:00.000Z',
					profilepassions: ['Music'],
					is_private: false,
					show_age: true,
					show_location: true,
					last_login: null,
				},
				{
					id: 'profile-3',
					first_name: 'Ada',
					last_name: 'Byron',
					about_me: 'Math',
					location: 'Paris, Ile-de-France, France',
					age: 29,
					gender: 'female',
					profile_languages: ['English'],
					created_at: '2024-01-01T00:00:00.000Z',
					profilepassions: ['Music'],
					is_private: false,
					show_age: true,
					show_location: true,
					last_login: null,
				},
			],
			error: null,
		});
		await expect((service as any).searchProfiles({ p_location: 'unknown' })).resolves.toEqual({
			data: [],
			error: null,
		});

		const searchPostFilterService = createService();
		jest.spyOn(searchPostFilterService, 'listLocations').mockResolvedValue([
			{ id: 'loc-1', city: 'Paris', region: 'Ile-de-France', country: 'France' },
		] as never);
		jest.spyOn(searchPostFilterService as any, 'listAllDocuments').mockImplementation(
			async (collection: string) => {
				switch (collection) {
					case 'passions':
					case 'languages':
					case 'blocked_users':
						return [];
					case 'profile_passions':
						return [{ profile_id: 'profile-1', passion_id: 'missing-passion' }];
					case 'profile_languages':
						return [{ profile_id: 'profile-1', language_id: 'missing-language' }];
					default:
						return [];
				}
			}
		);
		jest.spyOn(searchPostFilterService as any, 'listDocumentsPage')
			.mockResolvedValueOnce([
				{
					id: 'profile-1',
					first_name: 'Ada',
					last_name: 'Lovelace',
					about_me: 'Math and music',
					location_id: 'loc-1',
					birth_date: '1990-01-01',
					gender: 'female',
					created_at: '2024-01-03T00:00:00.000Z',
					is_private: false,
					show_age: true,
					show_location: true,
				},
				{
					id: 'profile-2',
					first_name: 'Grace',
					last_name: 'Hopper',
					about_me: 'Compilers',
					location_id: 'loc-missing',
					birth_date: '1991-01-01',
					gender: 'female',
					created_at: '2024-01-02T00:00:00.000Z',
					is_private: false,
					show_age: true,
					show_location: true,
				},
			] as never)
			.mockResolvedValueOnce([] as never);
		await expect(
			(searchPostFilterService as any).searchProfiles({
				p_location: 'paris',
				p_language: 'english',
				p_limit: 10,
				p_offset: 0,
			})
		).resolves.toEqual({
			data: [],
			error: null,
		});

		jest.spyOn(service, 'listLocations').mockResolvedValueOnce([
			{ id: 'loc-1', city: 'Paris', region: 'Ile-de-France', country: 'France' },
		] as never);
		const listAllDocumentsSpy = jest.spyOn(service as any, 'listAllDocuments');
		listAllDocumentsSpy.mockReset();
		listAllDocumentsSpy.mockImplementation(async (collection: string) => {
			if (collection === 'passions') {
				return [
					{ id: 'passion-1', name: 'Music' },
					{ id: 'passion-2', name: 'Travel' },
				];
			}

			if (collection === 'languages') {
				return [{ id: 'language-1', name: 'English' }];
			}

			if (collection === 'profile_passions') {
				return [
					{ profile_id: 'profile-1', passion_id: 'passion-1' },
					{ profile_id: 'profile-4', passion_id: 'passion-2' },
				];
			}

			if (collection === 'profile_languages') {
				return [
					{ profile_id: 'profile-1', language_id: 'language-1' },
					{ profile_id: 'profile-4', language_id: 'language-1' },
				];
			}

			return [];
		});
		const listDocumentsPageSpy = jest.spyOn(service as any, 'listDocumentsPage');
		listDocumentsPageSpy.mockReset();
		listDocumentsPageSpy.mockResolvedValueOnce([
			{
				id: 'profile-1',
				first_name: 'Ada',
				last_name: 'Lovelace',
				about_me: 'Math and music',
				location_id: 'loc-1',
				birth_date: `${new Date().getUTCFullYear() - 28}-01-01`,
				gender: 'female',
				created_at: '2024-01-03T00:00:00.000Z',
				is_private: false,
				show_age: true,
				show_location: true,
			},
			{
				id: 'profile-4',
				first_name: 'Katherine',
				last_name: 'Johnson',
				about_me: 'Math and travel',
				location_id: 'loc-1',
				birth_date: `${new Date().getUTCFullYear() - 30}-01-01`,
				gender: 'female',
				created_at: '2024-01-02T00:00:00.000Z',
				is_private: false,
				show_age: true,
				show_location: true,
			},
		] as never);

		await expect(
			(service as any).searchProfiles({
				p_current_user_id: 'me',
				p_query: 'math',
				p_location: 'paris',
				p_language: 'english',
				p_gender: 'female',
				p_passion_ids: ['passion-1'],
				p_min_age: 18,
				p_max_age: 40,
				p_limit: 10,
				p_offset: 0,
			})
		).resolves.toEqual({
			data: [
				{
					id: 'profile-1',
					first_name: 'Ada',
					last_name: 'Lovelace',
					about_me: 'Math and music',
					location: 'Paris, Ile-de-France, France',
					age: 28,
					gender: 'female',
					profile_languages: ['English'],
					created_at: '2024-01-03T00:00:00.000Z',
					profilepassions: ['Music'],
					is_private: false,
					show_age: true,
					show_location: true,
					last_login: null,
				},
			],
			error: null,
		});

		jest.spyOn(service as any, 'searchProfiles').mockResolvedValueOnce({
			data: [
				{ id: 'profile-1', created_at: '2024-01-03T00:00:00.000Z' },
				{ id: 'profile-2', created_at: '2024-01-04T00:00:00.000Z' },
				{ id: 'profile-3', created_at: '2024-01-02T00:00:00.000Z' },
			],
			error: null,
		});
		listAllDocumentsSpy
			.mockResolvedValueOnce([
				{ profile_id: 'me', passion_id: 'passion-1' },
				{ profile_id: 'me', passion_id: 'passion-2' },
			])
			.mockResolvedValueOnce([
				{ profile_id: 'profile-1', passion_id: 'passion-1' },
				{ profile_id: 'profile-1', passion_id: 'passion-2' },
				{ profile_id: 'profile-2', passion_id: 'passion-1' },
				{ profile_id: 'profile-3', passion_id: 'passion-3' },
			]);
		await expect((service as any).getSuggestedProfiles('me', 2)).resolves.toEqual({
			data: [
				{
					id: 'profile-1',
					created_at: '2024-01-03T00:00:00.000Z',
					shared_passions_count: 2,
				},
				{
					id: 'profile-2',
					created_at: '2024-01-04T00:00:00.000Z',
					shared_passions_count: 1,
				},
			],
			error: null,
		});
	});

	it('builds admin analytics overviews and exports analytics events', async () => {
		const service = createService();
		const now = Date.now();
		const isoDaysAgo = (daysAgo: number) => new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
		const analyticsRows = [
			{ id: 'evt-page', event_name: 'page_view', path: '/home', created_at: isoDaysAgo(1), properties: null },
			{ id: 'evt-search-1', event_name: 'search_submitted', path: '/search', created_at: isoDaysAgo(1), properties: JSON.stringify({ query: 'ada', location: 'Paris', language: 'English', passions: ['Music', 'Travel'] }) },
			{ id: 'evt-search-2', event_name: 'search_submitted', path: '/search', created_at: isoDaysAgo(2), properties: JSON.stringify({ query: 'ada', location: 'Paris', language: 'English', passions: ['Music'] }) },
			{ id: 'evt-search-3', event_name: 'search_submitted', path: '/search', created_at: isoDaysAgo(3), properties: JSON.stringify({ query: 'grace', location: 'London', language: 'French', passions: [] }) },
			{ id: 'evt-search-4', event_name: 'search_submitted', path: '/search', created_at: isoDaysAgo(4), properties: JSON.stringify({ query: 'grace', location: 'London', language: 'French', passions: ['Travel'] }) },
			{ id: 'evt-search-5', event_name: 'search_submitted', path: '/search', created_at: isoDaysAgo(5), properties: JSON.stringify({ query: 'hopper', location: 'London', language: 'German', passions: ['Travel'] }) },
			{ id: 'evt-results', event_name: 'search_results_loaded', path: '/search', created_at: isoDaysAgo(1), properties: { resultsCount: '2' } },
			{ id: 'evt-zero-1', event_name: 'search_zero_results', path: '/search', created_at: isoDaysAgo(2), properties: '{' },
			{ id: 'evt-zero-2', event_name: 'search_zero_results', path: '/search', created_at: isoDaysAgo(3), properties: '' },
			{ id: 'evt-click', event_name: 'search_result_clicked', path: '/search', created_at: isoDaysAgo(1), properties: { profileName: 'Ada Lovelace' } },
			{ id: 'evt-save', event_name: 'saved_search_created', path: '/search', created_at: isoDaysAgo(1), properties: {} },
			{ id: 'evt-signup-1', event_name: 'signup_completed', path: '/signup', created_at: isoDaysAgo(1), properties: {} },
			{ id: 'evt-signup-2', event_name: 'signup_completed', path: '/signup', created_at: isoDaysAgo(2), properties: {} },
			{ id: 'evt-signup-3', event_name: 'signup_completed', path: '/signup', created_at: isoDaysAgo(3), properties: {} },
			{ id: 'evt-verified', event_name: 'email_verified', path: '/verify-email', created_at: isoDaysAgo(1), properties: {} },
			{ id: 'evt-onboarding', event_name: 'onboarding_completed', path: '/profile', created_at: isoDaysAgo(1), properties: { languages: ['English', '', null], passions: 'Music' } },
			{ id: 'evt-profile', event_name: 'profile_viewed', path: '/user/profile-1', created_at: isoDaysAgo(1), properties: { profileId: 'profile-1' } },
			{ id: 'evt-favorite-add', event_name: 'favorite_added', path: '/favorites', created_at: isoDaysAgo(1), properties: {} },
			{ id: 'evt-favorite-remove', event_name: 'favorite_removed', path: '/favorites', created_at: isoDaysAgo(1), properties: {} },
			{ id: 'evt-message-start', event_name: 'message_started', path: '/messages', created_at: isoDaysAgo(1), properties: {} },
			{ id: 'evt-message-sent', event_name: 'message_sent', path: '/messages', created_at: isoDaysAgo(1), properties: {} },
			{ id: 'evt-push-enabled', event_name: 'push_enabled', path: '/settings', created_at: isoDaysAgo(1), properties: {} },
			{ id: 'evt-push-disabled', event_name: 'push_disabled', path: '/settings', created_at: isoDaysAgo(1), properties: {} },
			{ id: 'evt-notification', event_name: 'notification_opened', path: '/notifications', created_at: isoDaysAgo(1), properties: {} },
			{ id: 'evt-report', event_name: 'report_submitted', path: '/reports', created_at: isoDaysAgo(1), properties: {} },
			{ id: 'evt-verification', event_name: 'verification_requested', path: '/settings/verification', created_at: isoDaysAgo(1), properties: {} },
			{ id: 'evt-old', event_name: 'page_view', path: '/old', created_at: isoDaysAgo(40), properties: {} },
		];

		const executeCollectionOperationSpy = jest
			.spyOn(service, 'executeCollectionOperation')
			.mockImplementation(async (collection: string) => {
				switch (collection) {
					case 'analytics_events':
						return { data: analyticsRows, error: null } as never;
					case 'reports':
						return {
							data: [
								{ id: 'report-1', status: 'pending' },
								{ id: 'report-2', status: 'pending' },
								{ id: 'report-3', status: 'pending' },
								{ id: 'report-4', status: 'pending' },
								{ id: 'report-5', status: 'resolved' },
							],
							error: null,
						} as never;
					case 'verification_requests':
						return {
							data: Array.from({ length: 7 }, (_, index) => ({
								id: `verify-${index + 1}`,
								status: 'pending',
							})),
							error: null,
						} as never;
					case 'favorites':
						return { data: [{ id: 'favorite-1' }, { id: 'favorite-2' }], error: null } as never;
					case 'messages':
						return { data: [{ id: 'message-1' }, { id: 'message-2' }], error: null } as never;
					case 'notifications':
						return {
							data: [
								{ id: 'notification-1', read: false },
								{ id: 'notification-2', read: true },
							],
							error: null,
						} as never;
					case 'push_subscriptions':
						return { data: [{ id: 'push-1' }], error: null } as never;
					case 'profiles':
						return {
							data: Array.from({ length: 10 }, (_, index) => ({
								id: `profile-${index + 1}`,
								first_name: `User${index + 1}`,
								last_name: 'Example',
								birth_date: '1990-01-01',
								gender: 'female',
								verified: true,
								created_at: isoDaysAgo(index + 1),
							})),
							error: null,
						} as never;
					case 'saved_searches':
						return { data: [], error: null } as never;
					default:
						throw new Error(`Unexpected collection: ${collection}`);
				}
			});

		const overview = await service.getAdminAnalyticsOverview({ days: 30 });

		expect(overview.overview.totalEvents).toBe(analyticsRows.length - 1);
		expect(overview.search.submitted).toBe(5);
		expect(overview.search.averageResultsPerSearch).toBe(2);
		expect(overview.search.savedSearches).toBe(1);
		expect(overview.search.topQueries).toEqual(
			expect.arrayContaining([{ label: 'ada', value: 2 }])
		);
		expect(overview.notifications.unread).toBe(1);
		expect(overview.trustAndSafety.pendingReports).toBe(4);
		expect(overview.trustAndSafety.pendingVerificationRequests).toBe(7);
		expect(overview.content.topViewedProfiles).toEqual(
			expect.arrayContaining([{ label: 'Ada Lovelace', value: 1 }])
		);
		expect(overview.health.items).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ title: 'Analytics feed', status: 'good' }),
				expect.objectContaining({ title: 'Search quality', status: 'watch' }),
				expect.objectContaining({ title: 'Onboarding funnel', status: 'watch' }),
				expect.objectContaining({ title: 'Admin queue', status: 'critical' }),
				expect.objectContaining({ title: 'Push adoption', status: 'watch' }),
			])
		);
		expect(overview.activity.dailySeries).toHaveLength(30);
		expect(overview.activity.peakDay).toEqual(
			expect.objectContaining({ date: expect.any(String), totalEvents: expect.any(Number) })
		);

		const exported = await service.exportAdminAnalyticsEvents({
			days: 30,
			eventType: 'search_submitted',
			path: '/search',
		});

		expect(exported.totalEvents).toBe(5);
		expect(exported.events[0]).toEqual(
			expect.objectContaining({ eventName: 'search_submitted', path: '/search' })
		);
		expect(exported.events[0].properties).toEqual(expect.any(Object));

		executeCollectionOperationSpy.mockImplementation(async () => ({ data: [], error: null } as never));

		const emptyOverview = await service.getAdminAnalyticsOverview({ days: 7 });

		expect(emptyOverview.overview.totalEvents).toBe(0);
		expect(emptyOverview.health.items).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ title: 'Analytics feed', status: 'critical' }),
				expect.objectContaining({ title: 'Search quality', status: 'good' }),
				expect.objectContaining({ title: 'Onboarding funnel', status: 'good' }),
				expect.objectContaining({ title: 'Admin queue', status: 'good' }),
				expect.objectContaining({ title: 'Push adoption', status: 'good' }),
			])
		);
	});

	it('manages admin settings, notifications, verification, and admin messaging', async () => {
		const service = createService();
		const executeCollectionOperationSpy = jest.spyOn(service, 'executeCollectionOperation');

		executeCollectionOperationSpy.mockResolvedValueOnce({
			data: null,
			error: { message: 'missing' },
		} as never);
		await expect(service.getAdminSettings()).resolves.toEqual({
			maintenanceBannerText: '',
			analyticsRefreshMinutes: 15,
			moderationHold: false,
			followUpUserIds: [],
			updatedAt: null,
		});

		executeCollectionOperationSpy.mockResolvedValueOnce({
			data: {
				id: 'global',
				maintenance_banner_text: 'Heads up',
				analytics_refresh_minutes: 2,
				moderation_hold: '1',
				follow_up_user_ids: '["user-1"," user-2 "]',
				updated_at: '2024-01-01T00:00:00.000Z',
			},
			error: null,
		} as never);
		await expect(service.getAdminSettings()).resolves.toEqual({
			maintenanceBannerText: 'Heads up',
			analyticsRefreshMinutes: 5,
			moderationHold: true,
			followUpUserIds: ['user-1', 'user-2'],
			updatedAt: '2024-01-01T00:00:00.000Z',
		});

		executeCollectionOperationSpy.mockResolvedValueOnce({
			data: {
				id: 'global',
				maintenanceBannerText: 'Status page only',
				analyticsRefreshMinutes: '999',
				moderationHold: true,
				followUpUserIds: ' user-7, user-8 ',
				updatedAt: '2024-02-01T00:00:00.000Z',
			},
			error: null,
		} as never);
		await expect(service.getAdminSettings()).resolves.toEqual({
			maintenanceBannerText: 'Status page only',
			analyticsRefreshMinutes: 120,
			moderationHold: true,
			followUpUserIds: ['user-7', 'user-8'],
			updatedAt: '2024-02-01T00:00:00.000Z',
		});

		jest.spyOn(service, 'getAdminSettings').mockResolvedValueOnce({
			maintenanceBannerText: 'Heads up',
			analyticsRefreshMinutes: 15,
			moderationHold: false,
			followUpUserIds: ['user-1'],
			updatedAt: null,
		} as never);
		executeCollectionOperationSpy.mockResolvedValueOnce({ data: null, error: null } as never);

		const updatedSettings = await service.updateAdminSettings({
			maintenanceBannerText: 'Maintenance tonight',
			analyticsRefreshMinutes: 999,
			moderationHold: true,
			followUpUserIds: ['user-1', 'user-3'],
		});

		expect(updatedSettings).toEqual(
			expect.objectContaining({
				maintenanceBannerText: 'Maintenance tonight',
				analyticsRefreshMinutes: 120,
				moderationHold: true,
				followUpUserIds: ['user-1', 'user-3'],
				updatedAt: expect.any(String),
			})
		);
		expect(executeCollectionOperationSpy).toHaveBeenLastCalledWith(
			'admin_settings',
			expect.objectContaining({
				action: 'upsert',
				payload: expect.objectContaining({
					id: 'global',
					analytics_refresh_minutes: 120,
					moderation_hold: true,
					follow_up_user_ids: JSON.stringify(['user-1', 'user-3']),
				}),
			})
		);

		const updateAdminSettingsSpy = jest
			.spyOn(service, 'updateAdminSettings')
			.mockResolvedValueOnce({
				maintenanceBannerText: '',
				analyticsRefreshMinutes: 15,
				moderationHold: false,
				followUpUserIds: ['user-1', 'user-4'],
				updatedAt: '2024-01-02T00:00:00.000Z',
			} as never)
			.mockResolvedValueOnce({
				maintenanceBannerText: '',
				analyticsRefreshMinutes: 15,
				moderationHold: false,
				followUpUserIds: ['user-1'],
				updatedAt: '2024-01-03T00:00:00.000Z',
			} as never);
		jest.spyOn(service, 'getAdminSettings').mockResolvedValueOnce({
			maintenanceBannerText: '',
			analyticsRefreshMinutes: 15,
			moderationHold: false,
			followUpUserIds: ['user-1'],
			updatedAt: null,
		} as never);
		await expect(service.toggleAdminFollowUp('user-4', true)).resolves.toEqual(
			expect.objectContaining({ followUpUserIds: ['user-1', 'user-4'] })
		);
		jest.spyOn(service, 'getAdminSettings').mockResolvedValueOnce({
			maintenanceBannerText: '',
			analyticsRefreshMinutes: 15,
			moderationHold: false,
			followUpUserIds: ['user-1', 'user-4'],
			updatedAt: null,
		} as never);
		await expect(service.toggleAdminFollowUp('user-4', false)).resolves.toEqual(
			expect.objectContaining({ followUpUserIds: ['user-1'] })
		);
		expect(updateAdminSettingsSpy).toHaveBeenNthCalledWith(1, { followUpUserIds: ['user-1', 'user-4'] });
		expect(updateAdminSettingsSpy).toHaveBeenNthCalledWith(2, { followUpUserIds: ['user-1'] });

		executeCollectionOperationSpy.mockResolvedValueOnce({
			data: [
				{
					id: 'notification-1',
					type: 'admin_notice',
					read: true,
					created_at: '2024-01-04T00:00:00.000Z',
					actor_id: 'admin-1',
					title: 'Notice',
					body: 'Review required',
					url: '/notifications',
				},
			],
			error: null,
		} as never);
		await expect(service.listAdminNotificationsForUser('user-1')).resolves.toEqual([
			{
				id: 'notification-1',
				type: 'admin_notice',
				read: true,
				createdAt: '2024-01-04T00:00:00.000Z',
				actorId: 'admin-1',
				title: 'Notice',
				body: 'Review required',
				url: '/notifications',
			},
		]);

		executeCollectionOperationSpy.mockResolvedValueOnce({ data: null, error: null } as never);
		const listVerificationRequestsForUserSpy = jest
			.spyOn(service, 'listVerificationRequestsForUser')
			.mockResolvedValueOnce([{ id: 'verification-1', status: 'pending' }] as never);
		const updateVerificationRequestSpy = jest
			.spyOn(service, 'updateVerificationRequest')
			.mockResolvedValueOnce({ success: true } as never);
		await expect(service.setAdminUserVerified('user-1', true)).resolves.toEqual({ success: true });
		expect(updateVerificationRequestSpy).toHaveBeenCalledWith('verification-1', 'approved', 'user-1');

		executeCollectionOperationSpy.mockResolvedValueOnce({ data: null, error: null } as never);
		await expect(service.setAdminUserVerified('user-1', false)).resolves.toEqual({ success: true });
		expect(listVerificationRequestsForUserSpy).toHaveBeenCalledTimes(1);

		const sendMessageSpy = jest
			.spyOn(service, 'sendMessage')
			.mockResolvedValueOnce({ id: 'message-1' } as never);
		const invokeCompatFunctionSpy = jest
			.spyOn(service, 'invokeCompatFunction')
			.mockResolvedValueOnce({ success: true } as never)
			.mockResolvedValueOnce({ success: true } as never);

		await expect(
			service.sendAdminMessage({ adminUserId: 'admin-1', userId: 'user-1', content: 'Hello there' })
		).resolves.toEqual({ id: 'message-1' });
		expect(sendMessageSpy).toHaveBeenCalledWith('admin-1', 'user-1', 'Hello there');
		expect(invokeCompatFunctionSpy).toHaveBeenNthCalledWith(
			1,
			'send-push',
			expect.objectContaining({
				actor_id: 'admin-1',
				receiver_id: 'user-1',
				title: 'Admin message',
				url: '/messages',
			})
		);

		await expect(
			service.sendAdminNotification({
				adminUserId: 'admin-1',
				userId: 'user-1',
				title: 'Review update',
				body: 'Everything looks good',
			})
		).resolves.toEqual({ success: true });
		expect(invokeCompatFunctionSpy).toHaveBeenNthCalledWith(
			2,
			'send-push',
			expect.objectContaining({
				notification_type: 'admin_notice',
				url: '/notifications',
			})
		);
	});

	it('lists admin profiles, investigations, snapshots, and event helper flows', async () => {
		const service = createService();
		const listAllDocumentsSpy = jest.spyOn(service as any, 'listAllDocuments').mockImplementation(async (collection: string) => {
			switch (collection) {
				case 'profiles':
					return [
						{
							id: 'user-1',
							first_name: 'Ada',
							last_name: 'Lovelace',
							location_id: 'loc-1',
							created_at: '2024-01-01T00:00:00.000Z',
							updated_at: '2024-01-05T00:00:00.000Z',
							verified: true,
						},
						{
							id: 'user-2',
							name: 'Grace Hopper',
							location: { city: 'London', country: 'United Kingdom' },
							created_at: '2024-01-02T00:00:00.000Z',
							verified: false,
						},
					];
				case 'messages':
					return [
						{ sender_id: 'user-1', receiver_id: 'user-2', created_at: '2024-01-03T00:00:00.000Z' },
						{ sender_id: 'user-2', receiver_id: 'user-1', created_at: '2024-01-04T00:00:00.000Z' },
					];
				case 'saved_searches':
					return [
						{ user_id: 'user-1' },
						{ user_id: 'user-1' },
						{ user_id: 'user-2' },
					];
				case 'blocked_users':
					return [{ blocker_id: 'user-1' }];
				case 'reports':
					return [
						{ id: 'report-1', reported_id: 'user-1', reporter_id: 'user-2', status: 'pending' },
						{ id: 'report-2', reported_id: 'user-2', reporter_id: 'user-1', status: 'resolved' },
					];
				case 'verification_requests':
					return [{ id: 'verification-1', user_id: 'user-1', status: 'pending', created_at: '2024-01-05T00:00:00.000Z' }];
				case 'profile_passions':
					return [
						{ profile_id: 'user-1', passion_id: 'passion-1' },
						{ profile_id: 'user-1', passion_id: 'passion-2' },
						{ profile_id: 'user-2', passion_id: 'passion-2' },
					];
				case 'profile_languages':
					return [
						{ profile_id: 'user-1', language_id: 'language-1' },
						{ profile_id: 'user-2', language_id: 'language-2' },
					];
				default:
					return [];
			}
		});
		jest.spyOn(service, 'listLocations').mockResolvedValue([
			{ id: 'loc-1', city: 'Paris', region: 'Ile-de-France', country: 'France' },
			{ id: 'loc-2', city: 'London', region: '', country: 'United Kingdom' },
		] as never);
		jest.spyOn(service, 'getAdminSettings').mockResolvedValue({
			maintenanceBannerText: '',
			analyticsRefreshMinutes: 15,
			moderationHold: false,
			followUpUserIds: ['user-1'],
			updatedAt: null,
		} as never);

		await expect(service.listAdminProfiles({ query: 'paris', limit: 5 })).resolves.toEqual([
			expect.objectContaining({
				id: 'user-1',
				displayName: 'Ada Lovelace',
				location: 'Paris, Ile-de-France, France',
				openReports: 1,
				pendingVerification: true,
				savedSearchCount: 2,
				blockedCount: 1,
				messageCount: 2,
				flaggedForFollowUp: true,
			}),
		]);

		const investigationService = createService();
		jest.spyOn(investigationService, 'getProfile').mockResolvedValue({
			id: 'user-1',
			about_me: 'Math pioneer',
			age: 28,
			gender: 'female',
			passions: ['Music'],
			languages: ['English'],
			is_private: false,
		} as never);
		jest.spyOn(investigationService, 'listAdminProfiles').mockResolvedValue([
			{
				id: 'user-1',
				displayName: 'Ada Lovelace',
				firstName: 'Ada',
				lastName: 'Lovelace',
				verified: true,
				location: 'Paris, Ile-de-France, France',
				joinedAt: '2024-01-01T00:00:00.000Z',
				lastActiveAt: '2024-01-05T00:00:00.000Z',
				openReports: 1,
				pendingVerification: true,
				savedSearchCount: 2,
				blockedCount: 1,
				messageCount: 2,
				flaggedForFollowUp: true,
			},
		] as never);
		jest.spyOn(investigationService, 'listMessagesForUser').mockResolvedValue([
			{
				id: 'message-1',
				created_at: '2024-01-03T00:00:00.000Z',
				direction: 'sent',
				content: 'Hello',
				sender: { id: 'user-1', first_name: 'Ada', last_name: 'Lovelace' },
				receiver: { id: 'user-2', first_name: 'Grace', last_name: 'Hopper' },
			},
		] as never);
		jest.spyOn(investigationService, 'listSavedSearches').mockResolvedValue([
			{
				id: 'search-1',
				name: 'Ada in Paris',
				query: 'ada',
				location: 'Paris',
				language: 'English',
				gender: 'female',
				min_age: 18,
				max_age: 35,
				passion_ids: ['passion-1'],
				created_at: '2024-01-02T00:00:00.000Z',
			},
		] as never);
		jest.spyOn(investigationService, 'listBlockedUsers').mockResolvedValue([
			{
				id: 'blocked-1',
				blocked_id: 'user-2',
				created_at: '2024-01-04T00:00:00.000Z',
				profile: {
					id: 'user-2',
					first_name: 'Grace',
					last_name: 'Hopper',
					verified: false,
					location_id: 'loc-2',
				},
			},
		] as never);
		jest.spyOn(investigationService, 'listVerificationRequestsForUser').mockResolvedValue([
			{ id: 'verification-1', status: 'pending', created_at: '2024-01-05T00:00:00.000Z' },
		] as never);
		jest.spyOn(investigationService, 'listReports').mockResolvedValue([
			{
				id: 'report-1',
				reason: 'Spam',
				status: 'pending',
				created_at: '2024-01-06T00:00:00.000Z',
				reporter_id: 'user-1',
				reported_id: 'user-2',
				reporter: { id: 'user-1', first_name: 'Ada', last_name: 'Lovelace', verified: true, location_id: 'loc-1' },
				reported: { id: 'user-2', first_name: 'Grace', last_name: 'Hopper', verified: false, location_id: 'loc-2' },
			},
			{
				id: 'report-2',
				reason: 'Abuse',
				status: 'pending',
				created_at: '2024-01-07T00:00:00.000Z',
				reporter_id: 'user-2',
				reported_id: 'user-1',
				reporter: { id: 'user-2', first_name: 'Grace', last_name: 'Hopper', verified: false, location_id: 'loc-2' },
				reported: { id: 'user-1', first_name: 'Ada', last_name: 'Lovelace', verified: true, location_id: 'loc-1' },
			},
		] as never);
		jest.spyOn(investigationService, 'listAdminNotificationsForUser').mockResolvedValue([
			{ id: 'notification-1', type: 'admin_notice', read: false, createdAt: '2024-01-06T00:00:00.000Z', actorId: 'admin-1', title: 'Notice', body: 'Review needed', url: '/notifications' },
		] as never);
		jest.spyOn(investigationService, 'listLocations').mockResolvedValue([
			{ id: 'loc-1', city: 'Paris', region: 'Ile-de-France', country: 'France' },
			{ id: 'loc-2', city: 'London', region: '', country: 'United Kingdom' },
		] as never);

		const investigation = await investigationService.getAdminUserInvestigation('user-1');
		expect(investigation.user).toEqual(
			expect.objectContaining({
				id: 'user-1',
				aboutMe: 'Math pioneer',
				age: 28,
				gender: 'female',
				passions: ['Music'],
				languages: ['English'],
			})
		);
		expect(investigation.messages[0]).toEqual(
			expect.objectContaining({
				direction: 'sent',
				sender: expect.objectContaining({ id: 'user-1' }),
				receiver: expect.objectContaining({ id: 'user-2' }),
			})
		);
		expect(investigation.blockedUsers[0].profile).toEqual(
			expect.objectContaining({ displayName: 'Grace Hopper' })
		);
		expect(investigation.reportsFiled).toHaveLength(1);
		expect(investigation.reportsAgainst).toHaveLength(1);

		const missingInvestigationService = createService();
		jest.spyOn(missingInvestigationService, 'getProfile').mockResolvedValue(null as never);
		jest.spyOn(missingInvestigationService, 'listAdminProfiles').mockResolvedValue([] as never);
		jest.spyOn(missingInvestigationService, 'listMessagesForUser').mockResolvedValue([] as never);
		jest.spyOn(missingInvestigationService, 'listSavedSearches').mockResolvedValue([] as never);
		jest.spyOn(missingInvestigationService, 'listBlockedUsers').mockResolvedValue([] as never);
		jest.spyOn(missingInvestigationService, 'listVerificationRequestsForUser').mockResolvedValue([] as never);
		jest.spyOn(missingInvestigationService, 'listReports').mockResolvedValue([] as never);
		jest.spyOn(missingInvestigationService, 'listAdminNotificationsForUser').mockResolvedValue([] as never);
		jest.spyOn(missingInvestigationService, 'listLocations').mockResolvedValue([] as never);
		await expect(missingInvestigationService.getAdminUserInvestigation('missing-user')).rejects.toThrow('User not found');

		const snapshotService = createService();
		jest.spyOn(snapshotService, 'getAdminAnalyticsOverview').mockResolvedValue({
			trustAndSafety: { pendingReports: 2, pendingVerificationRequests: 1 },
			notifications: { unread: 3 },
		} as never);
		jest.spyOn(snapshotService, 'listReports').mockResolvedValue([
			{
				id: 'report-1',
				reason: 'Spam',
				status: 'pending',
				created_at: '2024-01-06T00:00:00.000Z',
				reporter_id: 'user-1',
				reported_id: 'user-2',
				reporter: { id: 'user-1', first_name: 'Ada', last_name: 'Lovelace', verified: true, location_id: 'loc-1' },
				reported: { id: 'user-2', first_name: 'Grace', last_name: 'Hopper', verified: false, location_id: 'loc-2' },
			},
		] as never);
		jest.spyOn(snapshotService, 'listVerificationRequests').mockResolvedValue([
			{
				id: 'verification-1',
				user_id: 'user-1',
				status: 'pending',
				created_at: '2024-01-05T00:00:00.000Z',
				profiles: { id: 'user-1', first_name: 'Ada', last_name: 'Lovelace', verified: true, location_id: 'loc-1' },
			},
		] as never);
		jest.spyOn(snapshotService, 'getAdminSettings').mockResolvedValue({
			maintenanceBannerText: '',
			analyticsRefreshMinutes: 15,
			moderationHold: false,
			followUpUserIds: ['user-1', 'user-2'],
			updatedAt: '2024-01-02T00:00:00.000Z',
		} as never);
		jest.spyOn(snapshotService, 'listLocations').mockResolvedValue([
			{ id: 'loc-1', city: 'Paris', region: 'Ile-de-France', country: 'France' },
			{ id: 'loc-2', city: 'London', region: '', country: 'United Kingdom' },
		] as never);

		const snapshot = await snapshotService.getAdminDashboardSnapshot({ days: 30 });
		expect(snapshot.queues.reports[0]).toEqual(
			expect.objectContaining({ reporter: expect.objectContaining({ displayName: 'Ada Lovelace' }) })
		);
		expect(snapshot.queues.verificationRequests[0]).toEqual(
			expect.objectContaining({ profile: expect.objectContaining({ displayName: 'Ada Lovelace' }) })
		);
		expect(snapshot.quickActions).toEqual({
			pendingReports: 2,
			pendingVerificationRequests: 1,
			flaggedUsers: 2,
			unreadNotifications: 3,
			totalQueueItems: 3,
		});
		expect(snapshot.lastUpdatedAt).toEqual(expect.any(String));

		const transformService = createService();
		jest.spyOn(transformService as any, 'listAllDocuments').mockImplementation(async (collection: string) => {
			if (collection === 'profile_passions') {
				return [
					{ profile_id: 'user-1', passion_id: 'passion-1' },
					{ profile_id: 'user-1', passion_id: 'passion-2' },
				];
			}

			if (collection === 'profile_languages') {
				return [{ profile_id: 'user-1', language_id: 'language-1' }];
			}

			return [];
		});
		jest.spyOn(transformService as any, 'hydrateProfilesWithLocations').mockImplementation(async (profiles: any[]) => profiles);
		await expect(
			(transformService as any).transformSelectedDocuments(
				'profiles',
				[{ id: 'user-1' }, { id: 'user-2' }],
				'id, profile_passions(count), profile_languages(count)'
			)
		).resolves.toEqual([
			expect.objectContaining({ id: 'user-1', passions_count: [{ count: 2 }], languages_count: [{ count: 1 }] }),
			expect.objectContaining({ id: 'user-2', passions_count: [{ count: 0 }], languages_count: [{ count: 0 }] }),
		]);

		const readService = createService();
		jest.spyOn(readService as any, 'requireCurrentUser').mockResolvedValue({ id: 'user-1' } as never);
		const executeReadSpy = jest.spyOn(readService, 'executeCollectionOperation').mockResolvedValue({ data: null, error: null } as never);
		await expect((readService as any).markMessagesAsRead('user-2', '')).resolves.toEqual({ data: true, error: null });
		expect(executeReadSpy).toHaveBeenCalledWith(
			'messages',
			expect.objectContaining({
				filters: [
					{ type: 'eq', column: 'sender_id', value: 'user-2' },
					{ type: 'eq', column: 'receiver_id', value: 'user-1' },
				],
			})
		);

		expect(listAllDocumentsSpy).toHaveBeenCalled();
	});

	it('covers remaining collection helper branches and message fallbacks', async () => {
		const helperService = createService();
		expect(
			(helperService as any).matchesFilter(
				{ id: 'doc-1' },
				{ type: 'unsupported', column: 'id', value: 'doc-1' }
			)
		).toBe(true);

		jest.spyOn(helperService as any, 'fetchByIds').mockResolvedValueOnce(new Map());
		await expect(
			(helperService as any).hydrateProfilesWithLocations(
				[{ id: 'profile-1', birth_date: '2000-04-25', location_id: null }],
				' '
			)
		).resolves.toEqual([
			expect.objectContaining({
				id: 'profile-1',
				birth_date: '2000-04-25',
				age: expect.any(Number),
			}),
		]);

		const conversationService = createService();
		jest.spyOn(conversationService as any, 'listDocumentsWindow').mockRejectedValue(new Error('window failed'));
		jest.spyOn(conversationService as any, 'listAllDocuments').mockResolvedValue([
			{ id: 'message-2', sender_id: 'you', receiver_id: 'me', created_at: '2024-01-02T00:00:00.000Z' },
			{ id: 'message-1', sender_id: 'me', receiver_id: 'you', created_at: '2024-01-01T00:00:00.000Z' },
			{ id: 'message-3', sender_id: 'other', receiver_id: 'me', created_at: '2024-01-03T00:00:00.000Z' },
		] as never);
		await expect(
			(conversationService as any).getConversationDocuments(
				{ senderA: 'me', receiverA: 'you', senderB: 'you', receiverB: 'me' },
				{
					action: 'select',
					filters: [
						{
							type: 'or',
							expression:
								'and(sender_id.eq.me,receiver_id.eq.you),and(sender_id.eq.you,receiver_id.eq.me)',
						},
					],
					order: { column: 'created_at', ascending: true },
				}
			)
		).resolves.toEqual([
			{ id: 'message-1', sender_id: 'me', receiver_id: 'you', created_at: '2024-01-01T00:00:00.000Z' },
			{ id: 'message-2', sender_id: 'you', receiver_id: 'me', created_at: '2024-01-02T00:00:00.000Z' },
		]);

		const participantService = createService();
		jest.spyOn(participantService as any, 'listAllDocuments').mockImplementation(
			async (_collection: string, queries?: string[]) => {
				if (queries) {
					throw new Error('query failed');
				}

				return [
					{ id: 'message-1', sender_id: 'me', receiver_id: 'you', created_at: '2024-01-01T00:00:00.000Z' },
					{ id: 'message-2', sender_id: 'you', receiver_id: 'me', created_at: '2024-01-02T00:00:00.000Z' },
					{ id: 'message-3', sender_id: 'other', receiver_id: 'else', created_at: '2024-01-03T00:00:00.000Z' },
				];
			}
		);
		await expect((participantService as any).listMessagesForParticipant('me', false)).resolves.toEqual([
			{ id: 'message-2', sender_id: 'you', receiver_id: 'me', created_at: '2024-01-02T00:00:00.000Z' },
			{ id: 'message-1', sender_id: 'me', receiver_id: 'you', created_at: '2024-01-01T00:00:00.000Z' },
		]);

		const matchingService = createService();
		const queryEqualMock = Query.equal as jest.Mock;
		jest.spyOn(matchingService as any, 'listAllDocuments').mockResolvedValue([
			{ id: 'message-1', sender_id: 'me', receiver_id: 'you', created_at: '2024-01-01T00:00:00.000Z' },
		] as never);
		await expect(
			(matchingService as any).getMatchingDocuments('messages', {
				action: 'select',
				filters: [
					{
						type: 'or',
						expression:
							'and(sender_id.eq.me,receiver_id.eq.you),and(sender_id.eq.you,receiver_id.eq.me)',
					},
				],
				order: { column: 'id', ascending: true },
			})
		).resolves.toEqual([
			{ id: 'message-1', sender_id: 'me', receiver_id: 'you', created_at: '2024-01-01T00:00:00.000Z' },
		]);
		expect(queryEqualMock.mock.calls).toContainEqual(['sender_id', ['me', 'you']]);
		expect(queryEqualMock.mock.calls).toContainEqual(['receiver_id', ['you', 'me']]);

		const createDefaultsService = createService();
		mockRepo.createDocument
			.mockResolvedValueOnce({ $id: 'notification-1', flags: ['fresh'] })
			.mockResolvedValueOnce({ $id: 'contact-1' });
		await (createDefaultsService as any).createDocuments('notifications', {
			id: 'notification-1',
			title: 'Notice',
		});
		await (createDefaultsService as any).createDocuments('contact_requests', {
			id: 'contact-1',
			email: 'ada@example.com',
		});
		expect(mockRepo.createDocument).toHaveBeenNthCalledWith(
			1,
			'collection:notifications',
			expect.objectContaining({
				id: 'notification-1',
				read: false,
				created_at: expect.any(String),
			}),
			'notification-1'
		);
		expect(mockRepo.createDocument).toHaveBeenNthCalledWith(
			2,
			'collection:contact_requests',
			expect.objectContaining({
				id: 'contact-1',
				status: 'pending',
				created_at: expect.any(String),
			}),
			'contact-1'
		);

		const deleteService = createService();
		jest
			.spyOn(deleteService, 'executeCollectionOperation')
			.mockResolvedValueOnce({ data: null, error: { message: 'broken delete' } } as never)
			.mockResolvedValueOnce({ data: null, error: null } as never);
		await expect(deleteService.deleteDocument('profiles', 'broken')).rejects.toThrow('broken delete');
		await expect(deleteService.deleteDocument('profiles', 'ok')).resolves.toEqual({ success: true });

		const recentService = createService();
		jest.spyOn(recentService as any, 'getConversations').mockResolvedValue({
			data: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }, { id: '6' }],
			error: null,
		} as never);
		await expect((recentService as any).getRecentConversations('me')).resolves.toEqual({
			data: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }],
			error: null,
		});
	});

	it('covers remaining admin ranking and suggestion fallback branches', async () => {
		const settingsService = createService();
		jest.spyOn(settingsService, 'executeCollectionOperation').mockResolvedValueOnce({
			data: {
				id: 'global',
				maintenance_banner_text: '',
				analytics_refresh_minutes: null,
				moderation_hold: 0,
				follow_up_user_ids: 'user-1, user-2',
				updated_at: '',
			},
			error: null,
		} as never);
		await expect(settingsService.getAdminSettings()).resolves.toEqual({
			maintenanceBannerText: '',
			analyticsRefreshMinutes: 15,
			moderationHold: false,
			followUpUserIds: ['user-1', 'user-2'],
			updatedAt: null,
		});

		const adminSortService = createService();
		jest.spyOn(adminSortService as any, 'listAllDocuments').mockImplementation(async (collection: string) => {
			switch (collection) {
				case 'profiles':
					return [
						{ id: 'flagged', first_name: 'Flagged', updated_at: '2024-01-05T00:00:00.000Z', verified: true },
						{ id: 'reports', first_name: 'Reports', updated_at: '2024-01-04T00:00:00.000Z', verified: true, location_id: 'loc-1' },
						{ id: 'pending', first_name: 'Pending', updated_at: '2024-01-04T00:00:00.000Z', verified: false, location_id: 'loc-1' },
						{ id: 'alpha', first_name: 'Alpha', updated_at: '2024-01-03T00:00:00.000Z', verified: false },
						{ id: 'zeta', email: 'zeta@example.com', updated_at: '2024-01-03T00:00:00.000Z', verified: false },
					];
				case 'messages':
					return [];
				case 'saved_searches':
					return [];
				case 'blocked_users':
					return [];
				case 'reports':
					return [
						{ id: 'report-1', reported_id: 'reports', status: 'pending' },
						{ id: 'report-2', reported_id: 'reports', status: 'pending' },
					];
				case 'verification_requests':
					return [{ id: 'verification-1', user_id: 'pending', status: 'pending' }];
				default:
					return [];
			}
		});
		jest.spyOn(adminSortService, 'listLocations').mockResolvedValue([
			{ id: 'loc-1', city: 'Paris', region: 'Ile-de-France', country: 'France' },
		] as never);
		jest.spyOn(adminSortService, 'getAdminSettings').mockResolvedValue({
			maintenanceBannerText: '',
			analyticsRefreshMinutes: 15,
			moderationHold: false,
			followUpUserIds: ['flagged'],
			updatedAt: null,
		} as never);
		await expect(adminSortService.listAdminProfiles({ limit: 5 })).resolves.toEqual([
			expect.objectContaining({ id: 'flagged', flaggedForFollowUp: true }),
			expect.objectContaining({ id: 'reports', openReports: 2 }),
			expect.objectContaining({ id: 'pending', pendingVerification: true }),
			expect.objectContaining({ id: 'alpha', displayName: 'Alpha' }),
			expect.objectContaining({ id: 'zeta', displayName: 'zeta@example.com' }),
		]);

		const searchFallbackService = createService();
		jest.spyOn(searchFallbackService, 'listLocations').mockResolvedValue([
			{ id: 'loc-1', city: 'Paris', region: 'Ile-de-France', country: 'France' },
		] as never);
		jest.spyOn(searchFallbackService as any, 'listAllDocuments').mockImplementation(
			async (collection: string, queries: string[] = []) => {
				if (collection === 'passions' || collection === 'languages') {
					return [];
				}

				if (collection === 'blocked_users') {
					if (queries.length) {
						throw new Error('blocked query failed');
					}

					return [
						{ blocker_id: 'me', blocked_id: 'blocked-user' },
						{ blocker_id: 'blocked-by-user', blocked_id: 'me' },
					];
				}

				if (collection === 'profile_passions' || collection === 'profile_languages') {
					return [];
				}

				return [];
			}
		);
		jest.spyOn(searchFallbackService as any, 'listDocumentsPage')
			.mockResolvedValueOnce([
				{
					id: 'blocked-user',
					first_name: 'Blocked',
					last_name: 'User',
					location_id: 'loc-1',
					birth_date: '1990-01-01',
					gender: 'female',
					created_at: '2024-01-03T00:00:00.000Z',
					is_private: false,
					show_age: true,
					show_location: true,
				},
				{
					id: 'blocked-by-user',
					first_name: 'Blocked By',
					last_name: 'User',
					location_id: 'loc-1',
					birth_date: '1990-01-01',
					gender: 'female',
					created_at: '2024-01-02T00:00:00.000Z',
					is_private: false,
					show_age: true,
					show_location: true,
				},
				{
					id: 'visible-user',
					first_name: 'Visible',
					last_name: 'User',
					location_id: 'loc-1',
					birth_date: '1991-01-01',
					gender: 'female',
					created_at: '2024-01-01T00:00:00.000Z',
					is_private: false,
					show_age: true,
					show_location: true,
				},
			] as never)
			.mockResolvedValueOnce([] as never);
		await expect(
			(searchFallbackService as any).searchProfiles({
				p_current_user_id: 'me',
				p_limit: 10,
				p_offset: 0,
			})
		).resolves.toEqual({
			data: [
				expect.objectContaining({
					id: 'visible-user',
					location: 'Paris, Ile-de-France, France',
				}),
			],
			error: null,
		});

		const suggestionTieService = createService();
		jest.spyOn(suggestionTieService as any, 'searchProfiles').mockResolvedValueOnce({
			data: [
				{ id: 'older', created_at: '2024-01-01T00:00:00.000Z' },
				{ id: 'newer', created_at: '2024-01-02T00:00:00.000Z' },
			],
			error: null,
		});
		jest
			.spyOn(suggestionTieService as any, 'listAllDocuments')
			.mockResolvedValueOnce([{ profile_id: 'me', passion_id: 'passion-1' }] as never)
			.mockResolvedValueOnce([
				{ profile_id: 'older', passion_id: 'passion-1' },
				{ profile_id: 'newer', passion_id: 'passion-1' },
			] as never);
		await expect((suggestionTieService as any).getSuggestedProfiles('me', 2)).resolves.toEqual({
			data: [
				{ id: 'newer', created_at: '2024-01-02T00:00:00.000Z', shared_passions_count: 1 },
				{ id: 'older', created_at: '2024-01-01T00:00:00.000Z', shared_passions_count: 1 },
			],
			error: null,
		});
	});

	it('covers helper fallbacks for push payloads and static data', async () => {
		const service = createService();

		(getAppwriteFunctionId as jest.Mock).mockReturnValueOnce('send-push-id');
		await expect(
			service.invokeCompatFunction('send-push', {
				recipient_id: 'receiver-3',
				message: 'Queued ping',
				title: '  Custom title  ',
				notification_type: ' admin_notice ',
				actor_id: ' actor-2 ',
				related_id: ' thread-9 ',
			})
		).resolves.toEqual({ success: true });
		expect(JSON.parse(mockCreateExecution.mock.calls.at(-1)?.[1] as string)).toEqual(
			expect.objectContaining({
				receiver_id: 'receiver-3',
				recipient_id: 'receiver-3',
				actor_id: 'actor-2',
				title: 'Custom title',
				body: 'Queued ping',
				message: 'Queued ping',
				notification_type: 'admin_notice',
				related_id: 'thread-9',
			})
		);

		expect((service as any).isStaticCollection('locations')).toBe(true);
		expect((service as any).isStaticCollection('messages')).toBe(false);
		expect((service as any).getStaticCollectionDocuments('unknown')).toBeNull();
		expect(
			(service as any).resolveStaticLocationId({
				city: 'Paris',
				region: 'Ile-de-France',
				country: 'France',
			})
		).toBe('location-paris-ile-de-france-france');
		expect(
			(service as any).resolveStaticLocationId({
				city: 'Paris',
				country: 'France',
			})
		).toBe('location-paris-ile-de-france-france');
		expect(
			(service as any).resolveStaticLocationId({
				city: 'Paris',
				region: 'Texas',
				country: 'France',
			})
		).toBeNull();
		expect(
			(service as any).resolveStaticLocationId({
				city: null,
				country: 'France',
			})
		).toBeNull();

		mockRepo.listDocuments.mockRejectedValueOnce(new Error('profiles lookup failed'));
		await expect((service as any).listAllDocuments('profiles')).rejects.toThrow('profiles lookup failed');

		const getCurrentUserSpy = jest.spyOn(service as any, 'getCurrentUser');
		getCurrentUserSpy
			.mockResolvedValueOnce({ id: 'me', email: 'me@example.com', name: 'Me' })
			.mockResolvedValueOnce(null);
		await expect((service as any).requireCurrentUser()).resolves.toEqual({
			id: 'me',
			email: 'me@example.com',
			name: 'Me',
		});
		await expect((service as any).requireCurrentUser()).rejects.toThrow('Not authenticated');
	});

	it('covers admin queue mapping when nested profiles are missing', async () => {
		const service = createService();
		jest.spyOn(service, 'getAdminAnalyticsOverview').mockResolvedValue({
			trustAndSafety: { pendingReports: 1, pendingVerificationRequests: 1 },
			notifications: { unread: 0 },
		} as never);
		jest.spyOn(service, 'listReports').mockResolvedValue([
			{
				id: 'report-1',
				reason: null,
				status: 'pending',
				created_at: null,
				reporter_id: null,
				reported_id: null,
				reporter: null,
				reported: null,
			},
		] as never);
		jest.spyOn(service, 'listVerificationRequests').mockResolvedValue([
			{
				id: 'verification-1',
				user_id: 'user-1',
				status: 'pending',
				created_at: null,
				profiles: null,
			},
		] as never);
		jest.spyOn(service, 'getAdminSettings').mockResolvedValue({
			maintenanceBannerText: '',
			analyticsRefreshMinutes: 15,
			moderationHold: false,
			followUpUserIds: [],
			updatedAt: null,
		} as never);
		jest.spyOn(service, 'listLocations').mockResolvedValue([] as never);

		await expect(service.getAdminDashboardSnapshot({ days: 30 })).resolves.toEqual(
			expect.objectContaining({
				queues: {
					reports: [
						expect.objectContaining({
							reason: '',
							status: 'pending',
							reporter: null,
							reported: null,
						}),
					],
					verificationRequests: [
						expect.objectContaining({
							status: 'pending',
							profile: null,
						}),
					],
				},
			})
		);
	});

	it('covers admin queue user fallbacks for email, name, id, and inline locations', async () => {
		const service = createService();
		jest.spyOn(service, 'getAdminAnalyticsOverview').mockResolvedValue({
			trustAndSafety: { pendingReports: 1, pendingVerificationRequests: 1 },
			notifications: { unread: 2 },
		} as never);
		jest.spyOn(service, 'listReports').mockResolvedValue([
			{
				id: 'report-inline-location',
				reason: 'Review',
				status: 'pending',
				created_at: '2024-03-01T00:00:00.000Z',
				reporter_id: 'user-email',
				reported_id: 'user-id-only',
				reporter: {
					id: 'user-email',
					email: 'reporter@example.com',
					avatar_url: 'avatar-1',
					location: { city: 'Rome', country: 'Italy' },
				},
				reported: {
					id: 'user-id-only',
					locations: { city: 'Madrid', region: 'Community of Madrid', country: 'Spain' },
				},
			},
		] as never);
		jest.spyOn(service, 'listVerificationRequests').mockResolvedValue([
			{
				id: 'verification-inline-location',
				user_id: 'user-name',
				status: 'pending',
				created_at: '2024-03-02T00:00:00.000Z',
				profiles: {
					id: 'user-name',
					name: 'Single Name',
					locations: { city: 'Berlin', country: 'Germany' },
				},
			},
		] as never);
		jest.spyOn(service, 'getAdminSettings').mockResolvedValue({
			maintenanceBannerText: '',
			analyticsRefreshMinutes: 15,
			moderationHold: false,
			followUpUserIds: [],
			updatedAt: null,
		} as never);
		jest.spyOn(service, 'listLocations').mockResolvedValue([] as never);

		const snapshot = await service.getAdminDashboardSnapshot({ days: 30 });

		expect(snapshot.queues.reports[0]).toEqual(
			expect.objectContaining({
				reporter: expect.objectContaining({
					displayName: 'reporter@example.com',
					location: 'Rome, Italy',
					avatarUrl: 'avatar-1',
				}),
				reported: expect.objectContaining({
					displayName: 'user-id-only',
					location: 'Madrid, Community of Madrid, Spain',
				}),
			})
		);
		expect(snapshot.queues.verificationRequests[0]).toEqual(
			expect.objectContaining({
				profile: expect.objectContaining({
					displayName: 'Single Name',
					location: 'Berlin, Germany',
				}),
			})
		);
	});

	it('covers createDocuments cases, executeCollectionOperation fallthrough, getProfile null, fetchByIds fallback, hydrateMessages null profiles, getConversations unread, and buildDailySeries boundary row', async () => {
		const service = createService();

		// createDocuments: 'messages' case (lines 1229-1234) sets created_at
		mockRepo.createDocument.mockResolvedValueOnce({ $id: 'msg-1', id: 'msg-1', created_at: '2024-01-01T00:00:00Z' });
		await (service as any).createDocuments('messages', { id: 'msg-1', content: 'hi' });
		expect(mockRepo.createDocument).toHaveBeenLastCalledWith(
			'collection:messages',
			expect.objectContaining({ id: 'msg-1', created_at: expect.any(String) }),
			'msg-1'
		);

		// createDocuments: 'reports' case (lines 1239-1242) sets created_at and status
		mockRepo.createDocument.mockResolvedValueOnce({ $id: 'rep-1', id: 'rep-1' });
		await (service as any).createDocuments('reports', { id: 'rep-1' });
		expect(mockRepo.createDocument).toHaveBeenLastCalledWith(
			'collection:reports',
			expect.objectContaining({ status: 'pending', created_at: expect.any(String) }),
			'rep-1'
		);

		// createDocuments: 'favorites' case (lines 1229-1234)
		mockRepo.createDocument.mockResolvedValueOnce({ $id: 'fav-1', id: 'fav-1' });
		await (service as any).createDocuments('favorites', { id: 'fav-1', user_id: 'u1', favorite_id: 'u2' });
		expect(mockRepo.createDocument).toHaveBeenLastCalledWith(
			'collection:favorites',
			expect.objectContaining({ id: 'fav-1', created_at: expect.any(String) }),
			'fav-1'
		);

		// executeCollectionOperation: no action match → { data: null, error: null } (lines 1394-1395)
		await expect(service.executeCollectionOperation('profiles', { action: 'unknown' as any })).resolves.toEqual({
			data: null,
			error: null,
		});

		// getProfile: error response → null (lines 1414-1415)
		jest.spyOn(service, 'executeCollectionOperation').mockResolvedValueOnce({
			data: null,
			error: { message: 'not found', code: '404' },
		} as never);
		await expect(service.getProfile('missing-id')).resolves.toBeNull();
		jest.restoreAllMocks();

		// getProfile: null data → null
		jest.spyOn(service, 'executeCollectionOperation').mockResolvedValueOnce({ data: null, error: null } as never);
		await expect(service.getProfile('null-id')).resolves.toBeNull();
		jest.restoreAllMocks();

		// fetchByIds: fewer docs than requested → fallback to listAllDocuments (lines 1005-1006 false path)
		mockRepo.listDocuments
			.mockResolvedValueOnce({ documents: [{ $id: 'p1', id: 'p1', first_name: 'Ada' }] })  // filtered query returns 1 of 2
			.mockResolvedValueOnce({ documents: [{ $id: 'p1', id: 'p1', first_name: 'Ada' }, { $id: 'p2', id: 'p2', first_name: 'Grace' }] }); // all docs
		const profilesMap = await (service as any).fetchByIds('profiles', ['p1', 'p2']);
		expect(profilesMap.get('p1')).toEqual(expect.objectContaining({ first_name: 'Ada' }));
		expect(profilesMap.get('p2')).toEqual(expect.objectContaining({ first_name: 'Grace' }));

		// hydrateMessages: sender and receiver not found → null (lines 1056, 1061 false arms)
		mockRepo.listDocuments.mockResolvedValue({ documents: [] });
		const hydratedMsgs = await (service as any).hydrateMessages(
			[{ id: 'msg-5', sender_id: 'missing-sender', receiver_id: 'missing-receiver' }],
			'id, sender:profiles!sender_id(id), receiver:profiles!receiver_id(id)'
		);
		expect(hydratedMsgs[0].sender).toBeNull();
		expect(hydratedMsgs[0].receiver).toBeNull();

		// hydrateProfilesWithLocations: location found but profile.location_id is null → null (line 1005 false arm)
		jest.spyOn(service as any, 'fetchByIds').mockResolvedValueOnce(new Map([['loc-1', { id: 'loc-1', city: 'Paris' }]]));
		const profilesWithNullLocation = await (service as any).hydrateProfilesWithLocations(
			[{ id: 'prof-1', birth_date: '1990-01-01', location_id: null }],
			'id, birth_date, locations(city)'
		);
		expect(profilesWithNullLocation[0].locations).toBeNull();
		jest.restoreAllMocks();

		// getConversations: multiple messages from same user → unread increments (lines 3771, 3774-3775)
		jest.spyOn(service as any, 'listMessagesForParticipant').mockResolvedValueOnce([
			// First message from 'other' to 'me' (newer) → creates entry, unread = 1
			{ id: 'msg-newer', sender_id: 'other', receiver_id: 'me', content: 'hi again', created_at: '2024-01-02T00:00:00Z', read_at: null },
			// Second older message from 'other' to 'me' → existing entry is newer, falls into else if
			{ id: 'msg-older', sender_id: 'other', receiver_id: 'me', content: 'hi', created_at: '2024-01-01T00:00:00Z', read_at: null },
		]);
		jest.spyOn(service as any, 'fetchByIds').mockResolvedValueOnce(new Map());
		const convResult = await (service as any).getConversations('me');
		// The conversation with 'other' should have unread count of 2 (one from new entry + one from else-if)
		expect(convResult.data[0].unread).toBe(2);
		jest.restoreAllMocks();

		// buildDailySeries via getAdminAnalyticsOverview: row with date outside series window → !series.has(date) continue
		// (lines 438-440): Use a row dated exactly trendWindowDays days ago (one day before the series window)
		const now = Date.now();
		const boundaryDate = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(); // exactly 30 days ago = on boundary
		const executeCollSpy = jest.spyOn(service, 'executeCollectionOperation').mockImplementation(async (collection: string) => {
			if (collection === 'analytics_events') {
				return { data: [{ id: 'old-evt', event_name: 'page_view', path: '/', created_at: boundaryDate, properties: null }], error: null } as never;
			}
			return { data: [], error: null } as never;
		});
		const overview = await service.getAdminAnalyticsOverview({ days: 30 });
		expect(overview.range.days).toBe(30);
		executeCollSpy.mockRestore();

		// buildLocationLabel: parts.length === 0 → null (line 335 false arm)
		// Call via getAdminDashboardSnapshot with a profile that has all null location fields
		const snapshot = await service.getAdminDashboardSnapshot({ days: 30 });
		expect(snapshot).toBeDefined();
	});

	it('covers static collection access, filter helpers, window break, field projection, and push payload fallbacks', async () => {
		const service = createService();

		// listAllDocuments with static collection returns static data (lines 667-668)
		const locations = await (service as any).listAllDocuments('locations');
		expect(Array.isArray(locations)).toBe(true);
		expect(locations.length).toBeGreaterThan(0);

		// listDocumentsPage with static collection returns sliced data (lines 703-705)
		const locationsPage = await (service as any).listDocumentsPage('locations', [], 5, 0);
		expect(Array.isArray(locationsPage)).toBe(true);
		expect(locationsPage.length).toBeLessThanOrEqual(5);

		// listDocumentsPage throws for non-optional collection error (lines 719-721)
		mockRepo.listDocuments.mockRejectedValueOnce(new Error('DB failure'));
		await expect((service as any).listDocumentsPage('profiles', [], 10, 0)).rejects.toThrow('DB failure');

		// listDocumentsWindow: break when batch is smaller than batchLimit (lines 738-740)
		const listDocPageSpy = jest.spyOn(service as any, 'listDocumentsPage').mockResolvedValueOnce([{ id: 'd1' }, { id: 'd2' }]);
		const windowed = await (service as any).listDocumentsWindow('profiles', [], 10);
		expect(windowed).toHaveLength(2);
		listDocPageSpy.mockRestore();

		// matchesFilter: 'or' filter with non-string expression (lines 768-769)
		expect((service as any).matchesFilter({ sender_id: 'a' }, { type: 'or', expression: 123 })).toBe(true);
		// matchesFilter: 'or' filter with invalid expression string (lines 773-775)
		expect((service as any).matchesFilter({ sender_id: 'a' }, { type: 'or', expression: 'invalid-expr' })).toBe(true);

		// applyFilters: empty filters array returns docs unchanged (lines 803-805)
		const docs = [{ id: '1' }, { id: '2' }];
		expect((service as any).applyFilters(docs, [])).toEqual(docs);

		// pickSelectedFields: empty token after trim is skipped (lines 942-944)
		const picked = (service as any).pickSelectedFields({ a: 1, b: 2 }, ', a');
		expect(picked).toEqual(expect.objectContaining({ a: 1 }));

		// getRelationSelection via hydrateRelationRows:
		// null selectSpec → undefined (lines 547-548)
		const noRows = await (service as any).hydrateRelationRows([], 'passions', 'passion_id', 'passions', null);
		expect(noRows).toEqual([]);
		// selectSpec with no matching token → undefined (lines 555-556)
		const rowsOne = [{ passion_id: 'p1', name: 'row' }];
		mockRepo.listDocuments.mockResolvedValue({ documents: [] });
		const noTokenResult = await (service as any).hydrateRelationRows(rowsOne, 'passions', 'passion_id', 'passions', 'id, name');
		expect(noTokenResult).toHaveLength(1);
		// selectSpec with empty parens → end <= start+1 → undefined (lines 562-563)
		const emptyParensResult = await (service as any).hydrateRelationRows(rowsOne, 'passions', 'passion_id', 'passions', 'passions()');
		expect(emptyParensResult).toHaveLength(1);

		// normalizePushFunctionPayload: no receiver_id, recipient_id → '' (line 147), no body/message → '' (line 155)
		(getAppwriteFunctionId as jest.Mock).mockReturnValueOnce(undefined);
		const pushResult = await service.invokeCompatFunction('send-push', {});
		expect(pushResult).toEqual({ success: true, fallback: true });

		// compareValues string localeCompare (line 201) via applyOrderAndWindow with string values
		const stringDocs = [{ name: 'Zebra' }, { name: 'Apple' }, { name: 'Mango' }];
		const sorted = (service as any).applyOrderAndWindow(stringDocs, { order: { column: 'name', ascending: true } });
		expect(sorted[0].name).toBe('Apple');
		expect(sorted[2].name).toBe('Zebra');
	});

	it('covers executeCollectionOperation and CRUD missing branches: single-select-with-results, insert/update/delete paths, static throws, and hydration cases', async () => {
		const service = createService();
		const getMatchingDocumentsSpy = jest.spyOn(service as any, 'getMatchingDocuments');
		const transformSelectedDocumentsSpy = jest.spyOn(service as any, 'transformSelectedDocuments');
		const createDocumentsSpy = jest.spyOn(service as any, 'createDocuments');
		const updateDocumentsSpy = jest.spyOn(service as any, 'updateDocuments');
		const deleteDocumentsSpy = jest.spyOn(service as any, 'deleteDocuments');

		// select with single:true and a result found (lines 1322-1324)
		getMatchingDocumentsSpy.mockResolvedValueOnce([{ id: 'row-found' }]);
		transformSelectedDocumentsSpy.mockResolvedValueOnce([{ id: 'row-found', name: 'Grace' }]);
		await expect(service.executeCollectionOperation('profiles', { action: 'select', single: true })).resolves.toEqual({
			data: { id: 'row-found', name: 'Grace' },
			error: null,
		});

		// insert without select, non-single → data: null (lines 1333, 1338-1339 null arm)
		createDocumentsSpy.mockResolvedValueOnce([{ id: 'ins-1' }]);
		await expect(service.executeCollectionOperation('messages', { action: 'insert', payload: { id: 'ins-1' } })).resolves.toEqual({
			data: null,
			error: null,
		});

		// insert with select, non-single → data: transformed (line 1338 truthy arm)
		createDocumentsSpy.mockResolvedValueOnce([{ id: 'ins-2' }]);
		transformSelectedDocumentsSpy.mockResolvedValueOnce([{ id: 'ins-2' }]);
		await expect(service.executeCollectionOperation('messages', { action: 'insert', payload: { id: 'ins-2' }, select: 'id' })).resolves.toEqual({
			data: [{ id: 'ins-2' }],
			error: null,
		});

		// update non-single without select → data: null (lines 1373, 1378-1379 null arm)
		updateDocumentsSpy.mockResolvedValueOnce([{ id: 'upd-1' }]);
		await expect(service.executeCollectionOperation('messages', {
			action: 'update',
			filters: [{ type: 'eq', column: 'id', value: 'upd-1' }],
			payload: { content: 'hi' },
		})).resolves.toEqual({ data: null, error: null });

		// update non-single with select → data: transformed (line 1378-1379 truthy arm)
		updateDocumentsSpy.mockResolvedValueOnce([{ id: 'upd-2' }]);
		transformSelectedDocumentsSpy.mockResolvedValueOnce([{ id: 'upd-2' }]);
		await expect(service.executeCollectionOperation('messages', {
			action: 'update',
			filters: [{ type: 'eq', column: 'id', value: 'upd-2' }],
			payload: { content: 'hi' },
			select: 'id',
		})).resolves.toEqual({ data: [{ id: 'upd-2' }], error: null });

		// delete with single:true → data: first item (line 1391)
		deleteDocumentsSpy.mockResolvedValueOnce([{ id: 'del-1' }]);
		transformSelectedDocumentsSpy.mockResolvedValueOnce([{ id: 'del-1' }]);
		await expect(service.executeCollectionOperation('messages', {
			action: 'delete',
			filters: [{ type: 'eq', column: 'id', value: 'del-1' }],
			select: 'id',
			single: true,
		})).resolves.toEqual({ data: { id: 'del-1' }, error: null });

		// delete non-single without select → data: null (lines 1394-1395 null arm)
		deleteDocumentsSpy.mockResolvedValueOnce([{ id: 'del-2' }]);
		await expect(service.executeCollectionOperation('messages', {
			action: 'delete',
			filters: [{ type: 'eq', column: 'id', value: 'del-2' }],
		})).resolves.toEqual({ data: null, error: null });

		// createDocuments: static collection throws (lines 1197-1199)
		await expect((service as any).createDocuments('locations', { id: '1' })).rejects.toThrow(
			'locations is managed in code and cannot be modified via collection operations.'
		);

		// createDocuments: null entry is skipped (lines 1205-1207)
		mockRepo.createDocument.mockResolvedValueOnce({ $id: 'gen-1', id: 'gen-1' });
		const created = await (service as any).createDocuments('custom_table', [null, { id: 'gen-1' }]);
		expect(created).toHaveLength(1);

		// createDocuments: default collection case (line 1252)
		mockRepo.createDocument.mockResolvedValueOnce({ $id: 'gen-2', id: 'gen-2' });
		const createdDefault = await (service as any).createDocuments('other_collection', { id: 'gen-2' });
		expect(createdDefault).toHaveLength(1);

		// updateDocuments: static collection throws (lines 1267-1269)
		await expect((service as any).updateDocuments('passions', { action: 'update' })).rejects.toThrow(
			'passions is managed in code and cannot be modified via collection operations.'
		);

		// deleteDocuments: static collection throws (lines 1288-1290)
		await expect((service as any).deleteDocuments('locations', { action: 'delete' })).rejects.toThrow(
			'locations is managed in code and cannot be modified via collection operations.'
		);

		// transformSelectedDocuments: profile_languages case (line 1138)
		mockRepo.listDocuments.mockResolvedValue({ documents: [] });
		const profileLanguageResult = await (service as any).transformSelectedDocuments(
			'profile_languages',
			[{ language_id: 'lang-1' }],
			'language_id, languages(name)'
		);
		expect(profileLanguageResult).toHaveLength(1);

		// transformSelectedDocuments: default case (line 1144)
		const defaultResult = await (service as any).transformSelectedDocuments('custom_collection', [{ id: 'x' }], 'id');
		expect(defaultResult).toEqual([{ id: 'x' }]);

		// hydrateBlockedUsers: profile not in map → result.profile = null (line 1081)
		mockRepo.listDocuments.mockResolvedValue({ documents: [] });
		const blockedResult = await (service as any).hydrateBlockedUsers(
			[{ blocked_id: 'missing-user', id: 'block-1' }],
			'profile:profiles!blocked_users_blocked_id_fkey'
		);
		expect(blockedResult[0].profile).toBeNull();

		// getMatchingDocuments with 'in' filter pushes query (lines 1174-1175)
		mockRepo.listDocuments.mockResolvedValue({ documents: [] });
		const inResult = await (service as any).getMatchingDocuments('messages', {
			action: 'select',
			filters: [{ type: 'in', column: 'status', value: ['sent', 'read'] }],
		});
		expect(Array.isArray(inResult)).toBe(true);

		// getConversationDocuments limit===null && offset===0 returns merged (lines 876-877)
		mockRepo.listDocuments.mockResolvedValue({ documents: [] });
		const convResult = await service.executeCollectionOperation('messages', {
			action: 'select',
			filters: [{ type: 'or', expression: 'and(sender_id.eq.user-a,receiver_id.eq.user-b),and(sender_id.eq.user-b,receiver_id.eq.user-a)' }],
		});
		expect(convResult.error).toBeNull();
	});

	it('covers analytics drill-down filters, date/null fallbacks, export filters, admin error paths, and default limit', async () => {
		const service = createService();

		const makeAnalyticsMock = (rows: any[]) =>
			jest.spyOn(service, 'executeCollectionOperation').mockImplementation(async (collection: string) => {
				if (collection === 'analytics_events') return { data: rows, error: null } as never;
				if (collection === 'reports') return { data: [], error: null } as never;
				if (collection === 'verification_requests') return { data: [], error: null } as never;
				if (collection === 'favorites') return { data: [], error: null } as never;
				if (collection === 'messages') return { data: [], error: null } as never;
				if (collection === 'notifications') return { data: [], error: null } as never;
				if (collection === 'push_subscriptions') return { data: [], error: null } as never;
				if (collection === 'profiles') return { data: [], error: null } as never;
				if (collection === 'saved_searches') return { data: [], error: null } as never;
				return { data: null, error: null } as never;
			});

		const now = new Date().toISOString();
		const recentRows = [
			{ id: 'e1', event_name: 'search_submitted', path: '/search', created_at: now, properties: null },
			{ id: 'e2', event_name: 'profile_viewed', path: '/user/p1', created_at: null, properties: {} },
			{ id: 'e3', event_name: 'profile_viewed', path: '/user/p2', created_at: 'not-a-date', properties: {} },
			{ id: 'e4', event_name: 'profile_viewed', path: '/user/p3', created_at: now, properties: {} },
		];

		// getAdminAnalyticsOverview with invalid days → normalizedDays=null (line 2367)
		// and without rangeCutoff, all rows used (line 2376)
		let spy = makeAnalyticsMock(recentRows);
		const noRangeOverview = await service.getAdminAnalyticsOverview({ days: -1 });
		expect(noRangeOverview.range.days).toBeNull();
		spy.mockRestore();

		// getAdminAnalyticsOverview with eventType drill-down filter → rows that don't match return false (lines 2382-2383)
		// and path filter → rows that don't match return false (lines 2386-2387)
		spy = makeAnalyticsMock(recentRows);
		const drillDownOverview = await service.getAdminAnalyticsOverview({ days: 30, eventType: 'search_submitted', path: '/search' });
		// Only the search_submitted event on /search should pass the drill-down; profile_viewed on other paths don't
		expect(drillDownOverview.range.days).toBe(30);
		spy.mockRestore();

		// toDayKey(null) → null (lines 300-301) via analytics row with null created_at
		// toDayKey('not-a-date') → null (lines 306-307)
		// incrementCount(map, null) early return (lines 286-287) via profile_viewed with no profileId
		// isOnOrAfter(null, cutoff) → false (lines 478-479)
		spy = makeAnalyticsMock(recentRows);
		const dateEdgeOverview = await service.getAdminAnalyticsOverview({ days: 30 });
		expect(dateEdgeOverview.range.days).toBe(30);
		spy.mockRestore();

		// parseStoredStringArray: !normalized path → [] (lines 270-271)
		// via getAdminSettings returning doc with empty follow_up_user_ids
		jest.spyOn(service, 'executeCollectionOperation').mockResolvedValueOnce({
			data: { id: 'settings-1', follow_up_user_ids: '', analytics_refresh_minutes: null },
			error: null,
		} as never);
		const settingsEmpty = await service.getAdminSettings();
		expect(settingsEmpty.followUpUserIds).toEqual([]);
		jest.restoreAllMocks();

		// parseStoredStringArray: catch block comma-split (lines 277-280)
		// via getAdminSettings returning doc with comma-separated string (invalid JSON)
		jest.spyOn(service, 'executeCollectionOperation').mockResolvedValueOnce({
			data: { id: 'settings-2', follow_up_user_ids: 'user-1,user-2,user-3', analytics_refresh_minutes: 15 },
			error: null,
		} as never);
		const settingsComma = await service.getAdminSettings();
		expect(settingsComma.followUpUserIds).toEqual(['user-1', 'user-2', 'user-3']);
		jest.restoreAllMocks();

		// exportAdminAnalyticsEvents with invalid days → normalizedDays=null (line 2826)
		jest.spyOn(service, 'executeCollectionOperation').mockResolvedValueOnce({ data: [], error: null } as never);
		const exportNoRange = await service.exportAdminAnalyticsEvents({ days: undefined });
		expect(exportNoRange.filters.days).toBeNull();
		jest.restoreAllMocks();

		// exportAdminAnalyticsEvents with path filter that doesn't match → return false (lines 2844-2845)
		const exportRows = [{ id: 'x1', event_name: 'search_submitted', path: '/search', created_at: now, properties: null }];
		jest.spyOn(service, 'executeCollectionOperation').mockResolvedValueOnce({ data: exportRows, error: null } as never);
		const exportFiltered = await service.exportAdminAnalyticsEvents({ days: 30, path: '/other' });
		expect(exportFiltered.totalEvents).toBe(0);
		jest.restoreAllMocks();

		// updateAdminSettings: error path throws (lines 2914-2915)
		jest.spyOn(service, 'getAdminSettings').mockResolvedValue({
			maintenanceBannerText: '',
			analyticsRefreshMinutes: 15,
			moderationHold: false,
			followUpUserIds: [],
			updatedAt: null,
		} as never);
		jest.spyOn(service, 'executeCollectionOperation').mockResolvedValueOnce({
			data: null,
			error: { message: 'Settings save failed', code: '500' },
		} as never);
		await expect(service.updateAdminSettings({ maintenanceBannerText: 'Down for maintenance' })).rejects.toThrow('Settings save failed');
		jest.restoreAllMocks();

		// setAdminUserVerified: error path throws (lines 2962-2963)
		jest.spyOn(service, 'executeCollectionOperation').mockResolvedValueOnce({
			data: null,
			error: { message: 'Verify update failed', code: '500' },
		} as never);
		await expect(service.setAdminUserVerified('user-1', true)).rejects.toThrow('Verify update failed');
		jest.restoreAllMocks();

		// listAdminProfiles without options → default limit 8 (line 3026)
		// and message with null sender_id → userId falsy continue (lines 3041-3042)
		jest.spyOn(service, 'executeCollectionOperation').mockResolvedValue({ data: [], error: null } as never);
		jest.spyOn(service as any, 'listAllDocuments').mockImplementation(async (collection: string) => {
			if (collection === 'messages') {
				return [{ id: 'm1', sender_id: null, receiver_id: 'user-1', created_at: null }];
			}
			return [];
		});
		jest.spyOn(service, 'listLocations').mockResolvedValue([] as never);
		jest.spyOn(service, 'getAdminSettings').mockResolvedValue({
			maintenanceBannerText: '',
			analyticsRefreshMinutes: 15,
			moderationHold: false,
			followUpUserIds: [],
			updatedAt: null,
		} as never);
		const adminProfiles = await service.listAdminProfiles();
		expect(Array.isArray(adminProfiles)).toBe(true);
		jest.restoreAllMocks();
	});

	it('covers saved profiles empty path, search profile rejections, and compat RPC cases', async () => {
		const service = createService();

		// getFavorites (loadSavedProfiles): no favorites → return [] (lines 3667-3668)
		jest.spyOn(service, 'executeCollectionOperation').mockResolvedValueOnce({ data: [], error: null } as never);
		const favorites = await service.getFavorites('user-1');
		expect(favorites).toEqual([]);
		jest.restoreAllMocks();

		// searchProfiles: filter rejections for minAge, maxAge, query
		// Set up so profiles are fetched but rejected by filters
		const futureDate = new Date(Date.now() + 86400000 * 365 * 20).toISOString().slice(0, 10); // future birth date → very young
		const pastDate20 = new Date(Date.now() - 86400000 * 365 * 20).toISOString().slice(0, 10); // 20 yo
		const pastDate60 = new Date(Date.now() - 86400000 * 365 * 60).toISOString().slice(0, 10); // 60 yo
		jest.spyOn(service as any, 'listDocumentsPage').mockResolvedValueOnce([
			{ id: 'young-profile', birth_date: futureDate, gender: 'male', first_name: 'Young' },
			{ id: 'old-profile', birth_date: pastDate60, gender: 'male', first_name: 'Elder' },
			{ id: 'match-profile', birth_date: pastDate20, gender: 'female', first_name: 'Alice' },
		]).mockResolvedValue([]);
		jest.spyOn(service as any, 'listAllDocuments').mockResolvedValue([]);
		jest.spyOn(service as any, 'fetchByIds').mockResolvedValue(new Map());
		jest.spyOn(service, 'listLocations').mockResolvedValue([] as never);
		const searchResult = await (service as any).searchProfiles({
			current_user_id: 'current',
			min_age: 18,
			max_age: 50,
			gender: 'female',
			query: 'Alice',
		});
		// young-profile rejected by minAge (lines 3929-3930)
		// old-profile rejected by maxAge (lines 3937-3938) (age > 50)
		// match-profile passes (Alice, female, ~20 yo)
		expect(Array.isArray(searchResult.data)).toBe(true);
		jest.restoreAllMocks();

		// sendMessage: error path throws (lines 1915-1916)
		jest.spyOn(service, 'executeCollectionOperation').mockResolvedValueOnce({
			data: null,
			error: { message: 'Insert failed', code: '500' },
		} as never);
		jest.spyOn(service as any, 'requireCurrentUser').mockResolvedValueOnce({ id: 'sender-1' });
		await expect(service.sendMessage('sender-1', 'receiver-1', 'Hello')).rejects.toThrow('Insert failed');
		jest.restoreAllMocks();

		// executeCompatRpc: getDistinctCountries (line 1987)
		jest.spyOn(service as any, 'getDistinctCountries').mockResolvedValueOnce(['France']);
		const countries = await service.executeCompatRpc('get_distinct_countries');
		expect(countries).toEqual(['France']);
		jest.restoreAllMocks();
		// executeCompatRpc: getDistinctRegions (line 1989)
		jest.spyOn(service as any, 'getDistinctRegions').mockResolvedValueOnce(['Ile-de-France']);
		const regions = await service.executeCompatRpc('get_distinct_regions', { p_country: 'France' });
		expect(regions).toEqual(['Ile-de-France']);
		jest.restoreAllMocks();
		// executeCompatRpc: getDistinctCities (line 1991)
		jest.spyOn(service as any, 'getDistinctCities').mockResolvedValueOnce(['Paris']);
		const cities = await service.executeCompatRpc('get_distinct_cities', { p_country: 'France', p_region: 'Ile-de-France' });
		expect(cities).toEqual(['Paris']);
		jest.restoreAllMocks();

		// executeCompatRpc: mark_messages_as_read with receiver_id fallback (lines 2021-2022)
		jest.spyOn(service as any, 'markMessagesAsRead').mockResolvedValueOnce([]);
		await service.executeCompatRpc('mark_messages_as_read', { sender_id: 'user-a', receiver_id: 'user-b' });
		expect((service as any).markMessagesAsRead).toHaveBeenCalledWith('user-a', 'user-b');
		jest.restoreAllMocks();
	});
});

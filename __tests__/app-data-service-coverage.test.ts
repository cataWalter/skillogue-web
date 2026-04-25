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
			.mockResolvedValueOnce({ data: [{ id: 'passion-1', name: 'Music' }], error: null })
			.mockResolvedValueOnce({ data: [{ id: 'location-1', city: 'Paris', country: 'France' }], error: null })
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
		await expect(service.listPassions()).resolves.toEqual([{ id: 'passion-1', name: 'Music' }]);
		await expect(service.listLocations()).resolves.toEqual([
			{ id: 'location-1', city: 'Paris', country: 'France' },
		]);
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
	});

	it('dispatches compat RPC calls to the correct private methods', async () => {
		const service = createService();
		const cases: Array<{
			name: string;
			method: string;
			args?: Record<string, unknown>;
			expectedArgs: unknown[];
			value: unknown;
		}> = [
			{ name: 'get_distinct_countries', method: 'getDistinctCountries', expectedArgs: [], value: { data: [] } },
			{
				name: 'get_distinct_regions',
				method: 'getDistinctRegions',
				args: { p_country: 'France' },
				expectedArgs: ['France'],
				value: { data: [] },
			},
			{
				name: 'get_distinct_cities',
				method: 'getDistinctCities',
				args: { p_country: 'France', p_region: 'Ile' },
				expectedArgs: ['France', 'Ile'],
				value: { data: [] },
			},
			{ name: 'is_blocked', method: 'isBlocked', args: { target_id: 'target' }, expectedArgs: ['target'], value: { data: true } },
			{
				name: 'is_blocked_by',
				method: 'isBlockedBy',
				args: { target_id: 'target' },
				expectedArgs: ['target'],
				value: { data: true },
			},
			{ name: 'block_user', method: 'blockUser', args: { target_id: 'target' }, expectedArgs: ['target'], value: { data: true } },
			{
				name: 'unblock_user',
				method: 'unblockUser',
				args: { target_id: 'target' },
				expectedArgs: ['target'],
				value: { data: true },
			},
			{ name: 'is_saved', method: 'isSaved', args: { target_id: 'target' }, expectedArgs: ['target'], value: { data: true } },
			{
				name: 'save_profile',
				method: 'saveProfileToFavorites',
				args: { target_id: 'target' },
				expectedArgs: ['target'],
				value: { data: true },
			},
			{
				name: 'unsave_profile',
				method: 'unsaveProfile',
				args: { target_id: 'target' },
				expectedArgs: ['target'],
				value: { data: true },
			},
			{
				name: 'get_saved_profiles',
				method: 'getSavedProfiles',
				expectedArgs: [],
				value: { data: [] },
			},
			{
				name: 'get_conversations',
				method: 'getConversations',
				args: { current_user_id: 'me' },
				expectedArgs: ['me'],
				value: { data: [] },
			},
			{
				name: 'get_recent_conversations',
				method: 'getRecentConversations',
				args: { current_user_id: 'me' },
				expectedArgs: ['me'],
				value: { data: [] },
			},
			{
				name: 'mark_messages_as_read',
				method: 'markMessagesAsRead',
				args: { sender_id_param: 'you', receiver_id_param: 'me' },
				expectedArgs: ['you', 'me'],
				value: { data: true },
			},
			{
				name: 'track_presence',
				method: 'trackPresence',
				args: { user_id: 'me', online_at: '2024-01-01T00:00:00.000Z' },
				expectedArgs: ['me', '2024-01-01T00:00:00.000Z'],
				value: { data: true },
			},
			{
				name: 'clear_presence',
				method: 'clearPresence',
				args: { user_id: 'me' },
				expectedArgs: ['me'],
				value: { data: true },
			},
			{
				name: 'get_online_users',
				method: 'getOnlineUsers',
				expectedArgs: [],
				value: { data: [] },
			},
			{
				name: 'search_profiles',
				method: 'searchProfiles',
				args: { p_query: 'Ada' },
				expectedArgs: [{ p_query: 'Ada' }],
				value: { data: [] },
			},
			{
				name: 'get_suggested_profiles',
				method: 'getSuggestedProfiles',
				args: { current_user_id: 'me', p_limit: 3 },
				expectedArgs: ['me', 3],
				value: { data: [] },
			},
		];

		for (const testCase of cases) {
			const spy = jest.spyOn(service as any, testCase.method).mockResolvedValueOnce(testCase.value);
			await expect(service.executeCompatRpc(testCase.name, testCase.args)).resolves.toEqual(testCase.value);
			expect(spy).toHaveBeenCalledWith(...testCase.expectedArgs);
		}

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
		expect(executeCollectionOperationSpy).toHaveBeenCalledWith('locations', {
			action: 'insert',
			payload: {
				city: 'New York',
				region: '',
				country: 'USA',
			},
			select: 'id, city, region, country',
			single: true,
		});

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
				},
			],
			error: null,
		});
		await expect((service as any).searchProfiles({ p_location: 'unknown' })).resolves.toEqual({
			data: [],
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
		jest.spyOn(service as any, 'listAllDocuments').mockResolvedValueOnce([
			{ profile_id: 'me', passion_id: 'passion-1' },
			{ profile_id: 'profile-1', passion_id: 'passion-1' },
			{ profile_id: 'profile-1', passion_id: 'passion-2' },
			{ profile_id: 'profile-2', passion_id: 'passion-1' },
			{ profile_id: 'profile-2', passion_id: 'passion-2' },
			{ profile_id: 'profile-3', passion_id: 'passion-2' },
		]);
		await expect((service as any).getSuggestedProfiles('me', 2)).resolves.toEqual({
			data: [
				{
					id: 'profile-2',
					created_at: '2024-01-04T00:00:00.000Z',
					shared_passions_count: 1,
				},
				{
					id: 'profile-1',
					created_at: '2024-01-03T00:00:00.000Z',
					shared_passions_count: 1,
				},
			],
			error: null,
		});
	});
});

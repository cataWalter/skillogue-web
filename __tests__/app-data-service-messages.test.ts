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

import { createAppwriteSessionAccount } from '../src/lib/appwrite/server';
import { AppDataService } from '../src/lib/server/app-data-service';
import { getAppwriteFunctionId } from '../src/lib/appwrite/config';
import { createAppwriteAdminFunctions } from '../src/lib/appwrite/server';

jest.mock('../src/lib/appwrite/config', () => ({
  getAppwriteCollectionId: jest.fn((name: string) => name),
  getAppwriteDatabaseId: jest.fn(() => 'database-id'),
  getAppwriteFunctionId: jest.fn(() => undefined),
}));

jest.mock('../src/lib/appwrite/server', () => ({
  createAppwriteAdminFunctions: jest.fn(() => ({})),
  createAppwriteSessionAccount: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ $id: 'me', email: 'me@example.com' }),
  })),
  getAppwriteErrorMessage: jest.fn((error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback
  ),
}));

jest.mock('../src/lib/server/appwrite-repo', () => ({
  AppwriteRepository: jest.fn().mockImplementation(() => ({
    listDocuments: jest.fn(),
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
  })),
}));

describe('AppDataService messaging compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pages merged conversation queries instead of scanning the full messages collection', async () => {
    const service = new AppDataService();
    const listDocumentsWindowSpy = jest.spyOn(service as any, 'listDocumentsWindow');
    const listAllDocumentsSpy = jest.spyOn(service as any, 'listAllDocuments');
    const fetchByIdsSpy = jest.spyOn(service as any, 'fetchByIds');

    listDocumentsWindowSpy
      .mockResolvedValueOnce([
        {
          id: 'sent-5',
          created_at: '2024-04-05T10:00:00.000Z',
          sender_id: 'me',
          receiver_id: 'you',
          content: 'Newest from me',
        },
        {
          id: 'sent-3',
          created_at: '2024-04-03T10:00:00.000Z',
          sender_id: 'me',
          receiver_id: 'you',
          content: 'Older from me',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'recv-4',
          created_at: '2024-04-04T10:00:00.000Z',
          sender_id: 'you',
          receiver_id: 'me',
          content: 'Newest from you',
        },
        {
          id: 'recv-2',
          created_at: '2024-04-02T10:00:00.000Z',
          sender_id: 'you',
          receiver_id: 'me',
          content: 'Older from you',
        },
      ]);

    fetchByIdsSpy.mockResolvedValue(
      new Map([
        ['me', { id: 'me', first_name: 'Me', last_name: 'User' }],
        ['you', { id: 'you', first_name: 'You', last_name: 'User' }],
      ])
    );
    listAllDocumentsSpy.mockResolvedValue([]);

    const response = await service.executeCollectionOperation('messages', {
      action: 'select',
      filters: [
        {
          type: 'or',
          expression: 'and(sender_id.eq.me,receiver_id.eq.you),and(sender_id.eq.you,receiver_id.eq.me)',
        },
      ],
      order: { column: 'created_at', ascending: false },
      range: { from: 1, to: 1 },
      select:
        'id, created_at, sender_id, receiver_id, content, sender:profiles!sender_id(id, first_name, last_name), receiver:profiles!receiver_id(id, first_name, last_name)',
    });

    expect(listDocumentsWindowSpy).toHaveBeenCalledTimes(2);
    expect(listDocumentsWindowSpy.mock.calls[0]?.[0]).toBe('messages');
    expect(listDocumentsWindowSpy.mock.calls[0]?.[1]).toEqual(
      expect.arrayContaining([
        expect.stringContaining('sender_id'),
        expect.stringContaining('receiver_id'),
        expect.stringContaining('created_at'),
      ])
    );
    expect(listDocumentsWindowSpy.mock.calls[0]?.[2]).toBe(2);
    expect(listAllDocumentsSpy).not.toHaveBeenCalledWith('messages', []);
    expect(response.error).toBeNull();
    expect(response.data).toEqual([
      {
        id: 'recv-4',
        created_at: '2024-04-04T10:00:00.000Z',
        sender_id: 'you',
        receiver_id: 'me',
        content: 'Newest from you',
        sender: { id: 'you', first_name: 'You', last_name: 'User' },
        receiver: { id: 'me', first_name: 'Me', last_name: 'User' },
      },
    ]);
  });

  it('builds conversations from participant-scoped message queries and exposes full_name', async () => {
    const service = new AppDataService();
    const listAllDocumentsSpy = jest.spyOn(service as any, 'listAllDocuments');
    const fetchByIdsSpy = jest.spyOn(service as any, 'fetchByIds');

    listAllDocumentsSpy.mockImplementation(async (collection: string, queries: string[] = []) => {
      if (collection !== 'messages') {
        return [];
      }

      if (queries.some((query) => query.includes('sender_id'))) {
        return [
          {
            id: 'sent-1',
            created_at: '2024-04-01T10:00:00.000Z',
            sender_id: 'me',
            receiver_id: 'user-1',
            content: 'First hello',
            read_at: '2024-04-01T11:00:00.000Z',
          },
        ];
      }

      if (queries.some((query) => query.includes('receiver_id'))) {
        return [
          {
            id: 'recv-2',
            created_at: '2024-04-03T10:00:00.000Z',
            sender_id: 'user-2',
            receiver_id: 'me',
            content: 'Latest unread',
            read_at: null,
          },
          {
            id: 'recv-1',
            created_at: '2024-04-02T10:00:00.000Z',
            sender_id: 'user-1',
            receiver_id: 'me',
            content: 'Unread follow-up',
            read_at: null,
          },
        ];
      }

      return [];
    });

    fetchByIdsSpy.mockResolvedValue(
      new Map([
        ['user-1', { id: 'user-1', first_name: 'User', last_name: 'One' }],
        ['user-2', { id: 'user-2', first_name: 'User', last_name: 'Two' }],
      ])
    );

    const response = await service.executeCompatRpc('get_conversations', { current_user_id: 'me' });

    expect(listAllDocumentsSpy).toHaveBeenCalledTimes(2);
    expect(listAllDocumentsSpy).not.toHaveBeenCalledWith('messages', []);
    expect(response).toEqual({
      data: [
        {
          conversation_id: 'user-2',
          user_id: 'user-2',
          last_message: 'Latest unread',
          last_message_time: '2024-04-03T10:00:00.000Z',
          unread: 1,
          first_name: 'User',
          last_name: 'Two',
          full_name: 'User Two',
        },
        {
          conversation_id: 'user-1',
          user_id: 'user-1',
          last_message: 'Unread follow-up',
          last_message_time: '2024-04-02T10:00:00.000Z',
          unread: 1,
          first_name: 'User',
          last_name: 'One',
          full_name: 'User One',
        },
      ],
      error: null,
    });
  });

  it('tracks presence for the authenticated user', async () => {
    const service = new AppDataService('session-secret');
    const executeCollectionOperationSpy = jest.spyOn(service, 'executeCollectionOperation').mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await service.executeCompatRpc('track_presence', {
      user_id: 'someone-else',
      online_at: '2024-04-05T12:00:00.000Z',
    });

    expect(createAppwriteSessionAccount).toHaveBeenCalled();
    expect(executeCollectionOperationSpy).toHaveBeenCalledWith('user_presence', {
      action: 'upsert',
      payload: {
        id: 'me',
        user_id: 'me',
        online_at: '2024-04-05T12:00:00.000Z',
      },
    });
    expect(response).toEqual({
      data: {
        user_id: 'me',
        online_at: '2024-04-05T12:00:00.000Z',
      },
      error: null,
    });
  });

  it('returns only active online users and clears stale presence rows', async () => {
    const service = new AppDataService('session-secret');
    const listAllDocumentsSpy = jest.spyOn(service as any, 'listAllDocuments').mockResolvedValue([
      {
        id: 'user-1',
        user_id: 'user-1',
        online_at: new Date(Date.now() - 10_000).toISOString(),
      },
      {
        id: 'user-2',
        user_id: 'user-2',
        online_at: new Date(Date.now() - 120_000).toISOString(),
      },
    ]);
    const executeCollectionOperationSpy = jest.spyOn(service, 'executeCollectionOperation').mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await service.executeCompatRpc('get_online_users');

    expect(listAllDocumentsSpy).toHaveBeenCalledWith('user_presence', [expect.stringContaining('online_at')]);
    expect(executeCollectionOperationSpy).toHaveBeenCalledWith('user_presence', {
      action: 'delete',
      filters: [{ type: 'in', column: 'user_id', value: ['user-2'] }],
    });
    expect(response).toEqual({
      data: [
        {
          user_id: 'user-1',
          online_at: expect.any(String),
        },
      ],
      error: null,
    });
  });

  it('returns null for maybeSingle profile counts when the profile does not exist', async () => {
    const service = new AppDataService();
    const listAllDocumentsSpy = jest.spyOn(service as any, 'listAllDocuments').mockResolvedValue([]);

    const response = await service.executeCollectionOperation('profiles', {
      action: 'select',
      filters: [{ type: 'eq', column: 'id', value: 'missing-user' }],
      select: 'id, first_name, passions_count: profile_passions(count), languages_count: profile_languages(count)',
      maybeSingle: true,
    });

    expect(response).toEqual({ data: null, error: null });
    expect(listAllDocumentsSpy).toHaveBeenCalledTimes(1);
    expect(listAllDocumentsSpy).toHaveBeenCalledWith('profiles', [expect.stringContaining('missing-user')]);
  });

  it('enriches send-push executions with the authenticated actor and normalized fields', async () => {
    const createExecution = jest.fn().mockResolvedValue({});

    (getAppwriteFunctionId as jest.Mock).mockReturnValue('send-push');
    (createAppwriteAdminFunctions as jest.Mock).mockReturnValue({ createExecution });

    const service = new AppDataService('session-secret');

    await service.invokeCompatFunction('send-push', {
      recipient_id: 'user-1',
      title: 'New Message',
      message: 'Hello there',
    });

    expect(createExecution).toHaveBeenCalledWith(
      'send-push',
      JSON.stringify({
        recipient_id: 'user-1',
        title: 'New Message',
        message: 'Hello there',
        actor_id: 'me',
        receiver_id: 'user-1',
        body: 'Hello there',
        notification_type: 'message',
        related_id: 'me',
      }),
      false
    );
  });

  it('preserves fallback notifications when send-push is unresolved but aliases are used', async () => {
    (getAppwriteFunctionId as jest.Mock).mockReturnValue(undefined);
    const service = new AppDataService('session-secret');
    const executeCollectionOperationSpy = jest.spyOn(service, 'executeCollectionOperation').mockResolvedValue({
      data: null,
      error: null,
    });

    await service.invokeCompatFunction('send-push', {
      recipient_id: 'user-1',
      title: 'New Message',
      message: 'Hello there',
    });

    expect(executeCollectionOperationSpy).toHaveBeenCalledWith('notifications', {
      action: 'insert',
      payload: {
        receiver_id: 'user-1',
        actor_id: 'me',
        type: 'message',
        read: false,
        title: 'New Message',
        body: 'Hello there',
        url: null,
        created_at: expect.any(String),
      },
    });
  });
});
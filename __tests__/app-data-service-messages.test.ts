let mockDbResponses: unknown[] = [];
const scheduleResponse = (...values: unknown[]) => { mockDbResponses.push(...values); };

const makeChain = () => {
  const chain = new Proxy({}, {
    get: (_t, prop) => {
      if (prop === 'then') {
        const value = mockDbResponses.shift() || [];
        return (resolve: (v: unknown) => void) => Promise.resolve(value).then(resolve);
      }
      if (prop === 'catch' || prop === 'finally') return (_fn: unknown) => chain;
      return (..._args: unknown[]) => chain;
    },
  });
  return chain;
};

const mockDb = {
  select: () => makeChain(),
  insert: () => makeChain(),
  update: () => makeChain(),
  delete: () => makeChain(),
};

jest.mock('../src/lib/db', () => ({
  getDb: () => mockDb,
  profiles: { id: 'profiles.id' },
  locations: {},
  passions: {},
  languages: {},
  profilePassions: {},
  profileLanguages: {},
  favorites: {},
  blockedUsers: {},
  messages: { id: 'msg.id', sender_id: 'msg.sender_id', receiver_id: 'msg.receiver_id', content: 'msg.content', created_at: 'msg.created_at' },
  userPresence: { user_id: 'up.user_id', last_seen_at: 'up.last_seen_at', is_online: 'up.is_online' },
  savedSearches: {},
  notifications: {},
  reports: {},
  verificationRequests: {},
  pushSubscriptions: {},
  adminSettings: {},
  contactRequests: {},
}));

jest.mock('../src/lib/static-master-data', () => ({ default: { languages: [], passions: [], locations: [] } }));
jest.mock('../src/lib/admin-dashboard', () => ({ DEFAULT_ADMIN_SYSTEM_CONTROLS: { maintenanceBannerText: '', moderationHold: false, followUpUserIds: [], updatedAt: null } }));
jest.mock('../src/lib/profile-age', () => ({ calculateProfileAge: jest.fn(() => 30), normalizeBirthDate: jest.fn((v) => v) }));

const { AppDataService } = require('../src/lib/server/app-data-service');

describe('AppDataService messaging compatibility', () => {
  beforeEach(() => { mockDbResponses = []; jest.clearAllMocks(); });

  it('sendMessage creates a message with correct fields', async () => {
    scheduleResponse(undefined);
    const service = new AppDataService('me');
    const msg = await service.sendMessage('me', 'you', 'Hello!');
    expect(msg.sender_id).toBe('me');
    expect(msg.receiver_id).toBe('you');
    expect(msg.content).toBe('Hello!');
    expect(typeof msg.id).toBe('string');
  });

  it('listMessagesForUser annotates messages with direction', async () => {
    scheduleResponse([
      { id: 'm1', sender_id: 'me', receiver_id: 'you', content: 'Hi', created_at: '2024-01-01', read_at: null },
      { id: 'm2', sender_id: 'you', receiver_id: 'me', content: 'Hey', created_at: '2024-01-02', read_at: null },
    ]);
    scheduleResponse([{ id: 'you', first_name: 'You', last_name: 'User' }]);
    const service = new AppDataService('me');
    const result = await service.listMessagesForUser('me');
    expect(result[0].direction).toBe('sent');
    expect(result[1].direction).toBe('received');
  });

  it('listMessagesForUser returns empty array when no messages', async () => {
    scheduleResponse([]);
    const service = new AppDataService('me');
    expect(await service.listMessagesForUser('me')).toEqual([]);
  });

  it('getMessages delegates to listMessagesForUser', async () => {
    scheduleResponse([]);
    const service = new AppDataService('me');
    const spy = jest.spyOn(service, 'listMessagesForUser').mockResolvedValue([]);
    await service.getMessages('me');
    expect(spy).toHaveBeenCalledWith('me');
  });

  it('listSavedSearches returns empty array when no searches', async () => {
    scheduleResponse([]);
    const service = new AppDataService('me');
    expect(await service.listSavedSearches('me')).toEqual([]);
  });

  it('listSavedSearches returns saved search rows', async () => {
    scheduleResponse([{ id: 's1', user_id: 'me', filters: '{}', created_at: '2024-01-01' }]);
    const service = new AppDataService('me');
    const result = await service.listSavedSearches('me');
    expect(result).toHaveLength(1);
  });
});

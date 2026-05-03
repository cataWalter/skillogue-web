// Drizzle mock: each DB call pops the next value from mockDbResponses
let mockDbResponses: unknown[] = [];
const scheduleResponse = (...values: unknown[]) => { mockDbResponses.push(...values); };

const makeChain = (): any => {
  const chain: any = new Proxy({}, {
    get: (_t, prop: string) => {
      if (prop === 'then') {
        const value = mockDbResponses.shift() ?? [];
        return (resolve: (v: unknown) => unknown) => Promise.resolve(value).then(resolve);
      }
      if (prop === 'catch' || prop === 'finally') {
        return (_fn: unknown) => chain;
      }
      return (..._args: unknown[]) => chain;
    },
  });
  return chain;
};

const mockDb: any = {
  select: (..._args: unknown[]) => makeChain(),
  insert: (..._args: unknown[]) => makeChain(),
  update: (..._args: unknown[]) => makeChain(),
  delete: (..._args: unknown[]) => makeChain(),
};

jest.mock('../src/lib/db', () => ({
  getDb: () => mockDb,
  // re-export schema tables as symbols so imports in AppDataService don't crash
  profiles: { id: 'profiles.id' },
  locations: { id: 'locations.id' },
  passions: { id: 'passions.id' },
  languages: { id: 'languages.id' },
  profilePassions: { profile_id: 'profilePassions.profile_id' },
  profileLanguages: { profile_id: 'profileLanguages.profile_id' },
  favorites: { id: 'favorites.id', user_id: 'favorites.user_id', favorite_id: 'favorites.favorite_id' },
  blockedUsers: { blocker_id: 'blockedUsers.blocker_id', blocked_id: 'blockedUsers.blocked_id' },
  messages: { id: 'messages.id', sender_id: 'messages.sender_id', receiver_id: 'messages.receiver_id' },
  userPresence: { user_id: 'userPresence.user_id' },
  savedSearches: { user_id: 'savedSearches.user_id' },
  notifications: { id: 'notifications.id', receiver_id: 'notifications.receiver_id', actor_id: 'notifications.actor_id' },
  reports: { reporter_id: 'reports.reporter_id', reported_id: 'reports.reported_id' },
  verificationRequests: { user_id: 'verificationRequests.user_id' },
  pushSubscriptions: { user_id: 'pushSubscriptions.user_id', endpoint: 'pushSubscriptions.endpoint' },
  adminSettings: { id: 'adminSettings.id' },
  contactRequests: {},
}));

jest.mock('../src/lib/static-master-data', () => ({
  languages: [{ id: 'lang-1', name: 'English' }],
  passions: [{ id: 'pas-1', name: 'Music' }],
  locations: [{ id: 'loc-1', city: 'Rome', region: 'Lazio', country: 'Italy' }],
}));

jest.mock('../src/lib/admin-dashboard', () => ({
  DEFAULT_ADMIN_SYSTEM_CONTROLS: {
    maintenanceBannerText: '',
    moderationHold: false,
    followUpUserIds: [],
    updatedAt: null,
  },
}));

jest.mock('../src/lib/profile-age', () => ({
  calculateProfileAge: jest.fn(() => 30),
  normalizeBirthDate: jest.fn((v: unknown) => v),
}));

import { AppDataService } from '../src/lib/server/app-data-service';

describe('AppDataService coverage', () => {
  beforeEach(() => {
    mockDbResponses = [];
    jest.clearAllMocks();
  });

  it('requires authentication when userId is missing', async () => {
    const service = new AppDataService(null);
    await expect(service.exportCurrentUserData()).rejects.toThrow('Not authenticated');
  });

  it('listLanguages falls back to static data when DB is empty', async () => {
    scheduleResponse([]); // db.select().from(languages) returns empty array
    const service = new AppDataService('user-1');
    const langs = await service.listLanguages();
    expect(langs).toEqual([{ id: 'lang-1', name: 'English' }]);
  });

  it('listLanguages returns DB rows when available', async () => {
    scheduleResponse([{ id: 'lang-db', name: 'Spanish' }]);
    const service = new AppDataService('user-1');
    const langs = await service.listLanguages();
    expect(langs).toEqual([{ id: 'lang-db', name: 'Spanish' }]);
  });

  it('listPassions falls back to static data when DB is empty', async () => {
    scheduleResponse([]);
    const service = new AppDataService('user-1');
    const passions = await service.listPassions();
    expect(passions).toEqual([{ id: 'pas-1', name: 'Music' }]);
  });

  it('listLocations falls back to static data when DB is empty', async () => {
    scheduleResponse([]);
    const service = new AppDataService('user-1');
    const locs = await service.listLocations();
    expect(locs).toEqual([{ id: 'loc-1', city: 'Rome', region: 'Lazio', country: 'Italy' }]);
  });

  it('getProfile returns null when profile not found', async () => {
    scheduleResponse([]); // profiles query returns empty
    const service = new AppDataService('user-1');
    const result = await service.getProfile('unknown-id');
    expect(result).toBeNull();
  });

  it('getProfile returns profile with passions, languages, and location', async () => {
    const profileRow = {
      id: 'user-1',
      first_name: 'John',
      last_name: 'Doe',
      about_me: null,
      age: null,
      birth_date: '1990-01-01',
      gender: 'male',
      avatar_url: null,
      location_id: 'loc-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    scheduleResponse([profileRow]);                              // profiles query
    scheduleResponse([{ id: 'pas-1', name: 'Music' }]);         // profilePassions join
    scheduleResponse([{ id: 'lang-1', name: 'English' }]);      // profileLanguages join
    scheduleResponse([{ id: 'loc-1', city: 'Rome', region: 'Lazio', country: 'Italy' }]); // locations query

    const service = new AppDataService('user-1');
    const result = await service.getProfile('user-1');

    expect(result).not.toBeNull();
    expect(result?.first_name).toBe('John');
    expect(result?.passions).toEqual(['Music']);
    expect(result?.languages).toEqual(['English']);
    expect(result?.location).toEqual({ id: 'loc-1', city: 'Rome', region: 'Lazio', country: 'Italy' });
  });

  it('sendMessage creates and returns the new message', async () => {
    scheduleResponse(undefined); // insert
    const service = new AppDataService('user-1');
    const msg = await service.sendMessage('user-1', 'user-2', 'Hello!');
    expect(msg.sender_id).toBe('user-1');
    expect(msg.receiver_id).toBe('user-2');
    expect(msg.content).toBe('Hello!');
    expect(msg.id).toBeDefined();
  });

  it('toggleFavorite adds a favorite when not already saved', async () => {
    scheduleResponse([]);   // check existing → not found
    scheduleResponse(undefined); // insert
    const service = new AppDataService('user-1');
    const result = await service.toggleFavorite('user-1', 'user-2');
    expect(result.saved).toBe(true);
  });

  it('toggleFavorite removes a favorite when already saved', async () => {
    scheduleResponse([{ id: 'fav-1', user_id: 'user-1', favorite_id: 'user-2' }]); // existing found
    scheduleResponse(undefined); // delete
    const service = new AppDataService('user-1');
    const result = await service.toggleFavorite('user-1', 'user-2');
    expect(result.saved).toBe(false);
  });

  it('deleteProfile runs cascade deletes and removes the profile', async () => {
    // deleteProfile runs 9 parallel deletes + 1 final profile delete
    for (let i = 0; i < 10; i++) scheduleResponse(undefined);

    const service = new AppDataService('user-1');
    const result = await service.deleteProfile('user-1');
    expect(result).toEqual({ success: true });
  });

  it('constructor accepts undefined userId and exposes it as null', () => {
    const service = new AppDataService(undefined);
    expect((service as any).userId).toBeNull();
  });

  it('getFavorites delegates to loadSavedProfiles and returns empty array when none', async () => {
    scheduleResponse([]); // favorites query returns empty
    const service = new AppDataService('user-1');
    const result = await service.getFavorites('user-1');
    expect(result).toEqual([]);
  });

  it('getFavorites returns hydrated profile rows', async () => {
    scheduleResponse([{ id: 'fav-1', user_id: 'user-1', favorite_id: 'user-2', created_at: '2024-01-01' }]);
    scheduleResponse([{ id: 'user-2', first_name: 'Jane', last_name: 'Doe', gender: 'female', avatar_url: null, birth_date: null, age: 28, location_id: null }]);

    const service = new AppDataService('user-1');
    const result = await service.getFavorites('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].first_name).toBe('Jane');
  });
});

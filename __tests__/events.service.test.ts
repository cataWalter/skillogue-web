const mockRepo = {
    listDocuments: jest.fn(),
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
};

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
    createAppwriteAdminFunctions: jest.fn(() => ({ createExecution: jest.fn() })),
    createAppwriteSessionAccount: jest.fn(() => ({ get: jest.fn() })),
    getAppwriteErrorMessage: jest.fn((error: unknown, fallback: string) =>
        error instanceof Error ? error.message : fallback
    ),
}));

jest.mock('../src/lib/server/appwrite-repo', () => ({
    AppwriteRepository: jest.fn().mockImplementation(() => mockRepo),
}));

import { AppDataService } from '../src/lib/server/app-data-service';

type CollectionFixtures = Record<string, Record<string, unknown>[]>;

const toDocument = (document: Record<string, unknown>) => ({
    $id: String(document.id ?? 'doc-id'),
    ...document,
});

describe('event service methods', () => {
    let collections: CollectionFixtures;

    const createService = () => new AppDataService(undefined, 'jest-test');

    const setCollection = (name: string, documents: Record<string, unknown>[]) => {
        collections[`collection:${name}`] = documents.map(toDocument);
    };

    beforeEach(() => {
        jest.clearAllMocks();
        collections = {};

        mockRepo.listDocuments.mockImplementation(async (collectionId: string) => ({
            documents: collections[collectionId] ?? [],
        }));
        mockRepo.createDocument.mockImplementation(async (_collectionId: string, data: Record<string, unknown>, documentId: string) =>
            toDocument({ ...data, id: documentId })
        );
        mockRepo.updateDocument.mockImplementation(async (_collectionId: string, documentId: string, data: Record<string, unknown>) =>
            toDocument({ id: documentId, ...data })
        );
        mockRepo.deleteDocument.mockResolvedValue(undefined);
    });

    it('only exposes draft events to their creator', async () => {
        setCollection('events', [
            {
                id: 'event-draft',
                creator_id: 'creator-1',
                title: 'Private Draft',
                description: 'Only the creator should see this.',
                location_id: 'location-paris-ile-de-france-france',
                starts_at: '2026-05-10T08:30:00.000Z',
                ends_at: null,
                timezone: 'Europe/Paris',
                capacity: null,
                status: 'draft',
                created_at: '2026-04-01T10:00:00.000Z',
                updated_at: '2026-04-01T10:00:00.000Z',
            },
        ]);
        setCollection('profiles', [
            {
                id: 'creator-1',
                first_name: 'Ada',
                last_name: 'Lovelace',
                verified: true,
            },
        ]);
        setCollection('event_rsvps', []);

        const service = createService();

        await expect(service.getEventForViewer('event-draft', 'viewer-1')).resolves.toBeNull();
        await expect(service.getEventForViewer('event-draft', 'creator-1')).resolves.toEqual(
            expect.objectContaining({
                id: 'event-draft',
                is_owner: true,
                creator: expect.objectContaining({ first_name: 'Ada' }),
            })
        );
    });

    it('filters published events by keyword, date range, and location', async () => {
        setCollection('events', [
            {
                id: 'event-coffee',
                creator_id: 'creator-1',
                title: 'Coffee Walk',
                description: 'Morning coffee and a riverside walk.',
                location_id: 'location-paris-ile-de-france-france',
                starts_at: '2026-05-10T08:30:00.000Z',
                ends_at: null,
                timezone: 'Europe/Paris',
                capacity: 20,
                status: 'published',
                created_at: '2026-04-01T10:00:00.000Z',
                updated_at: '2026-04-01T10:00:00.000Z',
            },
            {
                id: 'event-music',
                creator_id: 'creator-2',
                title: 'Music Night',
                description: 'Live set in Berlin.',
                location_id: 'location-berlin-berlin-germany',
                starts_at: '2026-06-01T18:00:00.000Z',
                ends_at: null,
                timezone: 'Europe/Berlin',
                capacity: 40,
                status: 'published',
                created_at: '2026-04-03T10:00:00.000Z',
                updated_at: '2026-04-03T10:00:00.000Z',
            },
            {
                id: 'event-draft',
                creator_id: 'creator-3',
                title: 'Coffee Draft',
                description: 'Hidden from search.',
                location_id: 'location-paris-ile-de-france-france',
                starts_at: '2026-05-12T09:00:00.000Z',
                ends_at: null,
                timezone: 'Europe/Paris',
                capacity: null,
                status: 'draft',
                created_at: '2026-04-05T10:00:00.000Z',
                updated_at: '2026-04-05T10:00:00.000Z',
            },
        ]);
        setCollection('profiles', [
            { id: 'creator-1', first_name: 'Ada', last_name: 'Lovelace', verified: true },
            { id: 'creator-2', first_name: 'Grace', last_name: 'Hopper', verified: false },
            { id: 'creator-3', first_name: 'Linus', last_name: 'Torvalds', verified: false },
        ]);
        setCollection('event_rsvps', [
            { id: 'rsvp-1', event_id: 'event-coffee', user_id: 'viewer-1', created_at: '2026-04-08T10:00:00.000Z' },
            { id: 'rsvp-2', event_id: 'event-coffee', user_id: 'viewer-2', created_at: '2026-04-08T11:00:00.000Z' },
        ]);

        const service = createService();
        const result = await service.listPublishedEvents(
            {
                query: 'coffee',
                location_id: 'location-paris-ile-de-france-france',
                starts_from: '2026-05-01T00:00:00.000Z',
                starts_to: '2026-05-31T23:59:59.000Z',
                page: 1,
                page_size: 10,
            },
            'viewer-1'
        );

        expect(result.total).toBe(1);
        expect(result.hasMore).toBe(false);
        expect(result.events).toEqual([
            expect.objectContaining({
                id: 'event-coffee',
                attendance_count: 2,
                is_attending: true,
                location: expect.objectContaining({ city: 'Paris' }),
            }),
        ]);
    });

    it('merges created and attending events for the calendar without duplicates', async () => {
        setCollection('events', [
            {
                id: 'event-created-draft',
                creator_id: 'viewer-1',
                title: 'Creator Draft',
                description: '',
                location_id: 'location-paris-ile-de-france-france',
                starts_at: '2026-05-10T08:30:00.000Z',
                ends_at: null,
                timezone: 'Europe/Paris',
                capacity: null,
                status: 'draft',
                created_at: '2026-04-01T10:00:00.000Z',
                updated_at: '2026-04-01T10:00:00.000Z',
            },
            {
                id: 'event-created-published',
                creator_id: 'viewer-1',
                title: 'Creator Published',
                description: '',
                location_id: 'location-paris-ile-de-france-france',
                starts_at: '2026-05-11T08:30:00.000Z',
                ends_at: null,
                timezone: 'Europe/Paris',
                capacity: null,
                status: 'published',
                created_at: '2026-04-02T10:00:00.000Z',
                updated_at: '2026-04-02T10:00:00.000Z',
            },
            {
                id: 'event-attending',
                creator_id: 'creator-2',
                title: 'Attending Elsewhere',
                description: '',
                location_id: 'location-berlin-berlin-germany',
                starts_at: '2026-05-12T18:00:00.000Z',
                ends_at: null,
                timezone: 'Europe/Berlin',
                capacity: null,
                status: 'published',
                created_at: '2026-04-03T10:00:00.000Z',
                updated_at: '2026-04-03T10:00:00.000Z',
            },
        ]);
        setCollection('profiles', [
            { id: 'viewer-1', first_name: 'Ada', last_name: 'Lovelace', verified: true },
            { id: 'creator-2', first_name: 'Grace', last_name: 'Hopper', verified: false },
        ]);
        setCollection('event_rsvps', [
            { id: 'rsvp-1', event_id: 'event-created-published', user_id: 'viewer-1', created_at: '2026-04-08T10:00:00.000Z' },
            { id: 'rsvp-2', event_id: 'event-attending', user_id: 'viewer-1', created_at: '2026-04-08T11:00:00.000Z' },
        ]);

        const service = createService();
        const events = await service.listCalendarEventsForUser('viewer-1');

        expect(events.map((event) => event.id)).toEqual([
            'event-created-draft',
            'event-created-published',
            'event-attending',
        ]);
    });

    it('rejects updates from non-owners', async () => {
        setCollection('events', [
            {
                id: 'event-1',
                creator_id: 'creator-1',
                title: 'Owner Event',
                description: '',
                location_id: 'location-paris-ile-de-france-france',
                starts_at: '2026-05-10T08:30:00.000Z',
                ends_at: null,
                timezone: 'Europe/Paris',
                capacity: null,
                status: 'draft',
                created_at: '2026-04-01T10:00:00.000Z',
                updated_at: '2026-04-01T10:00:00.000Z',
            },
        ]);
        setCollection('profiles', []);
        setCollection('event_rsvps', []);

        const service = createService();

        await expect(
            service.updateEvent('viewer-1', {
                id: 'event-1',
                title: 'Edited Event',
                description: 'Updated copy',
                location_id: 'location-paris-ile-de-france-france',
                starts_at: '2026-05-10T08:30:00.000Z',
                ends_at: null,
                timezone: 'Europe/Paris',
                capacity: 10,
            })
        ).rejects.toThrow('Only the event creator can modify this event');
        expect(mockRepo.updateDocument).not.toHaveBeenCalled();
    });

    it('prevents duplicate RSVP rows from being created', async () => {
        setCollection('events', [
            {
                id: 'event-1',
                creator_id: 'creator-1',
                title: 'Already Attending',
                description: '',
                location_id: 'location-paris-ile-de-france-france',
                starts_at: '2026-05-10T08:30:00.000Z',
                ends_at: null,
                timezone: 'Europe/Paris',
                capacity: 10,
                status: 'published',
                created_at: '2026-04-01T10:00:00.000Z',
                updated_at: '2026-04-01T10:00:00.000Z',
            },
        ]);
        setCollection('profiles', [
            { id: 'creator-1', first_name: 'Ada', last_name: 'Lovelace', verified: true },
        ]);
        setCollection('event_rsvps', [
            { id: 'rsvp-1', event_id: 'event-1', user_id: 'viewer-1', created_at: '2026-04-08T10:00:00.000Z' },
        ]);

        const service = createService();
        const result = await service.setEventRsvp('viewer-1', 'event-1');

        expect(mockRepo.createDocument).not.toHaveBeenCalled();
        expect(result).toEqual(
            expect.objectContaining({
                id: 'event-1',
                is_attending: true,
                attendance_count: 1,
            })
        );
    });

    it('treats missing event collections as empty read slices', async () => {
        mockRepo.listDocuments.mockImplementation(async (collectionId: string) => {
            if (collectionId === 'collection:events' || collectionId === 'collection:event_rsvps') {
                const error = new Error(`Collection with the requested ID '${collectionId.replace('collection:', '')}' could not be found.`) as Error & {
                    code?: number;
                    type?: string;
                };
                error.code = 404;
                error.type = 'collection_not_found';
                throw error;
            }

            return { documents: collections[collectionId] ?? [] };
        });

        const service = createService();

        await expect(service.listPublishedEvents({}, 'viewer-1')).resolves.toEqual({
            events: [],
            total: 0,
            page: 1,
            pageSize: 12,
            hasMore: false,
        });
        await expect(service.listCreatorEvents('viewer-1')).resolves.toEqual([]);
        await expect(service.listCalendarEventsForUser('viewer-1')).resolves.toEqual([]);
        await expect(service.getEventForViewer('event-1', 'viewer-1')).resolves.toBeNull();
    });
});

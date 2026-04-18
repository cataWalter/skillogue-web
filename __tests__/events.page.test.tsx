import { render, screen } from '@testing-library/react';
import EventsPage from '../src/app/events/page';

const listLocations = jest.fn();
const listPublishedEvents = jest.fn();
const mockRedirect = jest.fn();

jest.mock('../src/lib/server/current-user', () => ({
  getCurrentUserFromCookies: jest.fn(),
}));

jest.mock('../src/lib/server/app-data-service', () => ({
  AppDataService: jest.fn().mockImplementation(() => ({
    listLocations,
    listPublishedEvents,
  })),
}));

jest.mock('../src/components/events/EventRsvpButton', () => ({
  __esModule: true,
  default: ({ eventId, isAttending }: { eventId: string; isAttending: boolean }) => (
    <button type="button">{isAttending ? `leave-${eventId}` : `join-${eventId}`}</button>
  ),
}));

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error('NEXT_REDIRECT');
  },
}));

describe('EventsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { getCurrentUserFromCookies } = require('../src/lib/server/current-user');
    getCurrentUserFromCookies.mockResolvedValue({ id: 'user-1' });
    listLocations.mockResolvedValue([
      {
        id: 'location-paris-ile-de-france-france',
        city: 'Paris',
        region: 'Ile-de-France',
        country: 'France',
      },
    ]);
    listPublishedEvents.mockResolvedValue({
      events: [
        {
          id: 'event-1',
          title: 'Coffee Walk',
          description: 'Morning coffee and a riverside walk.',
          starts_at: '2026-05-10T06:30:00.000Z',
          ends_at: null,
          timezone: 'Europe/Paris',
          location: {
            id: 'location-paris-ile-de-france-france',
            city: 'Paris',
            region: 'Ile-de-France',
            country: 'France',
          },
          creator: {
            id: 'creator-1',
            first_name: 'Ada',
            last_name: 'Lovelace',
          },
          attendance_count: 3,
          is_attending: true,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 12,
      hasMore: false,
    });
  });

  it('renders event discovery results for authenticated users', async () => {
    const component = await EventsPage({
      searchParams: Promise.resolve({
        query: 'coffee',
        location_id: 'location-paris-ile-de-france-france',
      }),
    });

    render(component);

    expect(screen.getByRole('heading', { name: 'Discover Events' })).toBeInTheDocument();
    expect(screen.getByText('Coffee Walk')).toBeInTheDocument();
    expect(screen.getByText('Hosted by Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('3 attending')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'leave-event-1' })).toBeInTheDocument();
    expect(listPublishedEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'coffee',
        location_id: 'location-paris-ile-de-france-france',
      }),
      'user-1'
    );
  });

  it('normalizes array search params, falls back invalid filters, and renders pagination links', async () => {
    listPublishedEvents.mockResolvedValueOnce({
      events: [
        {
          id: 'event-2',
          title: 'Walk Club',
          description: '',
          starts_at: '2026-05-11T06:30:00.000Z',
          ends_at: null,
          timezone: 'Europe/Paris',
          location: {
            id: 'location-paris-ile-de-france-france',
            city: 'Paris',
            region: 'Ile-de-France',
            country: 'France',
          },
          creator: {
            id: 'creator-2',
            first_name: null,
            last_name: null,
          },
          attendance_count: 5,
          is_attending: false,
        },
      ],
      total: 13,
      page: 2,
      pageSize: 12,
      hasMore: true,
    });

    const component = await EventsPage({
      searchParams: Promise.resolve({
        query: ['coffee', 'ignored'],
        location_id: ['location-paris-ile-de-france-france'],
        starts_from_date: ['2026-05-01'],
        starts_to_date: ['2026-05-31'],
        page: ['not-a-number'],
      }),
    });

    render(component);

    expect(listPublishedEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        page_size: 12,
      }),
      'user-1'
    );
    expect(screen.getByDisplayValue('coffee')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-05-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-05-31')).toBeInTheDocument();
    expect(screen.getByText('No description provided.')).toBeInTheDocument();
    expect(screen.getByText('Hosted by Unknown creator')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'join-event-2' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Previous page' })).toHaveAttribute(
      'href',
      '/events?query=coffee&location_id=location-paris-ile-de-france-france&starts_from_date=2026-05-01&starts_to_date=2026-05-31'
    );
    expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute(
      'href',
      '/events?query=coffee&location_id=location-paris-ile-de-france-france&starts_from_date=2026-05-01&starts_to_date=2026-05-31&page=3'
    );
  });

  it('renders the empty state when no events match the filters', async () => {
    listPublishedEvents.mockResolvedValueOnce({
      events: [],
      total: 0,
      page: 1,
      pageSize: 12,
      hasMore: false,
    });

    const component = await EventsPage({
      searchParams: Promise.resolve({
        query: 'quiet meetup',
      }),
    });

    render(component);

    expect(screen.getByText('No events found.')).toBeInTheDocument();
    expect(screen.getByText('Try another keyword, date range, or location.')).toBeInTheDocument();
  });

  it('defaults missing search params and builds clean pagination links without filters', async () => {
    listPublishedEvents.mockResolvedValueOnce({
      events: [
        {
          id: 'event-3',
          title: 'Cafe Writing Session',
          description: 'Write together over coffee.',
          starts_at: '2026-05-12T08:30:00.000Z',
          ends_at: null,
          timezone: 'Europe/Paris',
          location: {
            id: 'location-paris-ile-de-france-france',
            city: 'Paris',
            region: 'Ile-de-France',
            country: 'France',
          },
          creator: {
            id: 'creator-3',
            first_name: 'Grace',
            last_name: 'Hopper',
          },
          attendance_count: 4,
          is_attending: false,
        },
      ],
      total: 13,
      page: 2,
      pageSize: 12,
      hasMore: false,
    });

    const component = await EventsPage({});

    render(component);

    expect(listPublishedEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        query: '',
        page: 1,
        page_size: 12,
      }),
      'user-1'
    );
    expect(screen.getByRole('link', { name: 'Previous page' })).toHaveAttribute('href', '/events');
  });

  it('redirects unauthenticated users to login', async () => {
    const { getCurrentUserFromCookies } = require('../src/lib/server/current-user');
    getCurrentUserFromCookies.mockResolvedValueOnce(null);

    await expect(EventsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });
});
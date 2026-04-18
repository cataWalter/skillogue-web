import { fireEvent, render, screen } from '@testing-library/react';
import CalendarView from '../src/components/events/CalendarView';
import { eventCopy } from '../src/lib/app-copy';
import type { EventSummary } from '../src/types/events';

describe('CalendarView', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-15T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const events: EventSummary[] = [
    {
      id: 'event-created',
      creator_id: 'user-1',
      title: 'Creator Meetup',
      description: 'Planning session',
      location_id: 'location-paris-ile-de-france-france',
      starts_at: '2026-05-15T08:00:00.000Z',
      ends_at: null,
      timezone: 'Europe/Paris',
      capacity: null,
      status: 'published',
      created_at: '2026-04-01T10:00:00.000Z',
      updated_at: '2026-04-01T10:00:00.000Z',
      creator: {
        id: 'user-1',
        first_name: 'Ada',
        last_name: 'Lovelace',
      },
      location: {
        id: 'location-paris-ile-de-france-france',
        city: 'Paris',
        region: 'Ile-de-France',
        country: 'France',
      },
      attendance_count: 2,
      is_attending: false,
      is_owner: true,
    },
    {
      id: 'event-attending',
      creator_id: 'user-2',
      title: 'Attending Elsewhere',
      description: 'Open meetup',
      location_id: 'location-paris-ile-de-france-france',
      starts_at: '2026-05-15T18:00:00.000Z',
      ends_at: null,
      timezone: 'Europe/Paris',
      capacity: null,
      status: 'published',
      created_at: '2026-04-02T10:00:00.000Z',
      updated_at: '2026-04-02T10:00:00.000Z',
      creator: {
        id: 'user-2',
        first_name: 'Grace',
        last_name: 'Hopper',
      },
      location: {
        id: 'location-paris-ile-de-france-france',
        city: 'Paris',
        region: 'Ile-de-France',
        country: 'France',
      },
      attendance_count: 4,
      is_attending: true,
      is_owner: false,
    },
  ];

  it('renders the selected day panel with events on the active day', () => {
    render(<CalendarView events={events} />);

    expect(screen.getByText('Creator Meetup')).toBeInTheDocument();
    expect(screen.getByText('Attending Elsewhere')).toBeInTheDocument();
    expect(screen.getByText('2 events on this day.')).toBeInTheDocument();
  });

  it('filters the calendar down to attending events', () => {
    render(<CalendarView events={events} />);

    fireEvent.click(screen.getByRole('button', { name: 'Attending' }));

    expect(screen.queryByText('Creator Meetup')).not.toBeInTheDocument();
    expect(screen.getByText('Attending Elsewhere')).toBeInTheDocument();
  });

  it('filters the calendar down to created events', () => {
    render(<CalendarView events={events} />);

    fireEvent.click(screen.getByRole('button', { name: 'Created' }));

    expect(screen.getByText('Creator Meetup')).toBeInTheDocument();
    expect(screen.queryByText('Attending Elsewhere')).not.toBeInTheDocument();
    expect(screen.getByText('1 events on this day.')).toBeInTheDocument();
  });

  it('ignores events that cannot be mapped to a local calendar day', () => {
    const invalidDayEvent: EventSummary = {
      ...events[0],
      id: 'event-invalid-day',
      title: 'Broken Local Day',
      starts_at: 'not-a-date',
    };

    render(<CalendarView events={[...events, invalidDayEvent]} />);

    expect(screen.queryByText('Broken Local Day')).not.toBeInTheDocument();
    expect(screen.getByText('2 events on this day.')).toBeInTheDocument();
  });

  it('shows the empty-day panel when a day without events is selected', () => {
    render(<CalendarView events={events} />);

    fireEvent.click(screen.getByRole('button', { name: '14' }));

    expect(screen.getByText('2026-05-14')).toBeInTheDocument();
    expect(screen.getByText('0 events on this day.')).toBeInTheDocument();
    expect(screen.getByText(eventCopy.calendar.emptyDay)).toBeInTheDocument();
  });

  it('resets the selected day to the first day with events when returning to a month', () => {
    render(<CalendarView events={events} />);

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));

    expect(screen.getByText(eventCopy.calendar.emptyDay)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('2026-05-15')).toBeInTheDocument();
    expect(screen.getByText('Creator Meetup')).toBeInTheDocument();
    expect(screen.getByText('Attending Elsewhere')).toBeInTheDocument();
  });
});
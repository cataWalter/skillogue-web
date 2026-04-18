import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import toast from 'react-hot-toast';
import EventForm from '../../../src/components/events/EventForm';
import { createEventAction, updateEventAction } from '../../../src/app/actions/events';
import { eventCopy } from '../../../src/lib/app-copy';
import {
  convertLocalDateTimeToUtcIso,
  formatUtcIsoForDateTimeInput,
} from '../../../src/lib/events/datetime';

const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

jest.mock('../../../src/app/actions/events', () => ({
  createEventAction: jest.fn(),
  updateEventAction: jest.fn(),
}));

jest.mock('../../../src/lib/events/datetime', () => ({
  convertLocalDateTimeToUtcIso: jest.fn(),
  formatUtcIsoForDateTimeInput: jest.fn(),
  getTimeZoneOptions: jest.fn(() => ['UTC', 'Europe/Berlin']),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockCreateEventAction = createEventAction as jest.MockedFunction<typeof createEventAction>;
const mockUpdateEventAction = updateEventAction as jest.MockedFunction<typeof updateEventAction>;
const mockConvertLocalDateTimeToUtcIso =
  convertLocalDateTimeToUtcIso as jest.MockedFunction<typeof convertLocalDateTimeToUtcIso>;
const mockFormatUtcIsoForDateTimeInput =
  formatUtcIsoForDateTimeInput as jest.MockedFunction<typeof formatUtcIsoForDateTimeInput>;

describe('EventForm', () => {
  const locations = [
    {
      id: 'berlin-germany',
      city: 'Berlin',
      region: 'Berlin',
      country: 'Germany',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockConvertLocalDateTimeToUtcIso.mockImplementation((value) =>
      value ? `${value}:00.000Z` : null
    );
    mockFormatUtcIsoForDateTimeInput.mockImplementation((value) => {
      if (value === '2026-05-02T12:00:00.000Z') {
        return '2026-05-02T12:00';
      }

      return '2026-05-02T10:00';
    });
  });

  it('keeps event fields labelable and supplies autofill metadata', () => {
    const { container } = render(<EventForm locations={locations} />);

    expect(screen.getByLabelText(eventCopy.fields.title)).toHaveAttribute('name', 'title');
    expect(screen.getByLabelText(eventCopy.fields.title)).toHaveAttribute('autocomplete', 'off');

    expect(screen.getByLabelText(eventCopy.fields.description)).toHaveAttribute('name', 'description');
    expect(screen.getByLabelText(eventCopy.fields.description)).toHaveAttribute('autocomplete', 'off');

    expect(screen.getByLabelText('Country')).toHaveAttribute('name', 'country');
    expect(screen.getByLabelText('Country')).toHaveAttribute('autocomplete', 'country-name');

    expect(screen.getByLabelText('Region')).toHaveAttribute('name', 'region');
    expect(screen.getByLabelText('Region')).toHaveAttribute('autocomplete', 'address-level1');

    expect(screen.getByLabelText(eventCopy.fields.location)).toHaveAttribute('name', 'location_id');
    expect(screen.getByLabelText(eventCopy.fields.location)).toHaveAttribute('autocomplete', 'address-level2');

    expect(screen.getByLabelText(eventCopy.fields.startsAt)).toHaveAttribute('name', 'starts_at');
    expect(screen.getByLabelText(eventCopy.fields.startsAt)).toHaveAttribute('autocomplete', 'off');

    expect(screen.getByLabelText(eventCopy.fields.endsAt)).toHaveAttribute('name', 'ends_at');
    expect(screen.getByLabelText(eventCopy.fields.endsAt)).toHaveAttribute('autocomplete', 'off');

    expect(screen.getByLabelText(eventCopy.fields.timezone)).toHaveAttribute('name', 'timezone');
    expect(screen.getByLabelText(eventCopy.fields.timezone)).toHaveAttribute('autocomplete', 'off');

    expect(screen.getByLabelText(eventCopy.fields.capacity)).toHaveAttribute('name', 'capacity');
    expect(screen.getByLabelText(eventCopy.fields.capacity)).toHaveAttribute('autocomplete', 'off');

    expect(
      container.querySelectorAll(
        'input[name]:not([autocomplete]), textarea[name]:not([autocomplete]), select[name]:not([autocomplete])'
      )
    ).toHaveLength(0);
  });

  it('falls back to UTC when the browser does not report a default timezone', () => {
    const dateTimeFormatSpy = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ timeZone: '' }),
        } as Intl.DateTimeFormat)
    );

    try {
      render(<EventForm locations={locations} />);

      expect(screen.getByLabelText(eventCopy.fields.timezone)).toHaveValue('UTC');
    } finally {
      dateTimeFormatSpy.mockRestore();
    }
  });

  it('creates an event and refreshes the manager view', async () => {
    const onSaved = jest.fn();

    mockCreateEventAction.mockResolvedValue({
      success: true,
      event: { id: 'event-123' },
    } as Awaited<ReturnType<typeof createEventAction>>);

    render(<EventForm locations={locations} onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText(eventCopy.fields.title), {
      target: { value: 'Community supper' },
    });
    fireEvent.change(screen.getByLabelText(eventCopy.fields.description), {
      target: { value: 'Bring a favorite recipe to share.' },
    });
    fireEvent.change(screen.getByLabelText('Country'), {
      target: { value: 'Germany' },
    });
    fireEvent.change(screen.getByLabelText('Region'), {
      target: { value: 'Berlin' },
    });
    fireEvent.change(screen.getByLabelText(eventCopy.fields.location), {
      target: { value: 'berlin-germany' },
    });
    fireEvent.change(screen.getByLabelText(eventCopy.fields.startsAt), {
      target: { value: '2026-05-01T10:00' },
    });
    fireEvent.change(screen.getByLabelText(eventCopy.fields.endsAt), {
      target: { value: '2026-05-01T12:00' },
    });
    fireEvent.change(screen.getByLabelText(eventCopy.fields.timezone), {
      target: { value: 'UTC' },
    });
    fireEvent.change(screen.getByLabelText(eventCopy.fields.capacity), {
      target: { value: '40' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit event form' }));

    await waitFor(() => {
      expect(mockCreateEventAction).toHaveBeenCalledWith({
        title: 'Community supper',
        description: 'Bring a favorite recipe to share.',
        location_id: 'berlin-germany',
        starts_at: '2026-05-01T10:00:00.000Z',
        ends_at: '2026-05-01T12:00:00.000Z',
        timezone: 'UTC',
        capacity: '40',
        status: 'draft',
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Event created.');
      expect(onSaved).toHaveBeenCalledWith('event-123');
      expect(mockRefresh).toHaveBeenCalled();
    });

    expect(screen.getByText('Event created.')).toBeInTheDocument();
  });

  it('prefills edit mode, updates the event, and lets managers cancel', async () => {
    const onSaved = jest.fn();
    const onCancel = jest.fn();
    const initialEvent = {
      id: 'event-55',
      title: 'Existing event',
      description: 'Original event description',
      location_id: 'berlin-germany',
      starts_at: '2026-05-02T10:00:00.000Z',
      ends_at: '2026-05-02T12:00:00.000Z',
      timezone: 'UTC',
      capacity: 20,
      status: 'published',
    } as any;

    mockUpdateEventAction.mockResolvedValue({
      success: true,
      event: { id: 'event-55' },
    } as Awaited<ReturnType<typeof updateEventAction>>);

    render(
      <EventForm
        locations={locations}
        initialEvent={initialEvent}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    );

    expect(screen.getByLabelText(eventCopy.fields.title)).toHaveValue('Existing event');
    expect(screen.getByLabelText(eventCopy.fields.description)).toHaveValue('Original event description');
    expect(screen.getByLabelText('Country')).toHaveValue('Germany');
    expect(screen.getByLabelText('Region')).toHaveValue('Berlin');
    expect(screen.getByLabelText(eventCopy.fields.location)).toHaveValue('berlin-germany');
    expect(screen.getByLabelText(eventCopy.fields.startsAt)).toHaveValue('2026-05-02T10:00');
    expect(screen.getByLabelText(eventCopy.fields.endsAt)).toHaveValue('2026-05-02T12:00');
    expect(screen.getByLabelText(eventCopy.fields.capacity)).toHaveValue(20);
    expect(screen.getByText(eventCopy.status.published)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: eventCopy.actions.backToManager }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText(eventCopy.fields.title), {
      target: { value: 'Updated event' },
    });
    fireEvent.change(screen.getByLabelText(eventCopy.fields.capacity), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: eventCopy.actions.save }));

    await waitFor(() => {
      expect(mockUpdateEventAction).toHaveBeenCalledWith({
        id: 'event-55',
        title: 'Updated event',
        description: 'Original event description',
        location_id: 'berlin-germany',
        starts_at: '2026-05-02T10:00:00.000Z',
        ends_at: '2026-05-02T12:00:00.000Z',
        timezone: 'UTC',
        capacity: null,
        status: 'published',
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Event updated.');
      expect(onSaved).toHaveBeenCalledWith('event-55');
    });
  });

  it('keeps location selectors blank when the initial event location is no longer in the catalog', () => {
    const initialEvent = {
      id: 'event-missing-location',
      title: 'Detached event',
      description: 'The saved location was removed.',
      location_id: 'missing-location',
      starts_at: '2026-05-02T10:00:00.000Z',
      ends_at: null,
      timezone: 'UTC',
      capacity: null,
      status: 'draft',
    } as any;

    render(<EventForm locations={locations} initialEvent={initialEvent} />);

    expect(screen.getByLabelText('Country')).toHaveValue('');
    expect(screen.getByLabelText('Region')).toHaveValue('');
    expect(screen.getByLabelText(eventCopy.fields.location)).toHaveValue('');
  });

  it('shows validation errors when datetime values cannot be converted', async () => {
    render(<EventForm locations={locations} />);

    fireEvent.change(screen.getByLabelText(eventCopy.fields.startsAt), {
      target: { value: '2026-05-01T10:00' },
    });

    mockConvertLocalDateTimeToUtcIso.mockReturnValueOnce(null);
    fireEvent.click(screen.getByRole('button', { name: 'Submit event form' }));

    expect(await screen.findByText('Start date/time must be a valid value.')).toBeInTheDocument();
    expect(mockCreateEventAction).not.toHaveBeenCalled();

    mockConvertLocalDateTimeToUtcIso.mockImplementation((value) =>
      value === '2026-05-01T12:00' ? null : `${value}:00.000Z`
    );
    fireEvent.change(screen.getByLabelText(eventCopy.fields.endsAt), {
      target: { value: '2026-05-01T12:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit event form' }));

    expect(await screen.findByText('End date/time must be a valid value.')).toBeInTheDocument();
    expect(mockCreateEventAction).not.toHaveBeenCalled();
  });

  it('surfaces action errors from validation details', async () => {
    mockCreateEventAction.mockResolvedValue({
      success: false,
      error: 'Validation failed',
      details: {
        title: ['Title is required.'],
        location_id: ['Choose a city.'],
      },
    } as Awaited<ReturnType<typeof createEventAction>>);

    render(<EventForm locations={locations} />);

    fireEvent.change(screen.getByLabelText(eventCopy.fields.startsAt), {
      target: { value: '2026-05-01T10:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit event form' }));

    expect(await screen.findByText('Title is required. Choose a city.')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Title is required. Choose a city.');
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('surfaces action errors when the action returns an error without validation details', async () => {
    mockCreateEventAction.mockResolvedValue({
      success: false,
      error: 'Plain failure',
    } as Awaited<ReturnType<typeof createEventAction>>);

    render(<EventForm locations={locations} />);

    fireEvent.change(screen.getByLabelText(eventCopy.fields.startsAt), {
      target: { value: '2026-05-01T10:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit event form' }));

    expect(await screen.findByText('Plain failure')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Plain failure');
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('falls back to a generic save error when the action returns no details or error', async () => {
    mockCreateEventAction.mockResolvedValue({
      success: false,
    } as Awaited<ReturnType<typeof createEventAction>>);

    render(<EventForm locations={locations} />);

    fireEvent.change(screen.getByLabelText(eventCopy.fields.startsAt), {
      target: { value: '2026-05-01T10:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit event form' }));

    expect(await screen.findByText('Unable to save event.')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Unable to save event.');
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('passes null to onSaved when the action succeeds without an event id', async () => {
    const onSaved = jest.fn();

    mockCreateEventAction.mockResolvedValue({
      success: true,
      event: null,
    } as Awaited<ReturnType<typeof createEventAction>>);

    render(<EventForm locations={locations} onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText(eventCopy.fields.startsAt), {
      target: { value: '2026-05-01T10:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit event form' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Event created.');
      expect(onSaved).toHaveBeenCalledWith(null);
      expect(mockRefresh).toHaveBeenCalled();
    });

    expect(screen.getByText('Event created.')).toBeInTheDocument();
  });
});
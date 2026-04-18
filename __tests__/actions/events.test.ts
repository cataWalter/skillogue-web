import {
  createEventAction,
  cancelEventAction,
  removeEventRsvpAction,
  publishEventAction,
  updateEventAction,
  setEventRsvpAction,
} from '../../src/app/actions/events';

const createEvent = jest.fn();
const updateEvent = jest.fn();
const cancelEvent = jest.fn();
const removeEventRsvp = jest.fn();
const publishEvent = jest.fn();
const setEventRsvp = jest.fn();

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('../../src/lib/server/current-user', () => ({
  getCurrentUserFromCookies: jest.fn(),
}));

jest.mock('../../src/lib/server/app-data-service', () => ({
  AppDataService: jest.fn().mockImplementation(() => ({
    createEvent,
    updateEvent,
    cancelEvent,
    removeEventRsvp,
    publishEvent,
    setEventRsvp,
  })),
}));

describe('event actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { getCurrentUserFromCookies } = require('../../src/lib/server/current-user');
    getCurrentUserFromCookies.mockResolvedValue({ id: 'user-1' });
    createEvent.mockResolvedValue({ id: 'event-1' });
    updateEvent.mockResolvedValue({ id: 'event-1', status: 'published' });
    cancelEvent.mockResolvedValue({ id: 'event-1', status: 'cancelled' });
    removeEventRsvp.mockResolvedValue({ id: 'event-1', is_attending: false });
    publishEvent.mockResolvedValue({ id: 'event-1', status: 'published' });
    setEventRsvp.mockResolvedValue({ id: 'event-1', is_attending: true });
  });

  it('returns validation failures for invalid create payloads', async () => {
    const result = await createEventAction({
      title: '',
      description: '',
      location_id: 'unknown-location',
      starts_at: 'not-a-datetime',
      timezone: 'UTC',
      capacity: null,
      status: 'draft',
    } as any);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
  });

  it('creates an event and revalidates the event surfaces', async () => {
    const { revalidatePath } = require('next/cache');

    const result = await createEventAction({
      title: 'Sunrise Walk',
      description: 'Meet at the park gate.',
      location_id: 'location-paris-ile-de-france-france',
      starts_at: '2026-05-10T06:30:00.000Z',
      ends_at: '2026-05-10T08:00:00.000Z',
      timezone: 'Europe/Paris',
      capacity: 12,
      status: 'draft',
    });

    expect(result.success).toBe(true);
    expect(createEvent).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ title: 'Sunrise Walk', location_id: 'location-paris-ile-de-france-france' })
    );
    expect(revalidatePath).toHaveBeenCalledWith('/events');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/events');
    expect(revalidatePath).toHaveBeenCalledWith('/calendar');
    expect(revalidatePath).toHaveBeenCalledWith('/events/event-1');
  });

  it('normalizes nullable create fields and returns an undefined event when the service returns null', async () => {
    const { revalidatePath } = require('next/cache');
    createEvent.mockResolvedValueOnce(null);

    const result = await createEventAction({
      title: 'Quiet Meetup',
      description: 'Bring a book.',
      location_id: 'location-paris-ile-de-france-france',
      starts_at: '2026-05-10T06:30:00.000Z',
      timezone: 'Europe/Paris',
      status: 'draft',
    } as any);

    expect(result).toEqual({ success: true, event: undefined });
    expect(createEvent).toHaveBeenCalledWith('user-1', {
      title: 'Quiet Meetup',
      description: 'Bring a book.',
      location_id: 'location-paris-ile-de-france-france',
      starts_at: '2026-05-10T06:30:00.000Z',
      ends_at: null,
      timezone: 'Europe/Paris',
      capacity: null,
      status: 'draft',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/events');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/events');
    expect(revalidatePath).toHaveBeenCalledWith('/calendar');
    expect(revalidatePath).not.toHaveBeenCalledWith('/events/null');
  });

  it('returns the create fallback message for non-Error failures', async () => {
    createEvent.mockRejectedValueOnce('unexpected failure');

    const result = await createEventAction({
      title: 'Sunrise Walk',
      description: 'Meet at the park gate.',
      location_id: 'location-paris-ile-de-france-france',
      starts_at: '2026-05-10T06:30:00.000Z',
      ends_at: '2026-05-10T08:00:00.000Z',
      timezone: 'Europe/Paris',
      capacity: 12,
      status: 'draft',
    });

    expect(result).toEqual({ success: false, error: 'Failed to create event' });
  });

  it('updates an event and revalidates the event surfaces', async () => {
    const { revalidatePath } = require('next/cache');

    const result = await updateEventAction({
      id: 'event-1',
      title: 'Sunset Walk',
      description: 'Meet at the park gate.',
      location_id: 'location-paris-ile-de-france-france',
      starts_at: '2026-05-10T06:30:00.000Z',
      ends_at: '2026-05-10T08:00:00.000Z',
      timezone: 'Europe/Paris',
      capacity: 12,
      status: 'published',
    } as any);

    expect(result.success).toBe(true);
    expect(updateEvent).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ id: 'event-1', title: 'Sunset Walk' })
    );
    expect(revalidatePath).toHaveBeenCalledWith('/events');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/events');
    expect(revalidatePath).toHaveBeenCalledWith('/calendar');
    expect(revalidatePath).toHaveBeenCalledWith('/events/event-1');
  });

  it('normalizes nullable update fields and returns an undefined event when the service returns null', async () => {
    const { revalidatePath } = require('next/cache');
    updateEvent.mockResolvedValueOnce(null);

    const result = await updateEventAction({
      id: 'event-1',
      title: 'Sunset Walk',
      description: 'Meet at the park gate.',
      location_id: 'location-paris-ile-de-france-france',
      starts_at: '2026-05-10T06:30:00.000Z',
      timezone: 'Europe/Paris',
      status: 'published',
    } as any);

    expect(result).toEqual({ success: true, event: undefined });
    expect(updateEvent).toHaveBeenCalledWith('user-1', {
      id: 'event-1',
      title: 'Sunset Walk',
      description: 'Meet at the park gate.',
      location_id: 'location-paris-ile-de-france-france',
      starts_at: '2026-05-10T06:30:00.000Z',
      ends_at: null,
      timezone: 'Europe/Paris',
      capacity: null,
    });
    expect(revalidatePath).toHaveBeenCalledWith('/events/event-1');
  });

  it('cancels an event and revalidates the event surfaces', async () => {
    const { revalidatePath } = require('next/cache');

    const result = await cancelEventAction('event-1');

    expect(result.success).toBe(true);
    expect(cancelEvent).toHaveBeenCalledWith('user-1', 'event-1');
    expect(revalidatePath).toHaveBeenCalledWith('/events');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/events');
    expect(revalidatePath).toHaveBeenCalledWith('/calendar');
    expect(revalidatePath).toHaveBeenCalledWith('/events/event-1');
  });

  it('returns an undefined event when cancelling yields no event payload', async () => {
    cancelEvent.mockResolvedValueOnce(null);

    const result = await cancelEventAction('event-1');

    expect(result).toEqual({ success: true, event: undefined });
    expect(cancelEvent).toHaveBeenCalledWith('user-1', 'event-1');
  });

  it('removes an RSVP and revalidates the event surfaces', async () => {
    const { revalidatePath } = require('next/cache');

    const result = await removeEventRsvpAction({ event_id: 'event-1' });

    expect(result.success).toBe(true);
    expect(removeEventRsvp).toHaveBeenCalledWith('user-1', 'event-1');
    expect(revalidatePath).toHaveBeenCalledWith('/events');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/events');
    expect(revalidatePath).toHaveBeenCalledWith('/calendar');
    expect(revalidatePath).toHaveBeenCalledWith('/events/event-1');
  });

  it('returns an undefined event when removing an RSVP yields no event payload', async () => {
    removeEventRsvp.mockResolvedValueOnce(null);

    const result = await removeEventRsvpAction({ event_id: 'event-1' });

    expect(result).toEqual({ success: true, event: undefined });
    expect(removeEventRsvp).toHaveBeenCalledWith('user-1', 'event-1');
  });

  it('returns validation failures for invalid update, cancel, and remove payloads', async () => {
    const updateResult = await updateEventAction({
      id: '',
      title: '',
      description: '',
      location_id: 'unknown-location',
      starts_at: 'not-a-datetime',
      timezone: 'UTC',
      capacity: null,
      status: 'draft',
    } as any);
    const cancelResult = await cancelEventAction('');
    const removeResult = await removeEventRsvpAction({ event_id: '' } as any);

    expect(updateResult.success).toBe(false);
    expect(updateResult.error).toBe('Validation failed');
    expect(cancelResult.success).toBe(false);
    expect(cancelResult.error).toBe('Validation failed');
    expect(removeResult.success).toBe(false);
    expect(removeResult.error).toBe('Validation failed');
  });

  it('returns service errors for failed update, cancel, and remove RSVP requests', async () => {
    updateEvent.mockRejectedValueOnce(new Error('update failed'));
    cancelEvent.mockRejectedValueOnce(new Error('cancel failed'));
    removeEventRsvp.mockRejectedValueOnce(new Error('remove failed'));

    await expect(
      updateEventAction({
        id: 'event-1',
        title: 'Sunset Walk',
        description: 'Meet at the park gate.',
        location_id: 'location-paris-ile-de-france-france',
        starts_at: '2026-05-10T06:30:00.000Z',
        ends_at: '2026-05-10T08:00:00.000Z',
        timezone: 'Europe/Paris',
        capacity: 12,
        status: 'published',
      } as any)
    ).resolves.toEqual(expect.objectContaining({ success: false, error: 'update failed' }));

    await expect(cancelEventAction('event-1')).resolves.toEqual(
      expect.objectContaining({ success: false, error: 'cancel failed' })
    );

    await expect(removeEventRsvpAction({ event_id: 'event-1' })).resolves.toEqual(
      expect.objectContaining({ success: false, error: 'remove failed' })
    );
  });

  it('requires authentication before publishing an event', async () => {
    const { getCurrentUserFromCookies } = require('../../src/lib/server/current-user');
    getCurrentUserFromCookies.mockResolvedValueOnce(null);

    const result = await publishEventAction('event-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it('publishes an event and returns an undefined payload when the service returns null', async () => {
    const { revalidatePath } = require('next/cache');
    publishEvent.mockResolvedValueOnce(null);

    const result = await publishEventAction('event-1');

    expect(result).toEqual({ success: true, event: undefined });
    expect(publishEvent).toHaveBeenCalledWith('user-1', 'event-1');
    expect(revalidatePath).toHaveBeenCalledWith('/events/event-1');
  });

  it('returns validation failures for invalid publish and RSVP payloads', async () => {
    const publishResult = await publishEventAction('');
    const rsvpResult = await setEventRsvpAction({ event_id: '' } as any);

    expect(publishResult.success).toBe(false);
    expect(publishResult.error).toBe('Validation failed');
    expect(rsvpResult.success).toBe(false);
    expect(rsvpResult.error).toBe('Validation failed');
  });

  it('sets an RSVP for the current user', async () => {
    const result = await setEventRsvpAction({ event_id: 'event-1' });

    expect(result.success).toBe(true);
    expect(setEventRsvp).toHaveBeenCalledWith('user-1', 'event-1');
  });

  it('returns an undefined event when setting an RSVP yields no event payload', async () => {
    setEventRsvp.mockResolvedValueOnce(null);

    const result = await setEventRsvpAction({ event_id: 'event-1' });

    expect(result).toEqual({ success: true, event: undefined });
    expect(setEventRsvp).toHaveBeenCalledWith('user-1', 'event-1');
  });

  it('returns service errors for failed publish and RSVP requests', async () => {
    publishEvent.mockRejectedValueOnce(new Error('publish failed'));
    setEventRsvp.mockRejectedValueOnce(new Error('rsvp failed'));

    await expect(publishEventAction('event-1')).resolves.toEqual(
      expect.objectContaining({ success: false, error: 'publish failed' })
    );

    await expect(setEventRsvpAction({ event_id: 'event-1' })).resolves.toEqual(
      expect.objectContaining({ success: false, error: 'rsvp failed' })
    );
  });
});
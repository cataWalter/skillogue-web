import {
  createEventSchema,
  eventSearchSchema,
  setEventRsvpSchema,
  updateEventSchema,
} from '../src/lib/schemas';

describe('event schemas', () => {
  it('accepts a valid event payload and normalizes datetimes', () => {
    const parsed = createEventSchema.parse({
      title: 'Sunrise Walk',
      description: 'Meet at the park entrance.',
      location_id: 'location-paris-ile-de-france-france',
      starts_at: '2026-05-10T08:30:00+02:00',
      ends_at: '2026-05-10T10:00:00+02:00',
      timezone: 'Europe/Paris',
      capacity: '12',
      status: 'draft',
    });

    expect(parsed).toEqual({
      title: 'Sunrise Walk',
      description: 'Meet at the park entrance.',
      location_id: 'location-paris-ile-de-france-france',
      starts_at: '2026-05-10T06:30:00.000Z',
      ends_at: '2026-05-10T08:00:00.000Z',
      timezone: 'Europe/Paris',
      capacity: 12,
      status: 'draft',
    });
  });

  it('rejects an unknown location id', () => {
    expect(() =>
      createEventSchema.parse({
        title: 'Invalid Location',
        description: '',
        location_id: 'unknown-location',
        starts_at: '2026-05-10T08:30:00Z',
        timezone: 'Europe/Paris',
        capacity: null,
        status: 'draft',
      })
    ).toThrow('Location must be selected from the list');
  });

  it('rejects an end datetime earlier than the start datetime', () => {
    expect(() =>
      createEventSchema.parse({
        title: 'Backwards Event',
        description: '',
        location_id: 'location-paris-ile-de-france-france',
        starts_at: '2026-05-10T08:30:00Z',
        ends_at: '2026-05-10T07:30:00Z',
        timezone: 'Europe/Paris',
        capacity: null,
        status: 'draft',
      })
    ).toThrow('End date/time must be on or after the start date/time');
  });

  it('rejects invalid datetimes and invalid timezones', () => {
    expect(() =>
      createEventSchema.parse({
        title: 'Broken Event',
        description: '',
        location_id: 'location-paris-ile-de-france-france',
        starts_at: 'not-a-datetime',
        timezone: 'Mars/Olympus',
        capacity: null,
        status: 'draft',
      })
    ).toThrow();
  });

  it('parses search filters and validates the filter range', () => {
    const parsed = eventSearchSchema.parse({
      query: 'coffee',
      location_id: 'location-berlin-berlin-germany',
      starts_from: '2026-05-01T00:00:00Z',
      starts_to: '2026-05-31T23:59:59Z',
      page: '2',
      page_size: '24',
    });

    expect(parsed).toEqual({
      query: 'coffee',
      location_id: 'location-berlin-berlin-germany',
      starts_from: '2026-05-01T00:00:00.000Z',
      starts_to: '2026-05-31T23:59:59.000Z',
      page: 2,
      page_size: 24,
    });

    expect(() =>
      eventSearchSchema.parse({
        starts_from: '2026-06-01T00:00:00Z',
        starts_to: '2026-05-01T00:00:00Z',
      })
    ).toThrow('End date/time filter must be on or after the start date/time filter');
  });

  it('requires event identifiers for update and RSVP operations', () => {
    expect(updateEventSchema.parse({
      id: 'event-1',
      title: 'Edited Event',
      description: '',
      location_id: 'location-paris-ile-de-france-france',
      starts_at: '2026-05-10T08:30:00Z',
      timezone: 'Europe/Paris',
      capacity: null,
      status: 'published',
    }).id).toBe('event-1');

    expect(setEventRsvpSchema.parse({ event_id: 'event-1' })).toEqual({ event_id: 'event-1' });
    expect(() => setEventRsvpSchema.parse({ event_id: '' })).toThrow('Event is required');
  });

  it('coerces capacity from whitespace-only string to null', () => {
    const result = createEventSchema.parse({
      title: 'Event',
      description: '',
      location_id: 'location-paris-ile-de-france-france',
      starts_at: '2026-05-10T08:30:00Z',
      timezone: 'Europe/Paris',
      capacity: '   ',
      status: 'draft',
    });
    expect(result.capacity).toBeNull();
  });

  it('preserves numeric capacity values', () => {
    const result = createEventSchema.parse({
      title: 'Event',
      description: '',
      location_id: 'location-paris-ile-de-france-france',
      starts_at: '2026-05-10T08:30:00Z',
      timezone: 'Europe/Paris',
      capacity: 12,
      status: 'draft',
    });

    expect(result.capacity).toBe(12);
  });

  it('treats blank optional search filters as undefined', () => {
    const result = eventSearchSchema.parse({
      location_id: '   ',
      starts_from: '   ',
      starts_to: '   ',
    });

    expect(result).toEqual({
      query: '',
      location_id: undefined,
      starts_from: undefined,
      starts_to: undefined,
      page: 1,
      page_size: 12,
    });
  });

  it('passes through non-string non-number capacity values (coerced to null via zod)', () => {
    // An object is passed through as-is from the preprocess, then zod rejects it
    expect(() =>
      createEventSchema.parse({
        title: 'Event',
        description: '',
        location_id: 'location-paris-ile-de-france-france',
        starts_at: '2026-05-10T08:30:00Z',
        timezone: 'Europe/Paris',
        capacity: { nested: true },
        status: 'draft',
      })
    ).toThrow();
  });

  it('skips timezone catalog validation when supported time zones are unavailable', () => {
    const originalSupportedValuesOf = Intl.supportedValuesOf;

    Object.defineProperty(Intl, 'supportedValuesOf', {
      configurable: true,
      value: undefined,
      writable: true,
    });

    try {
      jest.isolateModules(() => {
        const { createEventSchema: isolatedCreateEventSchema } = require('../src/lib/schemas');
        const result = isolatedCreateEventSchema.parse({
          title: 'Fallback Timezone Event',
          description: '',
          location_id: 'location-paris-ile-de-france-france',
          starts_at: '2026-05-10T08:30:00Z',
          timezone: 'Mars/Olympus',
          capacity: null,
          status: 'draft',
        });

        expect(result.timezone).toBe('Mars/Olympus');
      });
    } finally {
      Object.defineProperty(Intl, 'supportedValuesOf', {
        configurable: true,
        value: originalSupportedValuesOf,
        writable: true,
      });
    }
  });
});
import {
  convertLocalDateTimeToUtcIso,
  formatEventDateTime,
  formatEventDateTimeRange,
  formatUtcIsoForDateTimeInput,
  getEventLocalDayKey,
  getTimeZoneOptions,
} from '../../src/lib/events/datetime';

describe('event datetime helpers', () => {
  const originalSupportedValuesOf = Intl.supportedValuesOf;

  afterEach(() => {
    Object.defineProperty(Intl, 'supportedValuesOf', {
      configurable: true,
      value: originalSupportedValuesOf,
      writable: true,
    });
  });

  it('returns supported time zones when available and falls back to UTC otherwise', () => {
    expect(getTimeZoneOptions().length).toBeGreaterThan(0);

    Object.defineProperty(Intl, 'supportedValuesOf', {
      configurable: true,
      value: undefined,
      writable: true,
    });

    expect(getTimeZoneOptions()).toEqual(['UTC']);
  });

  it('converts local datetime input to utc iso and rejects invalid input', () => {
    expect(convertLocalDateTimeToUtcIso(null, 'UTC')).toBeNull();
    expect(convertLocalDateTimeToUtcIso('2026-05-10T08:30', '')).toBeNull();
    expect(convertLocalDateTimeToUtcIso('not-a-date', 'UTC')).toBeNull();
    expect(convertLocalDateTimeToUtcIso('2026-05-10T08:30', 'Invalid/Zone')).toBeNull();
    expect(convertLocalDateTimeToUtcIso('2026-05-10T08:30', 'UTC')).toBe('2026-05-10T08:30:00.000+00:00');
  });

  it('formats utc timestamps for datetime inputs and day keys', () => {
    expect(formatUtcIsoForDateTimeInput(null, 'UTC')).toBe('');
    expect(formatUtcIsoForDateTimeInput('not-a-date', 'UTC')).toBe('');
    expect(formatUtcIsoForDateTimeInput('2026-05-10T08:30:00.000Z', 'UTC')).toBe('2026-05-10T08:30');
    expect(getEventLocalDayKey('2026-05-10T08:30:00.000Z', 'UTC')).toBe('2026-05-10');
    expect(getEventLocalDayKey('not-a-date', 'UTC')).toBe('');
  });

  it('formats event times and ranges', () => {
    const startLabel = formatEventDateTime('2026-05-10T08:30:00.000Z', 'UTC');

    expect(typeof startLabel).toBe('string');
    expect(startLabel.length).toBeGreaterThan(0);
    expect(formatEventDateTimeRange('2026-05-10T08:30:00.000Z', null, 'UTC')).toBe(startLabel);
    expect(formatEventDateTimeRange('2026-05-10T08:30:00.000Z', '2026-05-10T09:30:00.000Z', 'UTC')).toContain(' to ');
  });
});
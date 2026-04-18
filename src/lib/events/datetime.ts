import { TZDate } from '@date-fns/tz';

const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

const pad = (value: number) => String(value).padStart(2, '0');

export const getTimeZoneOptions = () =>
  typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : ['UTC'];

export const convertLocalDateTimeToUtcIso = (value: string | null | undefined, timeZone: string) => {
  if (!value?.trim() || !timeZone.trim()) {
    return null;
  }

  const match = value.trim().match(DATETIME_LOCAL_PATTERN);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  const seconds = Number(match[6] ?? '0');
  const zonedDate = new TZDate(year, month - 1, day, hours, minutes, seconds, 0, timeZone);

  return Number.isNaN(zonedDate.getTime()) ? null : zonedDate.toISOString();
};

export const formatUtcIsoForDateTimeInput = (value: string | null | undefined, timeZone: string) => {
  if (!value || !timeZone.trim()) {
    return '';
  }

  const zonedDate = new TZDate(value, timeZone);

  if (Number.isNaN(zonedDate.getTime())) {
    return '';
  }

  return [
    zonedDate.getFullYear(),
    pad(zonedDate.getMonth() + 1),
    pad(zonedDate.getDate()),
  ].join('-') + `T${pad(zonedDate.getHours())}:${pad(zonedDate.getMinutes())}`;
};

export const getEventLocalDayKey = (value: string, timeZone: string) => {
  const zonedDate = new TZDate(value, timeZone);

  if (Number.isNaN(zonedDate.getTime())) {
    return '';
  }

  return [
    zonedDate.getFullYear(),
    pad(zonedDate.getMonth() + 1),
    pad(zonedDate.getDate()),
  ].join('-');
};

export const formatEventDateTime = (
  value: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {}
) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
    ...options,
  }).format(new Date(value));

export const formatEventDateTimeRange = (
  startsAt: string,
  endsAt: string | null | undefined,
  timeZone: string
) => {
  const startLabel = formatEventDateTime(startsAt, timeZone);

  if (!endsAt) {
    return startLabel;
  }

  return `${startLabel} to ${formatEventDateTime(endsAt, timeZone, { dateStyle: 'medium', timeStyle: 'short' })}`;
};
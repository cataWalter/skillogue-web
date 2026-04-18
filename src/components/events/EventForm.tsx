'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/Button';
import { eventCopy } from '@/lib/app-copy';
import { createEventAction, updateEventAction } from '@/app/actions/events';
import type { EventLocation, EventSummary } from '@/types/events';
import {
  convertLocalDateTimeToUtcIso,
  formatUtcIsoForDateTimeInput,
  getTimeZoneOptions,
} from '@/lib/events/datetime';

type EventFormProps = {
  locations: EventLocation[];
  initialEvent?: EventSummary | null;
  onSaved?: (eventId: string | null) => void;
  onCancel?: () => void;
};

const inputClassName =
  'w-full rounded-xl border border-line/30 bg-surface-secondary/70 px-4 py-3 text-foreground placeholder-faint shadow-glass-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30';

const getDefaultTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const EventForm = ({ locations, initialEvent = null, onSaved, onCancel }: EventFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeZone, setTimeZone] = useState(getDefaultTimeZone());
  const [startsAtLocal, setStartsAtLocal] = useState('');
  const [endsAtLocal, setEndsAtLocal] = useState('');
  const [capacity, setCapacity] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const timeZoneOptions = useMemo(() => getTimeZoneOptions(), []);

  const countries = useMemo(
    () => Array.from(new Set(locations.map((location) => location.country))).sort((left, right) => left.localeCompare(right)),
    [locations]
  );

  const regions = useMemo(() => {
    if (!selectedCountry) {
      return [];
    }

    return Array.from(
      new Set(
        locations
          .filter((location) => location.country === selectedCountry)
          .map((location) => location.region)
      )
    ).sort((left, right) => left.localeCompare(right));
  }, [locations, selectedCountry]);

  const cityLocations = useMemo(() => {
    if (!selectedCountry || !selectedRegion) {
      return [];
    }

    return locations
      .filter(
        (location) =>
          location.country === selectedCountry && location.region === selectedRegion
      )
      .sort((left, right) => left.city.localeCompare(right.city));
  }, [locations, selectedCountry, selectedRegion]);

  useEffect(() => {
    const eventLocation = initialEvent
      ? locations.find((location) => location.id === initialEvent.location_id) ?? null
      : null;
    const resolvedTimeZone = initialEvent?.timezone ?? getDefaultTimeZone();

    setTitle(initialEvent?.title ?? '');
    setDescription(initialEvent?.description ?? '');
    setTimeZone(resolvedTimeZone);
    setStartsAtLocal(
      initialEvent ? formatUtcIsoForDateTimeInput(initialEvent.starts_at, resolvedTimeZone) : ''
    );
    setEndsAtLocal(
      initialEvent?.ends_at
        ? formatUtcIsoForDateTimeInput(initialEvent.ends_at, resolvedTimeZone)
        : ''
    );
    setCapacity(initialEvent?.capacity !== null && initialEvent?.capacity !== undefined ? String(initialEvent.capacity) : '');
    setSelectedCountry(eventLocation?.country ?? '');
    setSelectedRegion(eventLocation?.region ?? '');
    setSelectedLocationId(eventLocation?.id ?? '');
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialEvent, locations]);

  const handleSubmit = () => {
    startTransition(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);

      const startsAt = convertLocalDateTimeToUtcIso(startsAtLocal, timeZone);
      const endsAt = endsAtLocal ? convertLocalDateTimeToUtcIso(endsAtLocal, timeZone) : null;

      if (!startsAt) {
        setErrorMessage('Start date/time must be a valid value.');
        return;
      }

      if (endsAtLocal && !endsAt) {
        setErrorMessage('End date/time must be a valid value.');
        return;
      }

      const payload = {
        title,
        description,
        location_id: selectedLocationId,
        starts_at: startsAt,
        ends_at: endsAt,
        timezone: timeZone,
        capacity: capacity.trim() ? capacity.trim() : null,
        status: initialEvent?.status ?? 'draft',
      };

      const result = initialEvent
        ? await updateEventAction({
            ...payload,
            id: initialEvent.id,
          })
        : await createEventAction(payload);

      if (!result.success) {
        const details = result.details
          ? Object.values(result.details)
              .flat()
              .filter(Boolean)
              .join(' ')
          : '';
        const message = details || result.error || 'Unable to save event.';

        setErrorMessage(message);
        toast.error(message);
        return;
      }

      const message = initialEvent ? 'Event updated.' : 'Event created.';
      setSuccessMessage(message);
      toast.success(message);
      onSaved?.(result.event?.id ?? null);
      router.refresh();
    });
  };

  return (
    <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="editorial-kicker mb-4 w-fit border-brand/20 bg-brand/10 text-brand-soft">
            {initialEvent ? 'Refine the details' : 'Host something worth showing up for'}
          </p>
          <h2 className="text-2xl font-semibold text-foreground">
            {initialEvent ? eventCopy.actions.save : eventCopy.actions.create}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Use the static location catalog and keep the event times anchored to the selected timezone.
          </p>
        </div>
        {initialEvent && (
          <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            {eventCopy.status[initialEvent.status]}
          </span>
        )}
      </div>

      <div className="space-y-5">
        <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
          <label htmlFor="event-title" className="mb-2 block text-sm font-medium text-muted">{eventCopy.fields.title}</label>
          <input
            id="event-title"
            name="title"
            autoComplete="off"
            className={inputClassName}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
          <label htmlFor="event-description" className="mb-2 block text-sm font-medium text-muted">{eventCopy.fields.description}</label>
          <textarea
            id="event-description"
            name="description"
            autoComplete="off"
            className={`${inputClassName} min-h-32`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
            <label htmlFor="event-country" className="mb-2 block text-sm font-medium text-muted">Country</label>
            <select
              id="event-country"
              name="country"
              autoComplete="country-name"
              className={inputClassName}
              value={selectedCountry}
              onChange={(event) => {
                setSelectedCountry(event.target.value);
                setSelectedRegion('');
                setSelectedLocationId('');
              }}
            >
              <option value="">Select country</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
            <label htmlFor="event-region" className="mb-2 block text-sm font-medium text-muted">Region</label>
            <select
              id="event-region"
              name="region"
              autoComplete="address-level1"
              className={inputClassName}
              value={selectedRegion}
              onChange={(event) => {
                setSelectedRegion(event.target.value);
                setSelectedLocationId('');
              }}
              disabled={!selectedCountry}
            >
              <option value="">Select region</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
          <label htmlFor="event-location" className="mb-2 block text-sm font-medium text-muted">{eventCopy.fields.location}</label>
          <select
            id="event-location"
            name="location_id"
            autoComplete="address-level2"
            className={inputClassName}
            value={selectedLocationId}
            onChange={(event) => setSelectedLocationId(event.target.value)}
            disabled={!selectedRegion}
          >
            <option value="">Select city</option>
            {cityLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.city}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
            <label htmlFor="event-starts-at" className="mb-2 block text-sm font-medium text-muted">{eventCopy.fields.startsAt}</label>
            <input
              id="event-starts-at"
              name="starts_at"
              autoComplete="off"
              type="datetime-local"
              className={inputClassName}
              value={startsAtLocal}
              onChange={(event) => setStartsAtLocal(event.target.value)}
            />
          </div>

          <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
            <label htmlFor="event-ends-at" className="mb-2 block text-sm font-medium text-muted">{eventCopy.fields.endsAt}</label>
            <input
              id="event-ends-at"
              name="ends_at"
              autoComplete="off"
              type="datetime-local"
              className={inputClassName}
              value={endsAtLocal}
              onChange={(event) => setEndsAtLocal(event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
            <label htmlFor="event-timezone" className="mb-2 block text-sm font-medium text-muted">{eventCopy.fields.timezone}</label>
            <select
              id="event-timezone"
              name="timezone"
              autoComplete="off"
              className={inputClassName}
              value={timeZone}
              onChange={(event) => setTimeZone(event.target.value)}
            >
              {timeZoneOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
            <label htmlFor="event-capacity" className="mb-2 block text-sm font-medium text-muted">{eventCopy.fields.capacity}</label>
            <input
              id="event-capacity"
              name="capacity"
              autoComplete="off"
              type="number"
              min="1"
              className={inputClassName}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      {errorMessage && (
        <p className="mt-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger-soft">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="mt-5 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success-soft">
          {successMessage}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={handleSubmit}
          isLoading={isPending}
          aria-label={initialEvent ? eventCopy.actions.save : 'Submit event form'}
        >
          {initialEvent ? eventCopy.actions.save : eventCopy.actions.create}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {eventCopy.actions.backToManager}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EventForm;
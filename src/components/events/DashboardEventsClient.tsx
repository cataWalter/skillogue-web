'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/Button';
import { eventCopy } from '@/lib/app-copy';
import type { EventLocation, EventSummary } from '@/types/events';
import { cancelEventAction, publishEventAction } from '@/app/actions/events';
import { formatEventDateTimeRange } from '@/lib/events/datetime';
import EventForm from './EventForm';

type DashboardEventsClientProps = {
  events: EventSummary[];
  locations: EventLocation[];
};

const statusBadgeClassName: Record<EventSummary['status'], string> = {
  cancelled: 'bg-danger/15 text-danger-soft',
  draft: 'bg-warning/15 text-warning-soft',
  published: 'bg-approval/15 text-approval-soft',
};

const DashboardEventsClient = ({ events, locations }: DashboardEventsClientProps) => {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(events[0]?.id ?? null);
  const [isCreating, setIsCreating] = useState(events.length === 0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!events.length) {
      setSelectedEventId(null);
      setIsCreating(true);
      return;
    }

    if (!selectedEventId || !events.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const handleStatusChange = (eventId: string, nextAction: 'publish' | 'cancel') => {
    startTransition(async () => {
      const result =
        nextAction === 'publish'
          ? await publishEventAction(eventId)
          : await cancelEventAction(eventId);

      if (!result.success) {
        toast.error(result.error ?? 'Unable to update event status.');
        return;
      }

      toast.success(nextAction === 'publish' ? 'Event published.' : 'Event cancelled.');
      router.refresh();
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="glass-panel space-y-4 rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="editorial-kicker mb-4 w-fit border-discovery/25 bg-discovery/10 text-discovery-soft">
              Event studio
            </p>
            <h1 className="text-3xl font-semibold text-foreground">{eventCopy.manage.title}</h1>
            <p className="mt-2 text-sm text-muted">{eventCopy.manage.subtitle}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsCreating(true);
              setSelectedEventId(null);
            }}
          >
            {eventCopy.actions.create}
          </Button>
        </div>

        {events.length === 0 ? (
          <div className="glass-surface rounded-[1.5rem] border-dashed px-5 py-8 text-sm text-muted">
            {eventCopy.manage.empty}
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <article
                key={event.id}
                className={`rounded-[1.5rem] border p-4 transition-all duration-300 ${
                  !isCreating && selectedEventId === event.id
                    ? 'bg-[linear-gradient(135deg,rgba(245,158,11,0.14),rgba(14,165,233,0.08))] border-brand/45 shadow-glass-md'
                    : 'glass-surface hover:border-brand/30 hover:-translate-y-0.5'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="text-left text-lg font-semibold text-foreground hover:text-brand"
                        onClick={() => {
                          setIsCreating(false);
                          setSelectedEventId(event.id);
                        }}
                      >
                        {event.title}
                      </button>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${statusBadgeClassName[event.status]}`}>
                        {eventCopy.status[event.status]}
                      </span>
                    </div>
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand/50" />
                      {formatEventDateTimeRange(event.starts_at, event.ends_at, event.timezone)}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-faint">
                      <MapPin className="h-4 w-4 shrink-0 text-brand/50" />
                      {event.location?.city}, {event.location?.country}
                      <span className="mx-1 text-line/50">·</span>
                      <Users className="h-4 w-4 shrink-0 text-brand/50" />
                      {event.attendance_count} attending
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/events/${event.id}`} className="glass-surface inline-flex items-center rounded-full px-3 py-1.5 text-sm text-muted transition-all duration-300 hover:-translate-y-0.5 hover:text-brand">
                      View
                    </Link>
                    {event.status === 'published' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        isLoading={isPending}
                        onClick={() => handleStatusChange(event.id, 'cancel')}
                      >
                        {eventCopy.actions.cancel}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        isLoading={isPending}
                        onClick={() => handleStatusChange(event.id, 'publish')}
                      >
                        {eventCopy.actions.publish}
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <EventForm
          locations={locations}
          initialEvent={isCreating ? null : selectedEvent}
          onSaved={(eventId) => {
            if (eventId) {
              setSelectedEventId(eventId);
            }

            setIsCreating(false);
          }}
          onCancel={() => {
            if (events.length > 0) {
              setIsCreating(false);
            }
          }}
        />
      </section>
    </div>
  );
};

export default DashboardEventsClient;
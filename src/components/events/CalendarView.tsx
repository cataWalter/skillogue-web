'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { Button } from '@/components/Button';
import { eventCopy } from '@/lib/app-copy';
import { formatEventDateTimeRange, getEventLocalDayKey } from '@/lib/events/datetime';
import type { CalendarEventFilter, EventSummary } from '@/types/events';

type CalendarViewProps = {
  events: EventSummary[];
};

const FILTER_OPTIONS: CalendarEventFilter[] = ['all', 'created', 'attending'];

const CalendarView = ({ events }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [filter, setFilter] = useState<CalendarEventFilter>('all');
  const [selectedDayKey, setSelectedDayKey] = useState(format(new Date(), 'yyyy-MM-dd'));

  const visibleEvents = useMemo(
    () =>
      events.filter((event) => {
        if (filter === 'created') {
          return event.is_owner;
        }

        if (filter === 'attending') {
          return event.is_attending;
        }

        return true;
      }),
    [events, filter]
  );

  const eventsByDay = useMemo(() => {
    const groupedEvents = new Map<string, EventSummary[]>();

    for (const event of visibleEvents) {
      const dayKey = getEventLocalDayKey(event.starts_at, event.timezone);

      if (!dayKey) {
        continue;
      }

      const currentEvents = groupedEvents.get(dayKey) ?? [];
      currentEvents.push(event);
      currentEvents.sort((left, right) => left.starts_at.localeCompare(right.starts_at));
      groupedEvents.set(dayKey, currentEvents);
    }

    return groupedEvents;
  }, [visibleEvents]);

  const monthDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth)),
      }),
    [currentMonth]
  );

  const selectedDayEvents = eventsByDay.get(selectedDayKey) ?? [];

  useEffect(() => {
    const monthDayKeys = monthDays.map((day) => format(day, 'yyyy-MM-dd'));

    if (monthDayKeys.includes(selectedDayKey)) {
      return;
    }

    const firstDayWithEvent = monthDayKeys.find((dayKey) => (eventsByDay.get(dayKey) ?? []).length > 0);
    setSelectedDayKey(firstDayWithEvent ?? monthDayKeys[0]);
  }, [eventsByDay, monthDays, selectedDayKey]);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="editorial-kicker mb-4 w-fit border-discovery/25 bg-discovery/10 text-discovery-soft">
              Rhythm view
            </p>
            <h1 className="text-3xl font-semibold text-foreground">{eventCopy.calendar.title}</h1>
            <p className="mt-2 text-sm text-muted">See the events you created and the ones you plan to attend.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FILTER_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={filter === option ? 'primary' : 'ghost'}
                onClick={() => setFilter(option)}
              >
                {eventCopy.calendar[option]}
              </Button>
            ))}
          </div>
        </div>

        <div className="glass-surface mt-6 flex items-center justify-between gap-4 rounded-[1.5rem] px-4 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            Previous
          </Button>
          <div className="text-lg font-semibold text-foreground">{format(currentMonth, 'LLLL yyyy')}</div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            Next
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-faint">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2">
          {monthDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDay.get(dayKey) ?? [];
            const isSelected = dayKey === selectedDayKey;

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => setSelectedDayKey(dayKey)}
                className={`min-h-28 rounded-2xl border p-3 text-left transition-all duration-300 ${
                  isSelected
                    ? 'border-brand/45 bg-[linear-gradient(135deg,rgba(245,158,11,0.14),rgba(14,165,233,0.08))] shadow-glass-md'
                    : 'border-line/30 bg-surface-secondary/50 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-glass-sm'
                } ${isSameMonth(day, currentMonth) ? 'text-foreground' : 'text-faint'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{format(day, 'd')}</span>
                  {dayEvents.length > 0 && (
                    <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white shadow-glass-sm">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span key={event.id} className="h-2 w-2 rounded-full bg-brand" />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{selectedDayKey}</h2>
          <p className="mt-2 text-sm text-muted">{selectedDayEvents.length} events on this day.</p>
        </div>

        {selectedDayEvents.length === 0 ? (
          <div className="glass-surface mt-6 rounded-[1.5rem] border-dashed px-5 py-8 text-sm text-muted">
            {eventCopy.calendar.emptyDay}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {selectedDayEvents.map((event) => (
              <article key={event.id} className="glass-surface rounded-[1.5rem] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {formatEventDateTimeRange(event.starts_at, event.ends_at, event.timezone)}
                    </p>
                    <p className="mt-1 text-sm text-faint">
                      {event.location?.city}, {event.location?.country} · {event.timezone}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {event.is_owner && (
                      <span className="rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-brand">
                        Created
                      </span>
                    )}
                    {event.is_attending && (
                      <span className="rounded-full bg-approval/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-approval-soft">
                        Attending
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="text-sm text-muted">{event.attendance_count} attending</span>
                  <Link href={`/events/${event.id}`} className="glass-surface inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium text-brand transition-all duration-300 hover:-translate-y-0.5 hover:text-brand-soft">
                    View event
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
};

export default CalendarView;
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CalendarDays, MapPin, User, Users } from 'lucide-react';
import { AppDataService } from '@/lib/server/app-data-service';
import { getCurrentUserFromCookies } from '@/lib/server/current-user';
import { eventCopy } from '@/lib/app-copy';
import { formatEventDateTimeRange } from '@/lib/events/datetime';
import EventRsvpButton from '@/components/events/EventRsvpButton';

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUserFromCookies();

  if (!currentUser) {
    redirect('/login');
  }

  const { id } = await params;
  const service = new AppDataService();
  const event = await service.getEventForViewer(id, currentUser.id);

  if (!event) {
    notFound();
  }

  const creatorName = [event.creator?.first_name, event.creator?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Unknown creator';

  return (
    <div className="editorial-shell py-8 sm:py-12 lg:py-16">
      <div className="glass-panel rounded-[2rem] p-8 sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="editorial-kicker mb-4 w-fit border-brand/20 bg-brand/10 text-brand-soft">Event detail</p>
            <h1 className="mt-3 text-4xl font-semibold text-foreground">{event.title}</h1>
            <p className="mt-4 text-base leading-7 text-muted">{event.description || 'No description provided.'}</p>
          </div>
          <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            {eventCopy.status[event.status]}
          </span>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="glass-surface rounded-[1.5rem] p-5">
            <div className="flex items-center gap-2 text-faint">
              <CalendarDays className="h-4 w-4" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">When</h2>
            </div>
            <p className="mt-3 text-base text-foreground">{formatEventDateTimeRange(event.starts_at, event.ends_at, event.timezone)}</p>
            <p className="mt-1.5 text-sm text-muted">{event.timezone}</p>
          </div>

          <div className="glass-surface rounded-[1.5rem] p-5">
            <div className="flex items-center gap-2 text-faint">
              <MapPin className="h-4 w-4" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Where</h2>
            </div>
            <p className="mt-3 text-base text-foreground">
              {event.location?.city}, {event.location?.region}
            </p>
            <p className="mt-1.5 text-sm text-muted">{event.location?.country}</p>
          </div>

          <div className="glass-surface rounded-[1.5rem] p-5">
            <div className="flex items-center gap-2 text-faint">
              <User className="h-4 w-4" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Host</h2>
            </div>
            <p className="mt-3 text-base text-foreground">{creatorName}</p>
            {event.creator?.verified && (
              <p className="mt-1.5 text-sm text-approval-soft">Verified member</p>
            )}
          </div>

          <div className="glass-surface rounded-[1.5rem] p-5">
            <div className="flex items-center gap-2 text-faint">
              <Users className="h-4 w-4" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Attendance</h2>
            </div>
            <p className="mt-3 text-base text-foreground">
              {event.attendance_count} attending{event.capacity ? ` of ${event.capacity}` : ''}
            </p>
            {event.capacity != null && event.capacity > 0 && (
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/30">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-start to-brand-end transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((event.attendance_count / event.capacity) * 100))}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-faint">
                  {Math.max(0, event.capacity - event.attendance_count)} spots remaining
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/events" className="glass-surface inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium text-brand transition-all duration-300 hover:-translate-y-0.5 hover:text-brand-soft">
            Back to events
          </Link>
          {event.is_owner ? (
            <Link href="/dashboard/events" className="glass-surface inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium text-brand transition-all duration-300 hover:-translate-y-0.5 hover:text-brand-soft">
              {eventCopy.manage.title}
            </Link>
          ) : event.status === 'published' ? (
            <EventRsvpButton eventId={event.id} isAttending={event.is_attending} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
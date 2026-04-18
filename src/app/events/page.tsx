import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarDays, MapPin, SlidersHorizontal, User, Users } from 'lucide-react';
import { eventSearchSchema } from '@/lib/schemas';
import { AppDataService } from '@/lib/server/app-data-service';
import { getCurrentUserFromCookies } from '@/lib/server/current-user';
import { commonLabels, eventCopy } from '@/lib/app-copy';
import { formatEventDateTimeRange } from '@/lib/events/datetime';
import EventRsvpButton from '@/components/events/EventRsvpButton';
import { DiscoveryHeader } from '@/components/discovery/DiscoveryHeader';
import { DiscoveryEmptyState } from '@/components/discovery/DiscoveryEmptyState';

type SearchParams = Record<string, string | string[] | undefined>;

type EventSortBy = 'soonest' | 'popular' | 'newest';

const getSingleSearchParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const toStartDateTime = (value?: string) => (value ? `${value}T00:00:00.000Z` : undefined);

const toEndDateTime = (value?: string) => (value ? `${value}T23:59:59.999Z` : undefined);

const buildPageHref = (
  currentFilters: {
    query: string;
    location_id: string;
    starts_from_date: string;
    starts_to_date: string;
    sort_by: string;
  },
  page: number
) => {
  const params = new URLSearchParams();

  if (currentFilters.query) {
    params.set('query', currentFilters.query);
  }

  if (currentFilters.location_id) {
    params.set('location_id', currentFilters.location_id);
  }

  if (currentFilters.starts_from_date) {
    params.set('starts_from_date', currentFilters.starts_from_date);
  }

  if (currentFilters.starts_to_date) {
    params.set('starts_to_date', currentFilters.starts_to_date);
  }

  if (currentFilters.sort_by && currentFilters.sort_by !== 'soonest') {
    params.set('sort_by', currentFilters.sort_by);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const queryString = params.toString();
  return queryString ? `/events?${queryString}` : '/events';
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const currentUser = await getCurrentUserFromCookies();

  if (!currentUser) {
    redirect('/login');
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawFilters = {
    query: getSingleSearchParam(resolvedSearchParams.query) ?? '',
    location_id: getSingleSearchParam(resolvedSearchParams.location_id) ?? '',
    starts_from_date: getSingleSearchParam(resolvedSearchParams.starts_from_date) ?? '',
    starts_to_date: getSingleSearchParam(resolvedSearchParams.starts_to_date) ?? '',
    sort_by: getSingleSearchParam(resolvedSearchParams.sort_by) ?? 'soonest',
    page: getSingleSearchParam(resolvedSearchParams.page) ?? '1',
  };
  const parsedFiltersResult = eventSearchSchema.safeParse({
    query: rawFilters.query,
    location_id: rawFilters.location_id || undefined,
    starts_from: toStartDateTime(rawFilters.starts_from_date),
    starts_to: toEndDateTime(rawFilters.starts_to_date),
    page: rawFilters.page,
    page_size: 12,
  });
  const parsedFilters = parsedFiltersResult.success
    ? parsedFiltersResult.data
    : eventSearchSchema.parse({ page: 1, page_size: 12 });
  const service = new AppDataService();
  const [locations, searchResult] = await Promise.all([
    service.listLocations(),
    service.listPublishedEvents(parsedFilters, currentUser.id),
  ]);

  const sortBy = (rawFilters.sort_by as EventSortBy) || 'soonest';
  const sortedEvents = [...searchResult.events].sort((a, b) => {
    if (sortBy === 'popular') return b.attendance_count - a.attendance_count;
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
  });

  const filterFieldClass =
    'w-full rounded-xl border border-line/30 bg-surface-secondary/70 px-3 py-2.5 text-foreground placeholder-faint transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30';

  return (
    <div className="editorial-shell py-8 sm:py-12 lg:py-16">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <div className="glass-panel rounded-[1.75rem] p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-foreground">
              <SlidersHorizontal className="h-5 w-5 text-brand" />
              {eventCopy.filters.filtersTitle}
            </h2>
            <form className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-faint">{eventCopy.filters.query}</label>
                <input
                  type="text"
                  name="query"
                  defaultValue={rawFilters.query}
                  className={filterFieldClass}
                  placeholder="Coffee, meetup, walk..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-faint">{eventCopy.filters.location}</label>
                <select name="location_id" defaultValue={rawFilters.location_id} className={filterFieldClass}>
                  <option value="">All locations</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.city}, {location.country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-faint">{eventCopy.filters.from}</label>
                <input
                  type="date"
                  name="starts_from_date"
                  defaultValue={rawFilters.starts_from_date}
                  className={filterFieldClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-faint">{eventCopy.filters.to}</label>
                <input
                  type="date"
                  name="starts_to_date"
                  defaultValue={rawFilters.starts_to_date}
                  className={filterFieldClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-faint">{commonLabels.sortBy}</label>
                <select name="sort_by" defaultValue={rawFilters.sort_by} className={filterFieldClass}>
                  {eventCopy.sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-start to-brand-end py-2.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-glass-glow"
              >
                {eventCopy.filters.submit}
              </button>
              <Link
                href="/events"
                className="glass-surface flex w-full items-center justify-center rounded-xl py-2.5 font-medium text-muted transition-all duration-300 hover:-translate-y-0.5 hover:text-brand"
              >
                {eventCopy.filters.clear}
              </Link>
            </form>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3">
          <DiscoveryHeader
            kicker="City rituals"
            kickerClassName="border-discovery/25 bg-discovery/10 text-discovery-soft"
            title={eventCopy.search.title}
            subtitle={eventCopy.search.subtitle}
            aside={
              <div className="flex flex-wrap items-center gap-3">
                {searchResult.total > 0 && (
                  <span className="text-sm text-faint">{searchResult.total} events</span>
                )}
                <Link
                  href="/dashboard/events"
                  className="glass-surface inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-brand transition-all duration-300 hover:-translate-y-0.5 hover:text-brand-soft"
                >
                  {eventCopy.manage.title}
                </Link>
              </div>
            }
          />

          {sortedEvents.length === 0 ? (
            <DiscoveryEmptyState
              icon={<CalendarDays className="h-8 w-8 text-faint" />}
              title={eventCopy.search.emptyTitle}
              description={eventCopy.search.emptyDescription}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {sortedEvents.map((event) => {
                const creatorName = [event.creator?.first_name, event.creator?.last_name]
                  .filter(Boolean)
                  .join(' ')
                  .trim() || 'Unknown creator';

                return (
                  <article key={event.id} className="glass-surface card-hover-lift rounded-[1.75rem] p-6 transition-all duration-300 hover:border-brand/35 hover:-translate-y-1">
                    <h2 className="text-xl font-semibold text-foreground">{event.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{event.description || 'No description provided.'}</p>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-start gap-2 text-sm text-muted">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand/60" />
                        <span>{formatEventDateTimeRange(event.starts_at, event.ends_at, event.timezone)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <MapPin className="h-4 w-4 shrink-0 text-brand/60" />
                        <span>{event.location?.city}, {event.location?.country}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <User className="h-4 w-4 shrink-0 text-brand/60" />
                        <span>Hosted by {creatorName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Users className="h-4 w-4 shrink-0 text-brand/60" />
                        <span>{event.attendance_count} attending{event.capacity ? ` · ${event.capacity} capacity` : ''}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Link href={`/events/${event.id}`} className="glass-surface inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium text-brand transition-all duration-300 hover:-translate-y-0.5 hover:text-brand-soft">
                        View event
                      </Link>
                      <EventRsvpButton eventId={event.id} isAttending={event.is_attending} compact />
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {(searchResult.page > 1 || searchResult.hasMore) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {searchResult.page > 1 && (
                <Link
                  href={buildPageHref(rawFilters, searchResult.page - 1)}
                  className="glass-surface inline-flex items-center rounded-xl px-5 py-3 text-sm font-semibold text-muted transition-all duration-300 hover:-translate-y-0.5 hover:text-brand"
                >
                  Previous page
                </Link>
              )}
              {searchResult.hasMore && (
                <Link
                  href={buildPageHref(rawFilters, searchResult.page + 1)}
                  className="glass-surface inline-flex items-center rounded-xl px-5 py-3 text-sm font-semibold text-muted transition-all duration-300 hover:-translate-y-0.5 hover:text-brand"
                >
                  Next page
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export type EventStatus = 'draft' | 'published' | 'cancelled';

export type EventLocation = {
  id: string;
  city: string;
  region: string;
  country: string;
};

export type EventCreator = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  verified?: boolean;
};

export type EventRecord = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  location_id: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  capacity: number | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
};

export type EventSummary = EventRecord & {
  creator: EventCreator | null;
  location: EventLocation | null;
  attendance_count: number;
  is_attending: boolean;
  is_owner: boolean;
};

export type CalendarEventFilter = 'all' | 'created' | 'attending';

export type CalendarEventGroup = {
  day: string;
  events: EventSummary[];
};

export type EventSearchFilters = {
  query?: string;
  location_id?: string;
  starts_from?: string;
  starts_to?: string;
  page?: number;
  page_size?: number;
};
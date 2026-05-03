import { sql } from 'drizzle-orm';
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';

export const profiles = sqliteTable(
  'profiles',
  {
    id: text('id').primaryKey(),
    first_name: text('first_name'),
    last_name: text('last_name'),
    about_me: text('about_me'),
    age: integer('age'),
    birth_date: text('birth_date'),
    gender: text('gender'),
    avatar_url: text('avatar_url'),
    verified: integer('verified', { mode: 'boolean' }).default(false),
    is_private: integer('is_private', { mode: 'boolean' }).default(false),
    show_age: integer('show_age', { mode: 'boolean' }).default(true),
    show_location: integer('show_location', { mode: 'boolean' }).default(true),
    location_id: text('location_id'),
    created_at: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updated_at: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    last_login: text('last_login'),
  },
  (t) => [index('profiles_gender_idx').on(t.gender), index('profiles_age_idx').on(t.age), index('profiles_location_idx').on(t.location_id), index('profiles_created_idx').on(t.created_at), index('profiles_last_login_idx').on(t.last_login)]
);

export const locations = sqliteTable(
  'locations',
  {
    id: text('id').primaryKey(),
    city: text('city').notNull(),
    region: text('region').notNull(),
    country: text('country').notNull(),
  },
  (t) => [uniqueIndex('locations_city_region_country_unique').on(t.city, t.region, t.country), index('locations_country_region_city_idx').on(t.country, t.region, t.city)]
);

export const passions = sqliteTable(
  'passions',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
  }
);

export const languages = sqliteTable(
  'languages',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
  }
);

export const profilePassions = sqliteTable(
  'profile_passions',
  {
    id: text('id').primaryKey(),
    profile_id: text('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    passion_id: text('passion_id').notNull().references(() => passions.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('profile_passions_profile_passion_unique').on(t.profile_id, t.passion_id), index('profile_passions_profile_idx').on(t.profile_id), index('profile_passions_passion_idx').on(t.passion_id)]
);

export const profileLanguages = sqliteTable(
  'profile_languages',
  {
    id: text('id').primaryKey(),
    profile_id: text('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    language_id: text('language_id').notNull().references(() => languages.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('profile_languages_profile_language_unique').on(t.profile_id, t.language_id), index('profile_languages_profile_idx').on(t.profile_id), index('profile_languages_language_idx').on(t.language_id)]
);

export const favorites = sqliteTable(
  'favorites',
  {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull(),
    favorite_id: text('favorite_id').notNull(),
    created_at: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (t) => [uniqueIndex('favorites_user_favorite_unique').on(t.user_id, t.favorite_id), index('favorites_user_idx').on(t.user_id)]
);

export const blockedUsers = sqliteTable(
  'blocked_users',
  {
    id: text('id').primaryKey(),
    blocker_id: text('blocker_id').notNull(),
    blocked_id: text('blocked_id').notNull(),
    created_at: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (t) => [uniqueIndex('blocked_users_blocker_blocked_unique').on(t.blocker_id, t.blocked_id), index('blocked_users_blocker_idx').on(t.blocker_id), index('blocked_users_blocked_idx').on(t.blocked_id)]
);

export const messages = sqliteTable(
  'messages',
  {
    id: text('id').primaryKey(),
    sender_id: text('sender_id').notNull(),
    receiver_id: text('receiver_id').notNull(),
    content: text('content').notNull(),
    created_at: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    read_at: text('read_at'),
  },
  (t) => [index('messages_sender_idx').on(t.sender_id), index('messages_receiver_idx').on(t.receiver_id), index('messages_sender_receiver_idx').on(t.sender_id, t.receiver_id), index('messages_receiver_read_idx').on(t.receiver_id, t.read_at), index('messages_created_idx').on(t.created_at)]
);

export const userPresence = sqliteTable(
  'user_presence',
  {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull().unique(),
    online_at: text('online_at').notNull(),
  },
  (t) => [index('user_presence_online_at_idx').on(t.online_at)]
);

export const savedSearches = sqliteTable(
  'saved_searches',
  {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull(),
    name: text('name').notNull(),
    query: text('query'),
    location: text('location'),
    min_age: integer('min_age'),
    max_age: integer('max_age'),
    language: text('language'),
    gender: text('gender'),
    passion_ids: text('passion_ids', { mode: 'json' }).$type<string[]>(),
    created_at: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (t) => [index('saved_searches_user_created_idx').on(t.user_id, t.created_at)]
);

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    receiver_id: text('receiver_id').notNull(),
    actor_id: text('actor_id'),
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    url: text('url'),
    read: integer('read', { mode: 'boolean' }).default(false),
    created_at: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (t) => [index('notifications_receiver_created_idx').on(t.receiver_id, t.created_at)]
);

export const reports = sqliteTable(
  'reports',
  {
    id: text('id').primaryKey(),
    reporter_id: text('reporter_id').notNull(),
    reported_id: text('reported_id').notNull(),
    reason: text('reason').notNull(),
    status: text('status').default('pending'),
    created_at: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (t) => [index('reports_created_idx').on(t.created_at), index('reports_status_created_idx').on(t.status, t.created_at)]
);

export const verificationRequests = sqliteTable(
  'verification_requests',
  {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull(),
    status: text('status').default('pending'),
    created_at: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (t) => [index('verification_requests_user_created_idx').on(t.user_id, t.created_at), index('verification_requests_status_created_idx').on(t.status, t.created_at)]
);

export const pushSubscriptions = sqliteTable(
  'push_subscriptions',
  {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull(),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh'),
    auth: text('auth'),
  },
  (t) => [index('push_subscriptions_user_idx').on(t.user_id)]
);

export const adminSettings = sqliteTable(
  'admin_settings',
  {
    id: text('id').primaryKey(),
    maintenance_banner_text: text('maintenance_banner_text'),
    moderation_hold: integer('moderation_hold', { mode: 'boolean' }).default(false),
    follow_up_user_ids: text('follow_up_user_ids'),
    updated_at: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  }
);

export const contactRequests = sqliteTable(
  'contact_requests',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    category: text('category').notNull(),
    status: text('status').default('pending'),
    created_at: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (t) => [index('contact_requests_created_idx').on(t.created_at)]
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type BlockedUser = typeof blockedUsers.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type SavedSearch = typeof savedSearches.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Passion = typeof passions.$inferSelect;
export type Language = typeof languages.$inferSelect;

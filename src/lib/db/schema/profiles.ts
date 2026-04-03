import { pgTable, text, timestamp, boolean, integer, uuid } from 'drizzle-orm/pg-core';
import { bigint } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  aboutMe: text('about_me'),
  age: integer('age'),
  gender: text('gender'),
  verified: boolean('verified').default(false),
  isPrivate: boolean('is_private').default(false),
  showAge: boolean('show_age').default(true),
  showLocation: boolean('show_location').default(true),
  locationId: bigint('location_id', { mode: 'number' }).references(() => require('./locations').locations.id),
  avatarUrl: text('avatar_url'),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
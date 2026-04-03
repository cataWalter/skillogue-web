import { pgTable, text, timestamp, serial, integer } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const savedSearches = pgTable('saved_searches', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  query: text('query'),
  location: text('location'),
  minAge: integer('min_age'),
  maxAge: integer('max_age'),
  language: text('language'),
  gender: text('gender'),
  passionIds: text('passion_ids'), // Store as comma-separated string, convert in code
});

export type SavedSearch = typeof savedSearches.$inferSelect;
export type NewSavedSearch = typeof savedSearches.$inferInsert;
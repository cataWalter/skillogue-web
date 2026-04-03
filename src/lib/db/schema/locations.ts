import { pgTable, text, timestamp, bigint, serial } from 'drizzle-orm/pg-core';

export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  city: text('city'),
  region: text('region'),
  country: text('country'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
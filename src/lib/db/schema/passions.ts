import { pgTable, text, timestamp, serial } from 'drizzle-orm/pg-core';

export const passions = pgTable('passions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Passion = typeof passions.$inferSelect;
export type NewPassion = typeof passions.$inferInsert;
import { pgTable, text, timestamp, serial } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  reporterId: uuid('reporter_id').references(() => profiles.id, { onDelete: 'cascade' }),
  reportedId: uuid('reported_id').references(() => profiles.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  status: text('status').default('pending'),
});

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
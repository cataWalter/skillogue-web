import { pgTable, text, timestamp, serial, boolean } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  read: boolean('read').default(false),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
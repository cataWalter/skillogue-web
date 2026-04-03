import { pgTable, text, timestamp, serial, unique } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh'),
  auth: text('auth'),
}, (table) => {
  return {
    uniqueSubscription: unique().on(table.userId, table.endpoint),
  };
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
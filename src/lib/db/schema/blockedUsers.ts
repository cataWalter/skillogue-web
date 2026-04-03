import { pgTable, timestamp, serial, unique } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const blockedUsers = pgTable('blocked_users', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  blockerId: uuid('blocker_id').references(() => profiles.id, { onDelete: 'cascade' }),
  blockedId: uuid('blocked_id').references(() => profiles.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    uniqueBlock: unique().on(table.blockerId, table.blockedId),
  };
});

export type BlockedUser = typeof blockedUsers.$inferSelect;
export type NewBlockedUser = typeof blockedUsers.$inferInsert;
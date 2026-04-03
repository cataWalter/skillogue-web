import { pgTable, timestamp, serial, unique } from 'drizzle-orm/pg-core';
import { bigint, uuid } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { passions } from './passions';

export const userPassions = pgTable('user_passions', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  passionId: bigint('passion_id', { mode: 'number' }).references(() => passions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    uniqueUserPassion: unique().on(table.userId, table.passionId),
  };
});

export type UserPassion = typeof userPassions.$inferSelect;
export type NewUserPassion = typeof userPassions.$inferInsert;
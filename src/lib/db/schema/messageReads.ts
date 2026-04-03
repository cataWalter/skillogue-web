import { pgTable, timestamp, serial, unique } from 'drizzle-orm/pg-core';
import { uuid, bigint } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { messages } from './messages';

export const messageReads = pgTable('message_reads', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  messageId: bigint('message_id', { mode: 'number' }).references(() => messages.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    uniqueMessageRead: unique().on(table.userId, table.messageId),
  };
});

export type MessageRead = typeof messageReads.$inferSelect;
export type NewMessageRead = typeof messageReads.$inferInsert;
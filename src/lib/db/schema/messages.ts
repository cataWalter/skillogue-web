import { pgTable, text, timestamp, serial } from 'drizzle-orm/pg-core';
import { uuid, bigint } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  senderId: uuid('sender_id').references(() => profiles.id, { onDelete: 'cascade' }),
  receiverId: uuid('receiver_id').references(() => profiles.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
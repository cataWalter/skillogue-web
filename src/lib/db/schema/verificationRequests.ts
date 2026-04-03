import { pgTable, text, timestamp, serial } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const verificationRequests = pgTable('verification_requests', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  status: text('status').default('pending'),
});

export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type NewVerificationRequest = typeof verificationRequests.$inferInsert;
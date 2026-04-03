import { pgTable, timestamp, serial, unique } from 'drizzle-orm/pg-core';
import { bigint, uuid } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { languages } from './languages';

export const profileLanguages = pgTable('profile_languages', {
  id: serial('id').primaryKey(),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }),
  languageId: bigint('language_id', { mode: 'number' }).references(() => languages.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    uniqueProfileLanguage: unique().on(table.profileId, table.languageId),
  };
});

export type ProfileLanguage = typeof profileLanguages.$inferSelect;
export type NewProfileLanguage = typeof profileLanguages.$inferInsert;
import { pgTable, timestamp, serial, unique } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  favoriteId: uuid('favorite_id').references(() => profiles.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    uniqueFavorite: unique().on(table.userId, table.favoriteId),
  };
});

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
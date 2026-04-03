import { db } from './index';
import * as schema from './schema';
import { eq, and, or, sql, desc, asc, like, ilike, inArray, exists, not, isNull, count } from 'drizzle-orm';

// Locations
export const locationQueries = {
  getAll: () => db.select().from(schema.locations),
  getById: (id: number) => db.select().from(schema.locations).where(eq(schema.locations.id, id)),
  getDistinctCountries: () => db.selectDistinct({ country: schema.locations.country }).from(schema.locations).where(isNull(schema.locations.country)).orderBy(schema.locations.country),
  getDistinctRegions: (country: string) => db.selectDistinct({ region: schema.locations.region }).from(schema.locations).where(eq(schema.locations.country, country)).orderBy(schema.locations.region),
  getDistinctCities: (country: string, region?: string) => {
    if (region) {
      return db.selectDistinct({ city: schema.locations.city }).from(schema.locations).where(and(eq(schema.locations.country, country), eq(schema.locations.region, region))).orderBy(schema.locations.city);
    }
    return db.selectDistinct({ city: schema.locations.city }).from(schema.locations).where(eq(schema.locations.country, country)).orderBy(schema.locations.city);
  },
};

// Profiles
export const profileQueries = {
  getById: (id: string) => db.select().from(schema.profiles).where(eq(schema.profiles.id, id)),
  updateById: (id: string, data: Partial<typeof schema.profiles.$inferInsert>) => db.update(schema.profiles).set(data).where(eq(schema.profiles.id, id)),
};

// Passions
export const passionQueries = {
  getAll: () => db.select().from(schema.passions).orderBy(schema.passions.name),
  getById: (id: number) => db.select().from(schema.passions).where(eq(schema.passions.id, id)),
};

// Languages
export const languageQueries = {
  getAll: () => db.select().from(schema.languages).orderBy(schema.languages.name),
  getById: (id: number) => db.select().from(schema.languages).where(eq(schema.languages.id, id)),
};

// User Passions
export const userPassionQueries = {
  getByUserId: (userId: string) => db.select().from(schema.userPassions).where(eq(schema.userPassions.userId, userId)),
  add: (userId: string, passionId: number) => db.insert(schema.userPassions).values({ userId, passionId }),
  remove: (userId: string, passionId: number) => db.delete(schema.userPassions).where(and(eq(schema.userPassions.userId, userId), eq(schema.userPassions.passionId, passionId))),
};

// Profile Languages
export const profileLanguageQueries = {
  getByProfileId: (profileId: string) => db.select().from(schema.profileLanguages).where(eq(schema.profileLanguages.profileId, profileId)),
  add: (profileId: string, languageId: number) => db.insert(schema.profileLanguages).values({ profileId, languageId }),
  remove: (profileId: string, languageId: number) => db.delete(schema.profileLanguages).where(and(eq(schema.profileLanguages.profileId, profileId), eq(schema.profileLanguages.languageId, languageId))),
};

// Messages
export const messageQueries = {
  getConversations: async (userId: string) => {
    // Get all messages where user is sender or receiver
    const userMessages = await db.select().from(schema.messages).where(or(eq(schema.messages.senderId, userId), eq(schema.messages.receiverId, userId))).orderBy(desc(schema.messages.createdAt));
    
    // Group by conversation partner
    const conversations = new Map<string, { messages: typeof userMessages; unreadCount: number }>();
    
    for (const msg of userMessages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!otherUserId) continue;
      
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, { messages: [], unreadCount: 0 });
      }
      conversations.get(otherUserId)!.messages.push(msg);
    }
    
    return conversations;
  },
  
  getUnreadCount: async (userId: string) => {
    const unreadMessages = await db.select().from(schema.messages)
      .where(and(eq(schema.messages.receiverId, userId), not(exists(
        db.select().from(schema.messageReads).where(and(eq(schema.messageReads.messageId, schema.messages.id), eq(schema.messageReads.userId, userId)))
      ))));
    return unreadMessages.length;
  },
  
  markAsRead: async (userId: string, senderId: string) => {
    const messages = await db.select({ id: schema.messages.id }).from(schema.messages)
      .where(and(eq(schema.messages.senderId, senderId), eq(schema.messages.receiverId, userId)));
    
    for (const msg of messages) {
      await db.insert(schema.messageReads).values({ userId, messageId: msg.id }).onConflictDoNothing();
    }
  },
  
  send: (senderId: string, receiverId: string, content: string) => db.insert(schema.messages).values({ senderId, receiverId, content }),
};

// Notifications
export const notificationQueries = {
  getByUserId: (userId: string) => db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId)).orderBy(desc(schema.notifications.createdAt)),
  markAsRead: (notificationId: number) => db.update(schema.notifications).set({ read: true }).where(eq(schema.notifications.id, notificationId)),
  create: (userId: string, actorId: string, type: string) => db.insert(schema.notifications).values({ userId, actorId, type }),
};

// Favorites
export const favoriteQueries = {
  getByUserId: (userId: string) => db.select().from(schema.favorites).where(eq(schema.favorites.userId, userId)),
  isFavorite: (userId: string, favoriteId: string) => db.select().from(schema.favorites).where(and(eq(schema.favorites.userId, userId), eq(schema.favorites.favoriteId, favoriteId))),
  add: (userId: string, favoriteId: string) => db.insert(schema.favorites).values({ userId, favoriteId }).onConflictDoNothing(),
  remove: (userId: string, favoriteId: string) => db.delete(schema.favorites).where(and(eq(schema.favorites.userId, userId), eq(schema.favorites.favoriteId, favoriteId))),
};

// Blocked Users
export const blockedUserQueries = {
  block: (blockerId: string, blockedId: string) => db.insert(schema.blockedUsers).values({ blockerId, blockedId }).onConflictDoNothing(),
  unblock: (blockerId: string, blockedId: string) => db.delete(schema.blockedUsers).where(and(eq(schema.blockedUsers.blockerId, blockerId), eq(schema.blockedUsers.blockedId, blockedId))),
  isBlocked: async (blockerId: string, blockedId: string) => {
    const result = await db.select().from(schema.blockedUsers).where(or(
      and(eq(schema.blockedUsers.blockerId, blockerId), eq(schema.blockedUsers.blockedId, blockedId)),
      and(eq(schema.blockedUsers.blockerId, blockedId), eq(schema.blockedUsers.blockedId, blockerId))
    ));
    return result.length > 0;
  },
  getByBlockerId: (blockerId: string) => db.select().from(schema.blockedUsers).where(eq(schema.blockedUsers.blockerId, blockerId)),
};

// Search Profiles (simplified version)
export const searchProfiles = async (params: {
  query?: string;
  location?: string;
  minAge?: number;
  maxAge?: number;
  gender?: string;
  passionIds?: number[];
  language?: string;
  limit?: number;
  offset?: number;
  excludeUserId?: string;
}) => {
  const { query, location, minAge, maxAge, gender, passionIds, language, limit = 20, offset = 0, excludeUserId } = params;
  
  let whereConditions = [];
  
  if (excludeUserId) {
    whereConditions.push(sql`${schema.profiles.id} != ${excludeUserId}`);
  }
  
  if (query) {
    whereConditions.push(or(
      ilike(schema.profiles.firstName, `%${query}%`),
      ilike(schema.profiles.lastName, `%${query}%`),
      ilike(schema.profiles.aboutMe, `%${query}%`)
    ));
  }
  
  if (location) {
    whereConditions.push(or(
      ilike(schema.locations.city, `%${location}%`),
      ilike(schema.locations.country, `%${location}%`)
    ));
  }
  
  if (minAge !== undefined) {
    whereConditions.push(sql`${schema.profiles.age} >= ${minAge}`);
  }
  
  if (maxAge !== undefined) {
    whereConditions.push(sql`${schema.profiles.age} <= ${maxAge}`);
  }
  
  if (gender) {
    whereConditions.push(eq(schema.profiles.gender, gender));
  }
  
  // Build query with joins
  let baseQuery = db.select({
    id: schema.profiles.id,
    firstName: schema.profiles.firstName,
    lastName: schema.profiles.lastName,
    aboutMe: schema.profiles.aboutMe,
    age: schema.profiles.age,
    gender: schema.profiles.gender,
    avatarUrl: schema.profiles.avatarUrl,
    location: sql<string>`COALESCE(${schema.locations.city}, '') || ', ' || COALESCE(${schema.locations.country}, '')`,
    createdAt: schema.profiles.createdAt,
  })
    .from(schema.profiles)
    .leftJoin(schema.locations, eq(schema.profiles.locationId, schema.locations.id))
    .leftJoin(schema.userPassions, eq(schema.userPassions.userId, schema.profiles.id))
    .leftJoin(schema.passions, eq(schema.passions.id, schema.userPassions.passionId))
    .leftJoin(schema.profileLanguages, eq(schema.profileLanguages.profileId, schema.profiles.id))
    .leftJoin(schema.languages, eq(schema.languages.id, schema.profileLanguages.languageId))
    .leftJoin(schema.blockedUsers, or(
      and(eq(schema.blockedUsers.blockerId, excludeUserId || ''), eq(schema.blockedUsers.blockedId, schema.profiles.id)),
      and(eq(schema.blockedUsers.blockerId, schema.profiles.id), eq(schema.blockedUsers.blockedId, excludeUserId || ''))
    ));
  
  // Apply where conditions
  if (whereConditions.length > 0) {
    baseQuery = baseQuery.where(and(...whereConditions, isNull(schema.blockedUsers.id)));
  } else {
    baseQuery = baseQuery.where(isNull(schema.blockedUsers.id));
  }
  
  // Group and order
  baseQuery = baseQuery.groupBy(
    schema.profiles.id,
    schema.profiles.firstName,
    schema.profiles.lastName,
    schema.profiles.aboutMe,
    schema.profiles.age,
    schema.profiles.gender,
    schema.profiles.avatarUrl,
    schema.locations.city,
    schema.locations.country,
    schema.profiles.createdAt
  );
  
  baseQuery = baseQuery.orderBy(desc(schema.profiles.createdAt));
  
  // Apply pagination
  return baseQuery.limit(limit).offset(offset);
};

// Analytics
export const analyticsQueries = {
  track: (userId: string | null, eventName: string, properties: Record<string, unknown> = {}, path?: string) => 
    db.insert(schema.analyticsEvents).values({ userId, eventName, properties, path }),
};

// Reports
export const reportQueries = {
  create: (reporterId: string, reportedId: string, reason: string) => db.insert(schema.reports).values({ reporterId, reportedId, reason }),
  getAll: () => db.select().from(schema.reports).orderBy(desc(schema.reports.createdAt)),
  updateStatus: (id: number, status: string) => db.update(schema.reports).set({ status }).where(eq(schema.reports.id, id)),
};

// Verification Requests
export const verificationQueries = {
  create: (userId: string) => db.insert(schema.verificationRequests).values({ userId }),
  getByUserId: (userId: string) => db.select().from(schema.verificationRequests).where(eq(schema.verificationRequests.userId, userId)),
  updateStatus: (id: number, status: string) => db.update(schema.verificationRequests).set({ status }).where(eq(schema.verificationRequests.id, id)),
};

// Contact Requests
export const contactQueries = {
  create: (name: string, email: string, message: string, subject?: string, userId?: string) => 
    db.insert(schema.contactRequests).values({ name, email, message, subject, userId }),
};

// Push Subscriptions
export const pushSubscriptionQueries = {
  add: (userId: string, endpoint: string, p256dh?: string, auth?: string) => 
    db.insert(schema.pushSubscriptions).values({ userId, endpoint, p256dh, auth }).onConflictDoNothing(),
  getByUserId: (userId: string) => db.select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, userId)),
  remove: (userId: string, endpoint: string) => db.delete(schema.pushSubscriptions).where(and(eq(schema.pushSubscriptions.userId, userId), eq(schema.pushSubscriptions.endpoint, endpoint))),
};

// Saved Searches
export const savedSearchQueries = {
  create: (userId: string, name: string, data: Partial<typeof schema.savedSearches.$inferInsert>) => 
    db.insert(schema.savedSearches).values({ userId, name, ...data }),
  getByUserId: (userId: string) => db.select().from(schema.savedSearches).where(eq(schema.savedSearches.userId, userId)),
  delete: (id: number) => db.delete(schema.savedSearches).where(eq(schema.savedSearches.id, id)),
};
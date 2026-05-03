import { and, desc, asc, eq, inArray, or, sql, ne, aliasedTable } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import {
  profiles,
  locations,
  passions,
  languages,
  profilePassions,
  profileLanguages,
  favorites,
  blockedUsers,
  messages,
  userPresence,
  savedSearches,
  notifications,
  reports,
  verificationRequests,
  pushSubscriptions,
  adminSettings,
  contactRequests,
} from '@/lib/db/schema';
import { DEFAULT_ADMIN_SYSTEM_CONTROLS } from '@/lib/admin-dashboard';
import { calculateProfileAge, normalizeBirthDate } from '@/lib/profile-age';
import staticMasterData from '@/lib/static-master-data';

const PRESENCE_TTL_MS = 5 * 60 * 1000;
const ADMIN_SETTINGS_ID = 'global';

type AdminSystemControls = {
  maintenanceBannerText: string;
  moderationHold: boolean;
  followUpUserIds: string[];
  updatedAt: string | null;
};

const lowerCase = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const unique = <T,>(values: T[]) => Array.from(new Set(values));

const nowIso = () => new Date().toISOString();

const normalizeAdminSettings = (row: {
  maintenance_banner_text: string | null;
  moderation_hold: boolean | null;
  follow_up_user_ids: string | null;
  updated_at: string;
}): AdminSystemControls => {
  let followUpUserIds: string[] = [];
  try {
    const parsed = JSON.parse(row.follow_up_user_ids ?? '[]');
    followUpUserIds = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    followUpUserIds = [];
  }
  return {
    maintenanceBannerText: row.maintenance_banner_text ?? '',
    moderationHold: row.moderation_hold ?? false,
    followUpUserIds,
    updatedAt: row.updated_at ?? null,
  };
};

const buildDisplayName = (profile: { first_name: string | null; last_name: string | null; id: string }) => {
  const parts = [profile.first_name, profile.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : profile.id;
};

const buildLocationLabel = (
  locationRow: { city: string; region: string; country: string } | undefined | null
) => {
  if (!locationRow) return null;
  return [locationRow.city, locationRow.region, locationRow.country].filter(Boolean).join(', ') || null;
};

export class AppDataService {
  private readonly userId: string | null;

  constructor(userId?: string | null, _userAgentIgnored?: string) {
    this.userId = userId ?? null;
  }

  private get db() {
    return getDb();
  }

  private requireUserId(): string {
    if (!this.userId) throw new Error('Not authenticated');
    return this.userId;
  }

  // ─── Reference Data ───────────────────────────────────────────────────────

  async listLanguages(): Promise<{ id: string; name: string }[]> {
    const rows = await this.db.select().from(languages).orderBy(asc(languages.name));
    if (rows.length === 0) return staticMasterData.languages ?? [];
    return rows;
  }

  async listPassions(): Promise<{ id: string; name: string }[]> {
    const rows = await this.db.select().from(passions).orderBy(asc(passions.name));
    if (rows.length === 0) return staticMasterData.passions ?? [];
    return rows;
  }

  async listLocations(): Promise<{ id: string; city: string; region: string; country: string }[]> {
    const rows = await this.db.select().from(locations).orderBy(asc(locations.country), asc(locations.region), asc(locations.city));
    if (rows.length === 0) return staticMasterData.locations ?? [];
    return rows;
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  async getProfile(id: string) {
    const [profile] = await this.db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    if (!profile) return null;

    const [passionRows, languageRows] = await Promise.all([
      this.db
        .select({ id: passions.id, name: passions.name })
        .from(profilePassions)
        .innerJoin(passions, eq(profilePassions.passion_id, passions.id))
        .where(eq(profilePassions.profile_id, id)),
      this.db
        .select({ id: languages.id, name: languages.name })
        .from(profileLanguages)
        .innerJoin(languages, eq(profileLanguages.language_id, languages.id))
        .where(eq(profileLanguages.profile_id, id)),
    ]);

    let locationRow: { id: string; city: string; region: string; country: string } | null = null;
    if (profile.location_id) {
      const [loc] = await this.db.select().from(locations).where(eq(locations.id, profile.location_id)).limit(1);
      locationRow = loc ?? null;
    }

    return {
      ...profile,
      passions: passionRows.map((r) => r.name),
      languages: languageRows.map((r) => r.name),
      location: locationRow,
    };
  }

  async saveProfile(id: string, data: any) {
    return this.saveProfileData(id, data);
  }

  async saveProfileData(id: string, data: any) {
    let locationId = data.location_id ?? null;

    if (data.location?.city && data.location?.country) {
      const cityLower = lowerCase(data.location.city);
      const countryLower = lowerCase(data.location.country);
      const allLocations = await this.listLocations();
      const match = allLocations.find(
        (loc) => lowerCase(loc.city) === cityLower && lowerCase(loc.country) === countryLower
      );
      locationId = match?.id ?? null;
    }

    const now = nowIso();
    const profilePayload = {
      id,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      about_me: data.about_me ?? null,
      age: data.birth_date ? null : (data.age ?? null),
      birth_date: normalizeBirthDate(data.birth_date) ?? null,
      gender: data.gender ?? null,
      avatar_url: data.avatar_url ?? null,
      location_id: locationId,
      updated_at: now,
    };

    const existing = await this.db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, id)).limit(1);
    if (existing.length > 0) {
      await this.db.update(profiles).set(profilePayload).where(eq(profiles.id, id));
    } else {
      await this.db.insert(profiles).values({ ...profilePayload, created_at: now });
    }

    // Ensure reference tables are seeded (no-op if rows already exist)
    if (staticMasterData.passions.length > 0) {
      await this.db.insert(passions).values(staticMasterData.passions).onConflictDoNothing();
    }
    if (staticMasterData.languages.length > 0) {
      await this.db.insert(languages).values(staticMasterData.languages).onConflictDoNothing();
    }

    // Sync passions
    await this.db.delete(profilePassions).where(eq(profilePassions.profile_id, id));
    if (Array.isArray(data.passions) && data.passions.length > 0) {
      const allPassions = await this.listPassions();
      const inserts = data.passions
        .map((name: string) => allPassions.find((p) => lowerCase(p.name) === lowerCase(name)))
        .filter(Boolean)
        .map((p: { id: string }) => ({ id: randomUUID(), profile_id: id, passion_id: p.id }));
      if (inserts.length > 0) {
        await this.db.insert(profilePassions).values(inserts);
      }
    }

    // Sync languages
    await this.db.delete(profileLanguages).where(eq(profileLanguages.profile_id, id));
    if (Array.isArray(data.languages) && data.languages.length > 0) {
      const allLanguages = await this.listLanguages();
      const inserts = data.languages
        .map((name: string) => allLanguages.find((l) => lowerCase(l.name) === lowerCase(name)))
        .filter(Boolean)
        .map((l: { id: string }) => ({ id: randomUUID(), profile_id: id, language_id: l.id }));
      if (inserts.length > 0) {
        await this.db.insert(profileLanguages).values(inserts);
      }
    }

    return this.getProfile(id);
  }

  async deleteProfile(id: string) {
    // Cascade deletes — FK constraints handle some, but we also delete orphan rows
    await Promise.all([
      this.db.delete(favorites).where(or(eq(favorites.user_id, id), eq(favorites.favorite_id, id))),
      this.db.delete(blockedUsers).where(or(eq(blockedUsers.blocker_id, id), eq(blockedUsers.blocked_id, id))),
      this.db.delete(messages).where(or(eq(messages.sender_id, id), eq(messages.receiver_id, id))),
      this.db.delete(notifications).where(or(eq(notifications.receiver_id, id), eq(notifications.actor_id, id))),
      this.db.delete(reports).where(or(eq(reports.reporter_id, id), eq(reports.reported_id, id))),
      this.db.delete(savedSearches).where(eq(savedSearches.user_id, id)),
      this.db.delete(verificationRequests).where(eq(verificationRequests.user_id, id)),
      this.db.delete(pushSubscriptions).where(eq(pushSubscriptions.user_id, id)),
      this.db.delete(userPresence).where(eq(userPresence.user_id, id)),
    ]);
    // profilePassions and profileLanguages cascade via FK
    await this.db.delete(profiles).where(eq(profiles.id, id));
    return { success: true };
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  async getMessages(userId: string) {
    return this.listMessagesForUser(userId);
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    const id = randomUUID();
    const now = nowIso();
    await this.db.insert(messages).values({ id, sender_id: senderId, receiver_id: receiverId, content, created_at: now });
    return { id, sender_id: senderId, receiver_id: receiverId, content, created_at: now, read_at: null };
  }

  async listMessagesForUser(userId?: string) {
    const resolvedId = userId ?? this.requireUserId();
    const rows = await this.db
      .select()
      .from(messages)
      .where(or(eq(messages.sender_id, resolvedId), eq(messages.receiver_id, resolvedId)))
      .orderBy(asc(messages.created_at));

    const peerIds = unique(
      rows.flatMap((m) => [m.sender_id, m.receiver_id]).filter((id) => id !== resolvedId)
    );
    const peerProfiles = peerIds.length > 0
      ? await this.db.select().from(profiles).where(inArray(profiles.id, peerIds))
      : [];
    const profileById = new Map(peerProfiles.map((p) => [p.id, p]));

    return rows.map((m) => ({
      ...m,
      direction: m.sender_id === resolvedId ? 'sent' : 'received',
      sender: profileById.get(m.sender_id) ?? { id: m.sender_id, first_name: null, last_name: null },
      receiver: profileById.get(m.receiver_id) ?? { id: m.receiver_id, first_name: null, last_name: null },
    }));
  }

  // ─── Favorites ────────────────────────────────────────────────────────────

  async getFavorites(userId: string) {
    return this.loadSavedProfiles(userId);
  }

  async toggleFavorite(userId: string, favoriteId: string) {
    const [existing] = await this.db
      .select()
      .from(favorites)
      .where(and(eq(favorites.user_id, userId), eq(favorites.favorite_id, favoriteId)))
      .limit(1);

    if (existing) {
      await this.db.delete(favorites).where(eq(favorites.id, existing.id));
      return { saved: false };
    }

    await this.db.insert(favorites).values({ id: randomUUID(), user_id: userId, favorite_id: favoriteId, created_at: nowIso() });
    return { saved: true };
  }

  private async loadSavedProfiles(currentUserId: string) {
    const favRows = await this.db
      .select()
      .from(favorites)
      .where(eq(favorites.user_id, currentUserId))
      .orderBy(desc(favorites.created_at));

    if (favRows.length === 0) return [];

    const profileIds = favRows.map((f) => f.favorite_id);
    const profileRows = await this.db.select().from(profiles).where(inArray(profiles.id, profileIds));
    const profileById = new Map(profileRows.map((p) => [p.id, p]));

    return favRows
      .map((f) => profileById.get(f.favorite_id))
      .filter((p): p is NonNullable<typeof p> => p != null);
  }

  private async getSavedProfiles() {
    const userId = this.requireUserId();
    const profiles = await this.loadSavedProfiles(userId);
    return { data: profiles, error: null };
  }

  // ─── Block / Unblock ──────────────────────────────────────────────────────

  async listBlockedUsers(userId?: string) {
    const resolvedId = userId ?? this.requireUserId();
    const rows = await this.db
      .select()
      .from(blockedUsers)
      .where(eq(blockedUsers.blocker_id, resolvedId))
      .orderBy(desc(blockedUsers.created_at));

    if (rows.length === 0) return [];
    const blockedIds = rows.map((r) => r.blocked_id);
    const profileRows = await this.db.select().from(profiles).where(inArray(profiles.id, blockedIds));
    const profileById = new Map(profileRows.map((p) => [p.id, p]));

    return rows.map((r) => ({
      ...r,
      profile: profileById.get(r.blocked_id) ?? null,
    }));
  }

  private async isBlocked(targetId: string) {
    const userId = this.requireUserId();
    const [row] = await this.db
      .select()
      .from(blockedUsers)
      .where(and(eq(blockedUsers.blocker_id, userId), eq(blockedUsers.blocked_id, targetId)))
      .limit(1);
    return { data: Boolean(row), error: null };
  }

  private async isBlockedBy(targetId: string) {
    const userId = this.requireUserId();
    const [row] = await this.db
      .select()
      .from(blockedUsers)
      .where(and(eq(blockedUsers.blocker_id, targetId), eq(blockedUsers.blocked_id, userId)))
      .limit(1);
    return { data: Boolean(row), error: null };
  }

  private async blockUser(targetId: string) {
    const userId = this.requireUserId();
    const [existing] = await this.db
      .select()
      .from(blockedUsers)
      .where(and(eq(blockedUsers.blocker_id, userId), eq(blockedUsers.blocked_id, targetId)))
      .limit(1);
    if (!existing) {
      await this.db.insert(blockedUsers).values({ id: randomUUID(), blocker_id: userId, blocked_id: targetId, created_at: nowIso() });
    }
    return { data: true, error: null };
  }

  private async unblockUser(targetId: string) {
    const userId = this.requireUserId();
    await this.db
      .delete(blockedUsers)
      .where(and(eq(blockedUsers.blocker_id, userId), eq(blockedUsers.blocked_id, targetId)));
    return { data: true, error: null };
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  async listNotifications() {
    const userId = this.requireUserId();
    const rows = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.receiver_id, userId))
      .orderBy(desc(notifications.created_at));

    const actorIds = unique(rows.map((n) => n.actor_id).filter((id): id is string => Boolean(id)));
    const actorProfiles = actorIds.length > 0
      ? await this.db.select().from(profiles).where(inArray(profiles.id, actorIds))
      : [];
    const profileById = new Map(actorProfiles.map((p) => [p.id, p]));

    return rows.map((n) => {
      const actor = n.actor_id ? profileById.get(n.actor_id) : undefined;
      return {
        id: n.id,
        type: n.type,
        read: n.read ?? false,
        createdAt: n.created_at,
        actorId: n.actor_id ?? undefined,
        actorName: actor ? buildDisplayName(actor) : undefined,
        title: n.title,
        body: n.body ?? undefined,
        url: n.url ?? undefined,
      };
    });
  }

  async markNotificationRead(notificationId: string) {
    this.requireUserId();
    await this.db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
    return { data: true, error: null };
  }

  async markAllNotificationsRead() {
    const userId = this.requireUserId();
    await this.db.update(notifications).set({ read: true }).where(eq(notifications.receiver_id, userId));
    return { data: true, error: null };
  }

  async listAdminNotificationsForUser(userId: string) {
    const rows = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.receiver_id, userId))
      .orderBy(desc(notifications.created_at));
    return rows.map((n) => ({
      id: n.id,
      type: n.type,
      read: n.read ?? false,
      createdAt: n.created_at,
      actorId: n.actor_id ?? undefined,
      title: n.title,
      body: n.body ?? undefined,
      url: n.url ?? undefined,
    }));
  }

  // ─── Reports ──────────────────────────────────────────────────────────────

  async createReport(payload: { reporterId: string; reportedId: string; reason: string }) {
    const id = randomUUID();
    await this.db.insert(reports).values({
      id,
      reporter_id: payload.reporterId,
      reported_id: payload.reportedId,
      reason: payload.reason,
      status: 'pending',
      created_at: nowIso(),
    });
    return { data: { id }, error: null };
  }

  async listReports() {
    const rows = await this.db.select().from(reports).orderBy(desc(reports.created_at));
    const profileIds = unique(rows.flatMap((r) => [r.reporter_id, r.reported_id]));
    const profileRows = profileIds.length > 0
      ? await this.db.select().from(profiles).where(inArray(profiles.id, profileIds))
      : [];
    const profileById = new Map(profileRows.map((p) => [p.id, p]));
    return rows.map((r) => ({
      ...r,
      reporter: profileById.get(r.reporter_id) ?? null,
      reported: profileById.get(r.reported_id) ?? null,
    }));
  }

  async updateReportStatus(id: string, status: string) {
    await this.db.update(reports).set({ status }).where(eq(reports.id, id));
    return { data: true, error: null };
  }

  // ─── Verification Requests ────────────────────────────────────────────────

  async listVerificationRequests() {
    const rows = await this.db.select().from(verificationRequests).orderBy(desc(verificationRequests.created_at));
    const profileIds = unique(rows.map((r) => r.user_id));
    const profileRows = profileIds.length > 0
      ? await this.db.select().from(profiles).where(inArray(profiles.id, profileIds))
      : [];
    const profileById = new Map(profileRows.map((p) => [p.id, p]));
    return rows.map((r) => ({
      ...r,
      profiles: profileById.get(r.user_id) ?? null,
    }));
  }

  async listVerificationRequestsForUser(userId?: string) {
    const resolvedId = userId ?? this.requireUserId();
    return this.db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.user_id, resolvedId))
      .orderBy(desc(verificationRequests.created_at));
  }

  async updateVerificationRequest(id: string, status: string, userId?: string) {
    await this.db.update(verificationRequests).set({ status }).where(eq(verificationRequests.id, id));
    if (status === 'approved' && userId) {
      await this.db.update(profiles).set({ verified: true, updated_at: nowIso() }).where(eq(profiles.id, userId));
    }
    return { success: true };
  }

  // ─── Saved Searches ───────────────────────────────────────────────────────

  async listSavedSearches(userId?: string) {
    const resolvedId = userId ?? this.requireUserId();
    return this.db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.user_id, resolvedId))
      .orderBy(desc(savedSearches.created_at));
  }

  // ─── Presence ─────────────────────────────────────────────────────────────

  private async trackPresence(_requestedUserId?: string, requestedOnlineAt?: string) {
    const userId = this.requireUserId();
    const onlineAt =
      typeof requestedOnlineAt === 'string' && !Number.isNaN(Date.parse(requestedOnlineAt))
        ? requestedOnlineAt
        : nowIso();

    await this.db
      .insert(userPresence)
      .values({ id: userId, user_id: userId, online_at: onlineAt })
      .onConflictDoUpdate({ target: userPresence.user_id, set: { online_at: onlineAt } });

    return { data: { user_id: userId, online_at: onlineAt }, error: null };
  }

  private async clearPresence(_requestedUserId?: string) {
    const userId = this.requireUserId();
    await this.db.delete(userPresence).where(eq(userPresence.user_id, userId));
    return { data: true, error: null };
  }

  private async getOnlineUsers() {
    const cutoff = new Date(Date.now() - PRESENCE_TTL_MS).toISOString();
    const activeRows = await this.db
      .select()
      .from(userPresence)
      .where(sql`${userPresence.online_at} >= ${cutoff}`)
      .orderBy(desc(userPresence.online_at));

    // Clean up stale rows
    await this.db.delete(userPresence).where(sql`${userPresence.online_at} < ${cutoff}`);

    return {
      data: activeRows.map((r) => ({ user_id: r.user_id, online_at: r.online_at })),
      error: null,
    };
  }

  // ─── Push Subscriptions ───────────────────────────────────────────────────

  async savePushSubscription(payload: { userId: string; endpoint: string; p256dh?: string; auth?: string }) {
    const [existing] = await this.db
      .select()
      .from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.user_id, payload.userId), eq(pushSubscriptions.endpoint, payload.endpoint)))
      .limit(1);
    if (existing) return { success: true, duplicate: true };
    await this.db.insert(pushSubscriptions).values({
      id: randomUUID(),
      user_id: payload.userId,
      endpoint: payload.endpoint,
      p256dh: payload.p256dh ?? null,
      auth: payload.auth ?? null,
    });
    return { success: true };
  }

  async deletePushSubscription(userId: string, endpoint?: string) {
    if (endpoint) {
      await this.db
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.user_id, userId), eq(pushSubscriptions.endpoint, endpoint)));
    } else {
      await this.db.delete(pushSubscriptions).where(eq(pushSubscriptions.user_id, userId));
    }
    return { success: true };
  }

  // ─── Contact Requests ─────────────────────────────────────────────────────

  async createContactRequest(payload: { name: string; email: string; subject: string; message: string; category: string }) {
    await this.db.insert(contactRequests).values({
      id: randomUUID(),
      ...payload,
      status: 'pending',
      created_at: nowIso(),
    });
    return { success: true };
  }

  // ─── Admin Settings ───────────────────────────────────────────────────────

  async getAdminSettings(): Promise<AdminSystemControls> {
    const [row] = await this.db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.id, ADMIN_SETTINGS_ID))
      .limit(1);
    if (!row) return { ...DEFAULT_ADMIN_SYSTEM_CONTROLS };
    return normalizeAdminSettings(row);
  }

  async updateAdminSettings(patch: { maintenanceBannerText?: string; moderationHold?: boolean; followUpUserIds?: string[] }) {
    const current = await this.getAdminSettings();
    const now = nowIso();
    const next: AdminSystemControls = {
      maintenanceBannerText: patch.maintenanceBannerText !== undefined ? patch.maintenanceBannerText : current.maintenanceBannerText,
      moderationHold: patch.moderationHold !== undefined ? patch.moderationHold : current.moderationHold,
      followUpUserIds: patch.followUpUserIds ?? current.followUpUserIds,
      updatedAt: now,
    };

    await this.db
      .insert(adminSettings)
      .values({
        id: ADMIN_SETTINGS_ID,
        maintenance_banner_text: next.maintenanceBannerText,
        moderation_hold: next.moderationHold,
        follow_up_user_ids: JSON.stringify(next.followUpUserIds),
        updated_at: now,
      })
      .onConflictDoUpdate({
        target: adminSettings.id,
        set: {
          maintenance_banner_text: next.maintenanceBannerText,
          moderation_hold: next.moderationHold,
          follow_up_user_ids: JSON.stringify(next.followUpUserIds),
          updated_at: now,
        },
      });

    return next;
  }

  async toggleAdminFollowUp(userId: string, enabled: boolean) {
    const current = await this.getAdminSettings();
    const followUpUserIds = enabled
      ? unique([...current.followUpUserIds, userId])
      : current.followUpUserIds.filter((id) => id !== userId);
    return this.updateAdminSettings({ followUpUserIds });
  }

  async setAdminUserVerified(userId: string, verified: boolean) {
    await this.db.update(profiles).set({ verified, updated_at: nowIso() }).where(eq(profiles.id, userId));
    if (verified) {
      const requests = await this.listVerificationRequestsForUser(userId);
      const pending = requests.find((r) => r.status === 'pending');
      if (pending?.id) {
        await this.updateVerificationRequest(String(pending.id), 'approved', userId);
      }
    }
    return { success: true };
  }

  async sendAdminMessage(payload: { adminUserId: string; userId: string; content: string }) {
    const message = await this.sendMessage(payload.adminUserId, payload.userId, payload.content);
    await this.invokeCompatFunction('send-push', {
      actor_id: payload.adminUserId,
      receiver_id: payload.userId,
      title: 'Admin message',
      body: payload.content,
      notification_type: 'message',
      url: '/messages',
    });
    return message;
  }

  async sendAdminNotification(payload: { adminUserId: string; userId: string; title: string; body: string; url?: string }) {
    return this.invokeCompatFunction('send-push', {
      actor_id: payload.adminUserId,
      receiver_id: payload.userId,
      title: payload.title,
      body: payload.body,
      notification_type: 'admin_notice',
      url: payload.url ?? '/notifications',
    });
  }

  // ─── Admin Profiles List ──────────────────────────────────────────────────

  async listAdminProfiles(options?: { query?: string | null; limit?: number | null }) {
    const limitVal = typeof options?.limit === 'number' && options.limit > 0 ? Math.min(options.limit, 25) : 8;
    const allProfiles = await this.db.select().from(profiles).orderBy(desc(profiles.created_at));
    const allLocations = await this.listLocations();
    const settings = await this.getAdminSettings();
    const flaggedUsers = new Set(settings.followUpUserIds);
    const locById = new Map(allLocations.map((l) => [l.id, l]));

    const [messageCounts, savedSearchCounts, blockedCounts, openReports, pendingVerifs] = await Promise.all([
      this.db.select({ user_id: messages.sender_id, count: sql<number>`count(*)` }).from(messages).groupBy(messages.sender_id),
      this.db.select({ user_id: savedSearches.user_id, count: sql<number>`count(*)` }).from(savedSearches).groupBy(savedSearches.user_id),
      this.db.select({ user_id: blockedUsers.blocker_id, count: sql<number>`count(*)` }).from(blockedUsers).groupBy(blockedUsers.blocker_id),
      this.db.select({ user_id: reports.reported_id }).from(reports).where(ne(reports.status, 'resolved')),
      this.db.select({ user_id: verificationRequests.user_id }).from(verificationRequests).where(eq(verificationRequests.status, 'pending')),
    ]);

    const msgCountById = new Map(messageCounts.map((r) => [r.user_id, Number(r.count)]));
    const searchCountById = new Map(savedSearchCounts.map((r) => [r.user_id, Number(r.count)]));
    const blockCountById = new Map(blockedCounts.map((r) => [r.user_id, Number(r.count)]));
    const openReportIds = new Map<string, number>();
    for (const r of openReports) {
      openReportIds.set(r.user_id, (openReportIds.get(r.user_id) ?? 0) + 1);
    }
    const pendingVerifSet = new Set(pendingVerifs.map((r) => r.user_id));

    const queryLower = lowerCase(options?.query);

    return allProfiles
      .map((p) => {
        const loc = p.location_id ? locById.get(p.location_id) : null;
        return {
          id: p.id,
          displayName: buildDisplayName(p),
          firstName: p.first_name,
          lastName: p.last_name,
          verified: p.verified ?? false,
          location: loc ? buildLocationLabel(loc) : null,
          joinedAt: p.created_at,
          lastActiveAt: p.last_login ?? p.updated_at,
          openReports: openReportIds.get(p.id) ?? 0,
          pendingVerification: pendingVerifSet.has(p.id),
          savedSearchCount: searchCountById.get(p.id) ?? 0,
          blockedCount: blockCountById.get(p.id) ?? 0,
          messageCount: msgCountById.get(p.id) ?? 0,
          flaggedForFollowUp: flaggedUsers.has(p.id),
        };
      })
      .filter((p) => {
        if (!queryLower) return true;
        return [p.displayName, p.id, p.location ?? ''].some((v) => lowerCase(v).includes(queryLower));
      })
      .sort((a, b) => {
        if (a.flaggedForFollowUp !== b.flaggedForFollowUp) return a.flaggedForFollowUp ? -1 : 1;
        if (a.openReports !== b.openReports) return b.openReports - a.openReports;
        if (a.pendingVerification !== b.pendingVerification) return a.pendingVerification ? -1 : 1;
        return (b.lastActiveAt ?? '').localeCompare(a.lastActiveAt ?? '');
      })
      .slice(0, limitVal);
  }

  async getAdminUserInvestigation(userId: string) {
    const [profile, allProfiles, msgs, searches, blocked, verifs, allReports, notifs] = await Promise.all([
      this.getProfile(userId),
      this.listAdminProfiles({ query: userId, limit: 50 }),
      this.listMessagesForUser(userId),
      this.listSavedSearches(userId),
      this.listBlockedUsers(userId),
      this.listVerificationRequestsForUser(userId),
      this.listReports(),
      this.listAdminNotificationsForUser(userId),
    ]);

    const baseUser = allProfiles.find((p) => p.id === userId);
    if (!profile || !baseUser) throw new Error('User not found');

    return {
      user: {
        ...baseUser,
        aboutMe: (profile as any).about_me ?? null,
        age: (profile as any).age ?? null,
        gender: (profile as any).gender ?? null,
        passions: Array.isArray((profile as any).passions) ? (profile as any).passions : [],
        languages: Array.isArray((profile as any).languages) ? (profile as any).languages : [],
        isPrivate: (profile as any).is_private ?? false,
      },
      messages: msgs.map((m) => ({
        id: m.id,
        createdAt: m.created_at,
        direction: (m as any).direction,
        content: m.content,
        sender: { id: m.sender_id, firstName: (m as any).sender?.first_name ?? null, lastName: (m as any).sender?.last_name ?? null },
        receiver: { id: m.receiver_id, firstName: (m as any).receiver?.first_name ?? null, lastName: (m as any).receiver?.last_name ?? null },
      })),
      savedSearches: searches.map((s) => ({
        id: s.id,
        name: s.name,
        query: s.query ?? null,
        location: s.location ?? null,
        language: s.language ?? null,
        gender: s.gender ?? null,
        minAge: s.min_age ?? null,
        maxAge: s.max_age ?? null,
        passionIds: s.passion_ids ?? [],
        createdAt: s.created_at,
      })),
      blockedUsers: blocked.map((b) => ({
        id: b.id,
        blockedId: b.blocked_id,
        createdAt: b.created_at,
        profile: (b as any).profile ?? null,
      })),
      verificationHistory: verifs.map((v) => ({
        id: v.id,
        status: v.status ?? 'pending',
        createdAt: v.created_at,
      })),
      notifications: notifs,
      reportsFiled: allReports.filter((r) => r.reporter_id === userId),
      reportsAgainst: allReports.filter((r) => r.reported_id === userId),
    };
  }

  async getAdminDashboardSnapshot() {
    const [allReports, allVerifs, settings, locs, profileList, msgCount, favCount, notifCount, pushCount] = await Promise.all([
      this.listReports(),
      this.listVerificationRequests(),
      this.getAdminSettings(),
      this.listLocations(),
      this.db.select().from(profiles),
      this.db.select({ count: sql<number>`count(*)` }).from(messages),
      this.db.select({ count: sql<number>`count(*)` }).from(favorites),
      this.db.select().from(notifications),
      this.db.select({ count: sql<number>`count(*)` }).from(pushSubscriptions),
    ]);

    const locById = new Map(locs.map((l) => [l.id, l]));
    const pendingReports = allReports.filter((r) => r.status === 'pending');
    const pendingVerifs = allVerifs.filter((r) => r.status === 'pending');

    const buildQueueUser = (p: (typeof profileList)[number] | undefined | null) =>
      p
        ? {
            id: p.id,
            firstName: p.first_name,
            lastName: p.last_name,
            displayName: buildDisplayName(p),
            verified: p.verified ?? false,
            location: p.location_id ? buildLocationLabel(locById.get(p.location_id) ?? null) : null,
            avatarUrl: p.avatar_url,
          }
        : null;

    const profileById = new Map(profileList.map((p) => [p.id, p]));

    const unreadNotifications = notifCount.filter((n) => !n.read).length;

    return {
      overview: {
        totalProfiles: profileList.length,
        verifiedProfiles: profileList.filter((p) => p.verified).length,
        completedProfiles: profileList.filter((p) => p.first_name && p.last_name && p.birth_date && p.gender).length,
        totalMessages: Number(msgCount[0]?.count ?? 0),
        totalFavorites: Number(favCount[0]?.count ?? 0),
        totalNotifications: notifCount.length,
        unreadNotifications,
        activePushSubscriptions: Number(pushCount[0]?.count ?? 0),
        totalReports: allReports.length,
        pendingReports: pendingReports.length,
        totalVerificationRequests: allVerifs.length,
        pendingVerificationRequests: pendingVerifs.length,
      },
      queues: {
        reports: pendingReports.slice(0, 5).map((r) => ({
          id: r.id,
          reason: r.reason,
          status: r.status ?? 'pending',
          createdAt: r.created_at,
          reporterId: r.reporter_id,
          reportedId: r.reported_id,
          reporter: buildQueueUser(profileById.get(r.reporter_id)),
          reported: buildQueueUser(profileById.get(r.reported_id)),
        })),
        verificationRequests: pendingVerifs.slice(0, 5).map((v) => ({
          id: v.id,
          userId: v.user_id,
          status: v.status ?? 'pending',
          createdAt: v.created_at,
          profile: buildQueueUser(profileById.get(v.user_id)),
        })),
      },
      quickActions: {
        pendingReports: pendingReports.length,
        pendingVerificationRequests: pendingVerifs.length,
        flaggedUsers: settings.followUpUserIds.length,
        unreadNotifications,
        totalQueueItems: pendingReports.length + pendingVerifs.length,
      },
      systemControls: settings,
      lastUpdatedAt: nowIso(),
    };
  }

  // ─── Search / Discovery ───────────────────────────────────────────────────

  private async searchProfiles(filters: Record<string, any>) {
    const currentUserId = filters.p_current_user_id ? String(filters.p_current_user_id) : null;
    const queryText = lowerCase(filters.p_query);
    const locationQuery = lowerCase(filters.p_location);
    const languageQuery = lowerCase(filters.p_language);
    const genderFilter = lowerCase(filters.p_gender);
    const passionFilter: string[] = Array.isArray(filters.p_passion_ids)
      ? filters.p_passion_ids.map((v: unknown) => String(v))
      : [];
    const toNum = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
    const minAge = toNum(filters.p_min_age);
    const maxAge = toNum(filters.p_max_age);
    const offset = Math.max(0, Math.floor(toNum(filters.p_offset) ?? 0));
    const limit = Math.max(1, Math.floor(toNum(filters.p_limit) ?? 10));

    const allLocations = await this.listLocations();
    const locById = new Map(allLocations.map((l) => [l.id, l]));

    let blockedByCurrent = new Set<string>();
    let blockedCurrent = new Set<string>();
    if (currentUserId) {
      const [bbc, bc] = await Promise.all([
        this.db.select({ id: blockedUsers.blocked_id }).from(blockedUsers).where(eq(blockedUsers.blocker_id, currentUserId)),
        this.db.select({ id: blockedUsers.blocker_id }).from(blockedUsers).where(eq(blockedUsers.blocked_id, currentUserId)),
      ]);
      blockedByCurrent = new Set(bbc.map((r) => r.id));
      blockedCurrent = new Set(bc.map((r) => r.id));
    }

    let matchedLocationIds: string[] | null = null;
    if (locationQuery) {
      matchedLocationIds = allLocations
        .filter((l) => [l.city, l.region, l.country].filter(Boolean).join(', ').toLowerCase().includes(locationQuery))
        .map((l) => l.id);
      if (matchedLocationIds.length === 0) return { data: [], error: null };
    }

    // Fetch all profiles (batched server-side filtering for SQLite/Turso)
    const allProfileRows = await this.db.select().from(profiles).orderBy(desc(profiles.created_at));
    const allPassionRows = await this.db.select().from(profilePassions);
    const allLanguageRows = await this.db.select().from(profileLanguages);
    const allPassions = await this.listPassions();
    const allLanguages = await this.listLanguages();

    const passionNameById = new Map(allPassions.map((p) => [p.id, p.name]));
    const languageNameById = new Map(allLanguages.map((l) => [l.id, l.name]));
    const passionIdsByProfile = new Map<string, string[]>();
    const passionNamesByProfile = new Map<string, string[]>();
    const languageNamesByProfile = new Map<string, string[]>();

    for (const row of allPassionRows) {
      const ids = passionIdsByProfile.get(row.profile_id) ?? [];
      ids.push(row.passion_id);
      passionIdsByProfile.set(row.profile_id, ids);
      const names = passionNamesByProfile.get(row.profile_id) ?? [];
      const name = passionNameById.get(row.passion_id);
      if (name) names.push(name);
      passionNamesByProfile.set(row.profile_id, names);
    }

    for (const row of allLanguageRows) {
      const names = languageNamesByProfile.get(row.profile_id) ?? [];
      const name = languageNameById.get(row.language_id);
      if (name) names.push(name);
      languageNamesByProfile.set(row.profile_id, names);
    }

    const results: any[] = [];

    for (const p of allProfileRows) {
      if (currentUserId && p.id === currentUserId) continue;
      if (currentUserId && (blockedByCurrent.has(p.id) || blockedCurrent.has(p.id))) continue;
      if (matchedLocationIds && !matchedLocationIds.includes(p.location_id ?? '')) continue;

      const age = calculateProfileAge(p);
      if (minAge !== null && (age === null || age < minAge)) continue;
      if (maxAge !== null && (age === null || age > maxAge)) continue;
      if (genderFilter && lowerCase(p.gender) !== genderFilter) continue;

      if (queryText) {
        const haystack = [p.first_name, p.last_name, p.about_me].map(lowerCase).join(' ');
        if (!haystack.includes(queryText)) continue;
      }

      if (languageQuery) {
        const langs = languageNamesByProfile.get(p.id) ?? [];
        if (!langs.some((l) => lowerCase(l).includes(languageQuery))) continue;
      }

      if (passionFilter.length > 0) {
        const ids = passionIdsByProfile.get(p.id) ?? [];
        if (!passionFilter.some((id) => ids.includes(id))) continue;
      }

      const loc = p.location_id ? locById.get(p.location_id) : null;
      results.push({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        about_me: p.about_me,
        location: loc ? buildLocationLabel(loc) : null,
        age: p.show_age === false ? null : age,
        gender: p.gender,
        profile_languages: languageNamesByProfile.get(p.id) ?? [],
        profilepassions: passionNamesByProfile.get(p.id) ?? [],
        created_at: p.created_at,
        last_login: p.last_login,
        is_private: p.is_private ?? false,
        show_age: p.show_age ?? true,
        show_location: p.show_location ?? true,
      });
    }

    return { data: results.slice(offset, offset + limit), error: null };
  }

  private async getSuggestedProfiles(currentUserId: string, limit: number) {
    const currentPassions = await this.db
      .select()
      .from(profilePassions)
      .where(eq(profilePassions.profile_id, currentUserId));
    const currentPassionIds = new Set(currentPassions.map((r) => r.passion_id));

    const searchResult = await this.searchProfiles({ p_current_user_id: currentUserId, p_limit: 500, p_offset: 0 });
    const allData = (searchResult.data as any[]) ?? [];
    const allPassionRows = await this.db.select().from(profilePassions);
    const passionIdsByProfile = new Map<string, string[]>();
    for (const row of allPassionRows) {
      const ids = passionIdsByProfile.get(row.profile_id) ?? [];
      ids.push(row.passion_id);
      passionIdsByProfile.set(row.profile_id, ids);
    }

    const suggestions = allData
      .map((p) => {
        const shared = (passionIdsByProfile.get(String(p.id)) ?? []).filter((id) => currentPassionIds.has(id)).length;
        return { ...p, shared_passions_count: shared };
      })
      .filter((p) => p.shared_passions_count > 0)
      .sort((a, b) => b.shared_passions_count - a.shared_passions_count || (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      .slice(0, limit);

    return { data: suggestions, error: null };
  }

  private async getConversations(currentUserId: string) {
    const allMessages = await this.db
      .select()
      .from(messages)
      .where(or(eq(messages.sender_id, currentUserId), eq(messages.receiver_id, currentUserId)))
      .orderBy(desc(messages.created_at));

    const conversationMap = new Map<string, (typeof allMessages)[number]>();
    for (const m of allMessages) {
      const peerId = m.sender_id === currentUserId ? m.receiver_id : m.sender_id;
      if (!conversationMap.has(peerId)) conversationMap.set(peerId, m);
    }

    const peerIds = Array.from(conversationMap.keys());
    const peerProfiles = peerIds.length > 0 ? await this.db.select().from(profiles).where(inArray(profiles.id, peerIds)) : [];
    const profileById = new Map(peerProfiles.map((p) => [p.id, p]));

    const conversations = Array.from(conversationMap.entries()).map(([peerId, lastMsg]) => ({
      peer_id: peerId,
      peer: profileById.get(peerId) ?? { id: peerId, first_name: null, last_name: null },
      last_message: lastMsg,
      unread_count: allMessages.filter(
        (m) => m.sender_id === peerId && m.receiver_id === currentUserId && !m.read_at
      ).length,
    }));

    return { data: conversations, error: null };
  }

  private async getRecentConversations(currentUserId: string) {
    const result = await this.getConversations(currentUserId);
    return { data: (result.data as any[]).slice(0, 5), error: result.error };
  }

  private async markMessagesAsRead(senderId: string, receiverId: string) {
    const resolvedReceiverId = receiverId || this.requireUserId();
    await this.db
      .update(messages)
      .set({ read_at: nowIso() })
      .where(and(eq(messages.sender_id, senderId), eq(messages.receiver_id, resolvedReceiverId)));
    return { data: true, error: null };
  }

  private async isSaved(targetId: string) {
    const userId = this.requireUserId();
    const [row] = await this.db
      .select()
      .from(favorites)
      .where(and(eq(favorites.user_id, userId), eq(favorites.favorite_id, targetId)))
      .limit(1);
    return { data: Boolean(row), error: null };
  }

  private async saveProfileToFavorites(targetId: string) {
    const userId = this.requireUserId();
    await this.toggleFavorite(userId, targetId);
    return { data: true, error: null };
  }

  private async unsaveProfile(targetId: string) {
    const userId = this.requireUserId();
    await this.db
      .delete(favorites)
      .where(and(eq(favorites.user_id, userId), eq(favorites.favorite_id, targetId)));
    return { data: true, error: null };
  }

  private async getDistinctCountries() {
    const locs = await this.listLocations();
    return { data: unique(locs.map((l) => l.country).filter(Boolean)).sort().map((c) => ({ country: c })), error: null };
  }

  private async getDistinctRegions(country?: string) {
    const locs = await this.listLocations();
    const filtered = country ? locs.filter((l) => l.country === country) : locs;
    return { data: unique(filtered.map((l) => l.region).filter(Boolean)).sort().map((r) => ({ region: r })), error: null };
  }

  private async getDistinctCities(country?: string, region?: string) {
    const locs = await this.listLocations();
    const filtered = locs.filter((l) => (!country || l.country === country) && (!region || l.region === region));
    return { data: unique(filtered.map((l) => l.city).filter(Boolean)).sort().map((c) => ({ city: c })), error: null };
  }

  // ─── Data Export ──────────────────────────────────────────────────────────

  async exportCurrentUserData() {
    const userId = this.requireUserId();
    const [profile, msgs, notifs, favs, blocked, searches, verifs] = await Promise.all([
      this.getProfile(userId),
      this.listMessagesForUser(userId),
      this.listNotifications(),
      this.loadSavedProfiles(userId),
      this.listBlockedUsers(userId),
      this.listSavedSearches(userId),
      this.listVerificationRequestsForUser(userId),
    ]);
    return { exported_at: nowIso(), profile, messages: msgs, notifications: notifs, favorites: favs, blocked_users: blocked, saved_searches: searches, verification_requests: verifs };
  }

  // ─── Generic Collection Operations (used by /api/internal/collection) ─────

  async executeCollectionOperation(collection: string, op: {
    action: string;
    select?: string | null;
    filters?: Array<{ type: string; column?: string; value?: unknown; expression?: string }>;
    order?: { column: string; ascending: boolean } | null;
    range?: { from: number; to: number } | null;
    limit?: number | null;
    single?: boolean;
    maybeSingle?: boolean;
    payload?: any;
  }) {
    switch (collection) {
      case 'profiles': {
        if (op.action === 'select') {
          const idFilter = (op.filters ?? []).find((f) => f.type === 'eq' && f.column === 'id');
          if (!idFilter) {
            const rows = await this.db.select().from(profiles);
            return { data: rows, error: null };
          }
          const [row] = await this.db
            .select()
            .from(profiles)
            .where(eq(profiles.id, String(idFilter.value)))
            .limit(1);
          return { data: (op.maybeSingle || op.single) ? (row ?? null) : (row ? [row] : []), error: null };
        }
        break;
      }
      case 'passions': {
        if (op.action === 'select') {
          const rows = await this.db.select().from(passions).orderBy(asc(passions.name));
          return { data: rows, error: null };
        }
        break;
      }
      case 'languages': {
        if (op.action === 'select') {
          const rows = await this.db.select().from(languages).orderBy(asc(languages.name));
          return { data: rows, error: null };
        }
        break;
      }
      case 'profile_passions': {
        if (op.action === 'select') {
          const profileIdFilter = (op.filters ?? []).find((f) => f.type === 'eq' && f.column === 'profile_id');
          if (!profileIdFilter) return { data: [], error: null };
          const rows = await this.db
            .select({ passion_id: profilePassions.passion_id, passions: { name: passions.name } })
            .from(profilePassions)
            .innerJoin(passions, eq(profilePassions.passion_id, passions.id))
            .where(eq(profilePassions.profile_id, String(profileIdFilter.value)));
          return { data: rows, error: null };
        }
        break;
      }
      case 'saved_searches': {
        if (op.action === 'select') {
          const userIdFilter = (op.filters ?? []).find((f) => f.type === 'eq' && f.column === 'user_id');
          const userId = userIdFilter ? String(userIdFilter.value) : this.requireUserId();
          const rows = await this.db
            .select()
            .from(savedSearches)
            .where(eq(savedSearches.user_id, userId))
            .orderBy(desc(savedSearches.created_at));
          return { data: rows, error: null };
        }
        if (op.action === 'insert' && op.payload) {
          const [inserted] = await this.db
            .insert(savedSearches)
            .values({ id: randomUUID(), ...op.payload })
            .returning();
          return { data: inserted ?? null, error: null };
        }
        if (op.action === 'delete') {
          const idFilter = (op.filters ?? []).find((f) => f.type === 'eq' && f.column === 'id');
          if (!idFilter) return { data: null, error: { message: 'Missing id filter for delete' } };
          await this.db.delete(savedSearches).where(eq(savedSearches.id, String(idFilter.value)));
          return { data: null, error: null };
        }
        break;
      }
      case 'messages': {
        if (op.action === 'select') {
          const orFilter = (op.filters ?? []).find((f) => f.type === 'or' && f.expression);
          if (!orFilter?.expression) return { data: [], error: null };
          const match = orFilter.expression.match(
            /^and\(sender_id\.eq\.([^,]+),receiver_id\.eq\.([^)]+)\),and\(sender_id\.eq\.([^,]+),receiver_id\.eq\.([^)]+)\)$/
          );
          if (!match) return { data: [], error: null };
          const [, userA, userB] = match;
          const senderProfile = aliasedTable(profiles, 'sender_profile');
          const receiverProfile = aliasedTable(profiles, 'receiver_profile');
          const rows = await this.db
            .select({
              id: messages.id,
              created_at: messages.created_at,
              sender_id: messages.sender_id,
              receiver_id: messages.receiver_id,
              content: messages.content,
              sender: {
                id: senderProfile.id,
                first_name: senderProfile.first_name,
                last_name: senderProfile.last_name,
              },
              receiver: {
                id: receiverProfile.id,
                first_name: receiverProfile.first_name,
                last_name: receiverProfile.last_name,
              },
            })
            .from(messages)
            .leftJoin(senderProfile, eq(messages.sender_id, senderProfile.id))
            .leftJoin(receiverProfile, eq(messages.receiver_id, receiverProfile.id))
            .where(
              or(
                and(eq(messages.sender_id, userA), eq(messages.receiver_id, userB)),
                and(eq(messages.sender_id, userB), eq(messages.receiver_id, userA))
              )
            )
            .orderBy(desc(messages.created_at))
            .offset(op.range?.from ?? 0)
            .limit(op.range != null ? op.range.to - op.range.from + 1 : (op.limit ?? 50));
          return { data: rows, error: null };
        }
        if (op.action === 'insert' && op.payload) {
          const [inserted] = await this.db
            .insert(messages)
            .values({ id: randomUUID(), ...op.payload })
            .returning();
          return { data: inserted ?? null, error: null };
        }
        break;
      }
      default:
        return { data: null, error: { message: `Unknown collection: ${collection}` } };
    }
    return { data: null, error: { message: `Unsupported operation: ${collection}.${op.action}` } };
  }

  // ─── Compat RPC (used by /api/internal/rpc) ───────────────────────────────

  async invokeCompatFunction(_name: string, _data?: any) {
    // Push notifications are dispatched separately via the Appwrite Functions replacement.
    // For now, this is a no-op placeholder. Implement with your push provider of choice.
    return { data: null, error: null };
  }

  async executeCompatRpc(name: string, args?: Record<string, any>) {
    switch (name) {
      case 'get_distinct_countries':
        return this.getDistinctCountries();
      case 'get_distinct_regions':
        return this.getDistinctRegions(args?.p_country);
      case 'get_distinct_cities':
        return this.getDistinctCities(args?.p_country, args?.p_region);
      case 'is_blocked':
        return this.isBlocked(String(args?.target_id ?? ''));
      case 'is_blocked_by':
        return this.isBlockedBy(String(args?.target_id ?? ''));
      case 'block_user':
        return this.blockUser(String(args?.target_id ?? ''));
      case 'unblock_user':
        return this.unblockUser(String(args?.target_id ?? ''));
      case 'list_blocked_users':
        return { data: await this.listBlockedUsers(args?.user_id ?? undefined), error: null };
      case 'is_saved':
        return this.isSaved(String(args?.target_id ?? ''));
      case 'save_profile':
        return this.saveProfileToFavorites(String(args?.target_id ?? ''));
      case 'unsave_profile':
        return this.unsaveProfile(String(args?.target_id ?? ''));
      case 'get_saved_profiles':
        return this.getSavedProfiles();
      case 'get_conversations':
        return this.getConversations(String(args?.current_user_id ?? ''));
      case 'get_recent_conversations':
        return this.getRecentConversations(String(args?.current_user_id ?? ''));
      case 'mark_messages_as_read':
        return this.markMessagesAsRead(
          String(args?.sender_id_param ?? args?.sender_id ?? ''),
          String(args?.receiver_id_param ?? args?.receiver_id ?? '')
        );
      case 'track_presence':
        return this.trackPresence(String(args?.user_id ?? ''), args?.online_at);
      case 'clear_presence':
        return this.clearPresence(String(args?.user_id ?? ''));
      case 'get_online_users':
        return this.getOnlineUsers();
      case 'search_profiles':
        return this.searchProfiles(args ?? {});
      case 'get_suggested_profiles':
        return this.getSuggestedProfiles(String(args?.current_user_id ?? ''), Number(args?.p_limit ?? 5));
      case 'get_profile_passions': {
        const profileId = String(args?.profile_id ?? '');
        const rows = await this.db
          .select({ name: passions.name })
          .from(profilePassions)
          .innerJoin(passions, eq(profilePassions.passion_id, passions.id))
          .where(eq(profilePassions.profile_id, profileId))
          .orderBy(asc(passions.name));
        return { data: rows.map((r) => r.name), error: null };
      }
      case 'get_profile_languages': {
        const profileId = String(args?.profile_id ?? '');
        const rows = await this.db
          .select({ name: languages.name })
          .from(profileLanguages)
          .innerJoin(languages, eq(profileLanguages.language_id, languages.id))
          .where(eq(profileLanguages.profile_id, profileId))
          .orderBy(asc(languages.name));
        return { data: rows.map((r) => r.name), error: null };
      }
      default:
        return { data: null, error: { message: `Unsupported RPC: ${name}` } };
    }
  }

  async executeCompatQuery(_query: any, _params?: any[]) {
    return { data: null, error: null };
  }

  // ─── Generic collection ops (kept for compatibility) ─────────────────────

  async listDocuments(collectionId: string) {
    // Generic listing is used by admin routes
    const tableMap: Record<string, any> = {
      profiles, locations, passions, languages, profilePassions, profileLanguages,
      favorites, blockedUsers, messages, userPresence, savedSearches,
      notifications, reports, verificationRequests, pushSubscriptions, adminSettings, contactRequests,
    };
    const camelId = collectionId.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    const table = tableMap[collectionId] ?? tableMap[camelId];
    if (!table) return { documents: [] };
    const rows = await this.db.select().from(table);
    return { documents: rows };
  }

  async deleteDocument(collectionId: string, documentId: string) {
    const tableMap: Record<string, any> = {
      profiles, locations, passions, languages,
      profile_passions: profilePassions, profile_languages: profileLanguages,
      favorites, blocked_users: blockedUsers, messages,
      user_presence: userPresence, saved_searches: savedSearches,
      notifications, reports, verification_requests: verificationRequests,
      push_subscriptions: pushSubscriptions, admin_settings: adminSettings,
      contact_requests: contactRequests,
    };
    const table = tableMap[collectionId];
    if (!table) return { success: false };
    await this.db.delete(table).where(eq((table as any).id, documentId));
    return { success: true };
  }
}

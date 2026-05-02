import { ID, Query } from 'node-appwrite';
import { DEFAULT_ADMIN_SYSTEM_CONTROLS } from '@/lib/admin-dashboard';
import { getAppwriteCollectionId, getAppwriteFunctionId } from '@/lib/appwrite/config';
import {
  createAppwriteAdminFunctions,
  createAppwriteSessionAccount,
  getAppwriteErrorMessage,
} from '@/lib/appwrite/server';
import { calculateProfileAge, normalizeBirthDate } from '@/lib/profile-age';
import staticMasterData from '@/lib/static-master-data';
import { AppwriteRepository } from './appwrite-repo';

type StaticPassion = {
  id: string;
  name: string;
};

type StaticLanguage = {
  id: string;
  name: string;
};

type StaticLocation = {
  id: string;
  city: string;
  region: string;
  country: string;
};

type CurrentUser = {
  id: string;
  email: string;
  name?: string;
};

type CompatError = {
  message: string;
  code?: string;
};

type CollectionFilter =
  | { type: 'eq'; column: string; value: unknown }
  | { type: 'in'; column: string; value: unknown[] }
  | { type: 'or'; expression: string };

type CollectionOperation = {
  action: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  select?: string | null;
  filters?: CollectionFilter[];
  order?: { column: string; ascending: boolean } | null;
  range?: { from: number; to: number } | null;
  limit?: number | null;
  single?: boolean;
  maybeSingle?: boolean;
  payload?: any;
};

type SelectResponse<T = any> = {
  data: T;
  error: CompatError | null;
};

const BATCH_SIZE = 100;
const STATIC_COLLECTION_NAMES = new Set(['locations', 'passions', 'languages']);
const ADMIN_SETTINGS_DOCUMENT_ID = 'global';

const splitTopLevel = (value: string) => {
  const parts: string[] = [];
  let current = '';
  let depth = 0;

  for (const character of value) {
    if (character === ',' && depth === 0) {
      if (current.trim()) {
        parts.push(current.trim());
      }

      current = '';
      continue;
    }

    if (character === '(') {
      depth += 1;
    } else if (character === ')' && depth > 0) {
      depth -= 1;
    }

    current += character;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
};

const hasSelectedField = (selectSpec: string | null | undefined, field: string) => {
  if (!selectSpec || !selectSpec.trim()) {
    return true;
  }

  const tokens = splitTopLevel(selectSpec.replace(/\s+/g, ' '));

  return tokens.includes('*') || tokens.includes(field);
};

const normalizeDocument = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeDocument(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const result: Record<string, any> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (key.startsWith('$')) {
      continue;
    }

    result[key] = normalizeDocument(entry);
  }

  if (result.id === undefined && typeof value.$id === 'string') {
    result.id = value.$id;
  }

  if (typeof value.$id === 'string') {
    result._appwriteId = value.$id;
  }

  if (result.created_at === undefined && typeof value.$createdAt === 'string') {
    result.created_at = value.$createdAt;
  }

  if (result.updated_at === undefined && typeof value.$updatedAt === 'string') {
    result.updated_at = value.$updatedAt;
  }

  return result;
};

const unique = <T,>(values: T[]) => Array.from(new Set(values));

const normalizePushFunctionPayload = (data: any, actorId?: string | null) => {
  const receiverId =
    typeof data?.receiver_id === 'string'
      ? data.receiver_id.trim()
      : typeof data?.recipient_id === 'string'
        ? data.recipient_id.trim()
        : '';

  const title = typeof data?.title === 'string' && data.title.trim() ? data.title.trim() : 'New message';
  const body =
    typeof data?.body === 'string'
      ? data.body
      : typeof data?.message === 'string'
        ? data.message
        : '';
  const notificationType =
    typeof data?.notification_type === 'string' && data.notification_type.trim()
      ? data.notification_type.trim()
      : 'message';
  const relatedId =
    typeof data?.related_id === 'string' && data.related_id.trim()
      ? data.related_id.trim()
      : actorId ?? null;

  return {
    ...data,
    actor_id: typeof data?.actor_id === 'string' && data.actor_id.trim() ? data.actor_id.trim() : actorId ?? null,
    receiver_id: receiverId || undefined,
    recipient_id: receiverId || undefined,
    title,
    body,
    message: body,
    url: typeof data?.url === 'string' && data.url.trim() ? data.url.trim() : undefined,
    notification_type: notificationType,
    related_id: relatedId,
  };
};

const lowerCase = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const compareValues = (left: unknown, right: unknown) => {
  if (left === right) {
    return 0;
  }

  const leftDate = typeof left === 'string' && !Number.isNaN(Date.parse(left)) ? Date.parse(left) : null;
  const rightDate = typeof right === 'string' && !Number.isNaN(Date.parse(right)) ? Date.parse(right) : null;

  if (leftDate !== null && rightDate !== null) {
    return leftDate - rightDate;
  }

  const leftNumber = typeof left === 'number' ? left : Number(left);
  const rightNumber = typeof right === 'number' ? right : Number(right);

  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
    return leftNumber - rightNumber;
  }

  return String(left ?? '').localeCompare(String(right ?? ''));
};

const getStringValue = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const getStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => getStringValue(entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  const singleValue = getStringValue(value);
  return singleValue ? [singleValue] : [];
};

const getNumberValue = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const isTruthy = (value: unknown) => value === true || value === 'true' || value === 1 || value === '1';

const parseStoredStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return getStringArray(value);
  }

  const normalized = getStringValue(value);

  if (!normalized) {
    return [];
  }

  try {
    const parsed = JSON.parse(normalized);
    return Array.isArray(parsed) ? getStringArray(parsed) : [];
  } catch {
    return normalized
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
};

const buildDisplayName = (profile: any) => {
  const firstName = getStringValue(profile?.first_name);
  const lastName = getStringValue(profile?.last_name);
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return fullName || getStringValue(profile?.name) || getStringValue(profile?.email) || getStringValue(profile?.id) || 'Unknown user';
};

const buildLocationLabel = (profile: any, locationsById: Map<string, any>) => {
  const relationLocation = profile?.locations ?? profile?.location ?? null;
  const locationId = getStringValue(profile?.location_id);
  const resolvedLocation = locationId ? locationsById.get(locationId) ?? relationLocation : relationLocation;

  if (!resolvedLocation || typeof resolvedLocation !== 'object') {
    return null;
  }

  const parts = [
    getStringValue((resolvedLocation as Record<string, unknown>).city),
    getStringValue((resolvedLocation as Record<string, unknown>).region),
    getStringValue((resolvedLocation as Record<string, unknown>).country),
  ].filter((value): value is string => Boolean(value));

  return parts.length ? parts.join(', ') : null;
};

const buildAdminQueueUser = (profile: any, locationsById: Map<string, any>) => {
  if (!profile) {
    return null;
  }

  return {
    id: String(profile.id ?? ''),
    firstName: getStringValue(profile.first_name),
    lastName: getStringValue(profile.last_name),
    displayName: buildDisplayName(profile),
    verified: profile.verified === true,
    location: buildLocationLabel(profile, locationsById),
    avatarUrl: getStringValue(profile.avatar_url),
  };
};

const mapAdminReportQueueItem = (report: any, locationsById: Map<string, any>) => ({
  id: String(report.id ?? ''),
  reason: getStringValue(report.reason) ?? '',
  status: getStringValue(report.status) ?? 'pending',
  createdAt: getStringValue(report.created_at),
  reporterId: getStringValue(report.reporter_id),
  reportedId: getStringValue(report.reported_id),
  reporter: buildAdminQueueUser(report.reporter, locationsById),
  reported: buildAdminQueueUser(report.reported, locationsById),
});

const mapAdminVerificationQueueItem = (request: any, locationsById: Map<string, any>) => ({
  id: String(request.id ?? ''),
  userId: String(request.user_id ?? ''),
  status: getStringValue(request.status) ?? 'pending',
  createdAt: getStringValue(request.created_at),
  profile: buildAdminQueueUser(request.profiles, locationsById),
});

const normalizeAdminSystemControls = (document: any) => ({
  maintenanceBannerText:
    getStringValue(document?.maintenance_banner_text) ??
    getStringValue(document?.maintenanceBannerText) ??
    DEFAULT_ADMIN_SYSTEM_CONTROLS.maintenanceBannerText,
  moderationHold: isTruthy(document?.moderation_hold ?? document?.moderationHold),
  followUpUserIds: parseStoredStringArray(document?.follow_up_user_ids ?? document?.followUpUserIds),
  updatedAt: getStringValue(document?.updated_at) ?? getStringValue(document?.updatedAt) ?? null,
});

function getStaticCollectionData(collection: 'locations'): StaticLocation[];
function getStaticCollectionData(collection: 'passions'): StaticPassion[];
function getStaticCollectionData(collection: 'languages'): StaticLanguage[];
function getStaticCollectionData(collection: string): StaticLocation[] | StaticPassion[] | StaticLanguage[] | null;
function getStaticCollectionData(collection: string) {
  if (collection === 'locations') {
    return staticMasterData.locations.map((location) => ({ ...location }));
  }

  if (collection === 'passions') {
    return staticMasterData.passions.map((passion) => ({ ...passion }));
  }

  if (collection === 'languages') {
    return staticMasterData.languages.map((language: StaticLanguage) => ({ ...language }));
  }

  return null;
};

const PRESENCE_TTL_MS = 60_000;

const toCompatError = (error: unknown, fallbackMessage = 'Request failed.'): CompatError => ({
  message: getAppwriteErrorMessage(error, fallbackMessage),
  code:
    typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code?: unknown }).code !== 'undefined'
      ? String((error as { code: unknown }).code)
      : undefined,
});

const getRelationSelection = (selectSpec: string | null | undefined, relationKey: string) => {
  if (!selectSpec) {
    return undefined;
  }

  const token = splitTopLevel(selectSpec.replace(/\s+/g, ' ')).find((entry) =>
    entry.startsWith(`${relationKey}(`)
  );

  if (!token) {
    return undefined;
  }

  const start = token.indexOf('(');
  const end = token.lastIndexOf(')');

  if (start === -1 || end === -1 || end <= start + 1) {
    return undefined;
  }

  return token.slice(start + 1, end).trim();
};

export class AppDataService {
  private readonly repo: AppwriteRepository;
  private readonly functions;
  private readonly sessionSecret?: string;
  private readonly userAgent?: string;
  private currentUserPromise?: Promise<CurrentUser | null>;

  constructor(sessionSecret?: string, userAgent?: string) {
    this.repo = new AppwriteRepository(undefined, userAgent);
    this.functions = createAppwriteAdminFunctions(userAgent);
    this.sessionSecret = sessionSecret;
    this.userAgent = userAgent;
  }

  private async getCurrentUser() {
    if (!this.sessionSecret) {
      return null;
    }

    if (!this.currentUserPromise) {
      this.currentUserPromise = (async () => {
        try {
          const account = createAppwriteSessionAccount(this.sessionSecret as string, this.userAgent);
          const user = await account.get();

          return {
            id: user.$id,
            email: user.email,
            name: user.name ?? undefined,
          } satisfies CurrentUser;
        } catch {
          return null;
        }
      })();
    }

    return this.currentUserPromise;
  }

  private async requireCurrentUser() {
    const user = await this.getCurrentUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    return user;
  }

  private getCollectionId(name: string) {
    return getAppwriteCollectionId(name);
  }

  private isStaticCollection(collection: string) {
    return STATIC_COLLECTION_NAMES.has(collection);
  }

  private getStaticCollectionDocuments(collection: 'locations'): StaticLocation[];
  private getStaticCollectionDocuments(collection: 'passions'): StaticPassion[];
  private getStaticCollectionDocuments(collection: 'languages'): StaticLanguage[];
  private getStaticCollectionDocuments(collection: string): StaticLocation[] | StaticPassion[] | StaticLanguage[] | null;
  private getStaticCollectionDocuments(collection: string) {
    return getStaticCollectionData(collection);
  }

  private resolveStaticLocationId(location: { city?: unknown; region?: unknown; country?: unknown } | null | undefined) {
    const city = lowerCase(location?.city);
    const region = lowerCase(location?.region);
    const country = lowerCase(location?.country);

    if (!city || !country) {
      return null;
    }

    const exactMatch = staticMasterData.locations.find(
      (candidate) =>
        lowerCase(candidate.city) === city &&
        lowerCase(candidate.region ?? '') === region &&
        lowerCase(candidate.country) === country
    );

    if (exactMatch) {
      return exactMatch.id;
    }

    if (region) {
      return null;
    }

    const fallbackMatches = staticMasterData.locations.filter(
      (candidate) => lowerCase(candidate.city) === city && lowerCase(candidate.country) === country
    );

    return fallbackMatches.length === 1 ? fallbackMatches[0].id : null;
  }

  private async listAllDocuments(collection: string, queries: string[] = []) {
    const staticDocuments = this.getStaticCollectionDocuments(collection);

    if (staticDocuments) {
      return staticDocuments;
    }

    try {
      const documents: any[] = [];
      let offset = 0;

      while (true) {
        const response = await this.repo.listDocuments<any>(this.getCollectionId(collection), [
          ...queries,
          Query.limit(BATCH_SIZE),
          Query.offset(offset),
        ]);

        documents.push(...response.documents);

        if (response.documents.length < BATCH_SIZE) {
          break;
        }

        offset += BATCH_SIZE;
      }

      return documents.map((document) => normalizeDocument(document));
    } catch (error) {
      throw error;
    }
  }

  private async listDocumentsPage(collection: string, queries: string[] = [], limit = BATCH_SIZE, offset = 0) {
    const staticDocuments = this.getStaticCollectionDocuments(collection);

    if (staticDocuments) {
      return staticDocuments.slice(offset, offset + limit);
    }

    try {
      const response = await this.repo.listDocuments<any>(this.getCollectionId(collection), [
        ...queries,
        Query.limit(limit),
        Query.offset(offset),
      ]);

      return response.documents.map((document) => normalizeDocument(document));
    } catch (error) {
      throw error;
    }
  }

  private async listDocumentsWindow(collection: string, queries: string[] = [], targetCount: number | null = null) {
    if (targetCount === null) {
      return this.listAllDocuments(collection, queries);
    }

    const documents: Record<string, any>[] = [];
    let offset = 0;

    while (documents.length < targetCount) {
      const batchLimit = Math.min(BATCH_SIZE, targetCount - documents.length);
      const batch = await this.listDocumentsPage(collection, queries, batchLimit, offset);

      documents.push(...batch);

      if (batch.length < batchLimit) {
        break;
      }

      offset += batch.length;
    }

    return documents;
  }

  private parseMessageOrExpression(expression: string) {
    const match = expression.match(
      /^and\(sender_id\.eq\.([^,]+),receiver_id\.eq\.([^\)]+)\),and\(sender_id\.eq\.([^,]+),receiver_id\.eq\.([^\)]+)\)$/
    );

    if (!match) {
      return null;
    }

    return {
      senderA: match[1],
      receiverA: match[2],
      senderB: match[3],
      receiverB: match[4],
    };
  }

  private matchesFilter(document: Record<string, any>, filter: CollectionFilter) {
    if (filter.type === 'or') {
      if (typeof filter.expression !== 'string') {
        return true;
      }

      const parsedMessageFilter = this.parseMessageOrExpression(filter.expression);

      if (!parsedMessageFilter) {
        return true;
      }

      return (
        (String(document.sender_id) === parsedMessageFilter.senderA &&
          String(document.receiver_id) === parsedMessageFilter.receiverA) ||
        (String(document.sender_id) === parsedMessageFilter.senderB &&
          String(document.receiver_id) === parsedMessageFilter.receiverB)
      );
    }

    const value = filter.column === 'id' ? document.id : document[filter.column];

    if (filter.type === 'eq') {
      if (Array.isArray(value)) {
        return value.includes(filter.value);
      }

      return String(value) === String(filter.value);
    }

    if (filter.type === 'in') {
      return filter.value.some((entry) => String(value) === String(entry));
    }

    return true;
  }

  private applyFilters(documents: Record<string, any>[], filters: CollectionFilter[] = []) {
    if (!filters.length) {
      return documents;
    }

    return documents.filter((document) => filters.every((filter) => this.matchesFilter(document, filter)));
  }

  private getWindowParameters(operation: CollectionOperation) {
    const offset = operation.range?.from ?? 0;
    const limit = operation.range
      ? Math.max(0, operation.range.to - operation.range.from + 1)
      : operation.limit ?? null;

    return {
      offset,
      limit,
      targetCount: limit === null ? null : offset + limit,
    };
  }

  private mergeMessageDocuments(messageGroups: Array<Record<string, any>[]>, ascending: boolean) {
    const merged = new Map<string, Record<string, any>>();

    for (const group of messageGroups) {
      for (const message of group) {
        const key = String(message.id ?? message._appwriteId);
        const current = merged.get(key);

        if (!current || compareValues(message.created_at, current.created_at) > 0) {
          merged.set(key, message);
        }
      }
    }

    return Array.from(merged.values()).sort((left, right) => {
      const result = compareValues(left.created_at, right.created_at);
      return ascending ? result : -result;
    });
  }

  private async getConversationDocuments(
    parsedFilter: NonNullable<ReturnType<AppDataService['parseMessageOrExpression']>>,
    operation: CollectionOperation
  ) {
    const { offset, limit, targetCount } = this.getWindowParameters(operation);
    const ascending = operation.order?.ascending ?? true;
    const orderQuery = ascending ? Query.orderAsc('created_at') : Query.orderDesc('created_at');

    try {
      const [sentMessages, receivedMessages] = await Promise.all([
        this.listDocumentsWindow(
          'messages',
          [
            Query.equal('sender_id', parsedFilter.senderA),
            Query.equal('receiver_id', parsedFilter.receiverA),
            orderQuery,
          ],
          targetCount
        ),
        this.listDocumentsWindow(
          'messages',
          [
            Query.equal('sender_id', parsedFilter.senderB),
            Query.equal('receiver_id', parsedFilter.receiverB),
            orderQuery,
          ],
          targetCount
        ),
      ]);

      const merged = this.mergeMessageDocuments([sentMessages, receivedMessages], ascending);

      if (limit === null && offset === 0) {
        return merged;
      }

      return merged.slice(offset, limit === null ? undefined : offset + limit);
    } catch {
      const allMessages = await this.listAllDocuments('messages');
      const filtered = this.applyFilters(allMessages, operation.filters);
      return this.applyOrderAndWindow(filtered, operation);
    }
  }

  private async listMessagesForParticipant(userId: string, ascending = true) {
    try {
      const [sentMessages, receivedMessages] = await Promise.all([
        this.listAllDocuments('messages', [Query.equal('sender_id', userId)]),
        this.listAllDocuments('messages', [Query.equal('receiver_id', userId)]),
      ]);

      return this.mergeMessageDocuments([sentMessages, receivedMessages], ascending);
    } catch {
      const allMessages = await this.listAllDocuments('messages');
      const relevantMessages = allMessages.filter(
        (message) => String(message.sender_id) === userId || String(message.receiver_id) === userId
      );

      return this.mergeMessageDocuments([relevantMessages], ascending);
    }
  }

  private applyOrderAndWindow(documents: Record<string, any>[], operation: CollectionOperation) {
    const ordered = [...documents];

    if (operation.order?.column) {
      ordered.sort((left, right) => {
        const result = compareValues(left[operation.order!.column], right[operation.order!.column]);
        return operation.order!.ascending ? result : -result;
      });
    }

    const { offset, limit: explicitLimit } = this.getWindowParameters(operation);

    if (offset > 0 || explicitLimit !== null) {
      return ordered.slice(offset, explicitLimit === null ? undefined : offset + explicitLimit);
    }

    return ordered;
  }

  private pickSelectedFields(document: Record<string, any>, selectSpec?: string | null) {
    if (!selectSpec || !selectSpec.trim()) {
      return { ...document };
    }

    const tokens = splitTopLevel(selectSpec.replace(/\s+/g, ' '));
    const includeAll = tokens.includes('*');
    const result: Record<string, any> = includeAll ? { ...document } : {};

    delete result._appwriteId;

    for (const token of tokens) {
      if (token === '*' || token.includes('(') || token.includes(':')) {
        continue;
      }

      const field = token.trim();

      if (!field) {
        continue;
      }

      result[field] = document[field];
    }

    return result;
  }

  private async fetchByIds(collection: string, ids: Array<string | number>) {
    const normalizedIds = unique(ids.filter((value) => value !== undefined && value !== null).map((value) => String(value)));

    if (!normalizedIds.length) {
      return new Map<string, any>();
    }

    const staticDocuments = this.getStaticCollectionDocuments(collection);

    if (staticDocuments) {
      return new Map<string, any>(
        staticDocuments
          .filter((document) => normalizedIds.includes(String(document.id)))
          .map((document) => [String(document.id), document])
      );
    }

    let documents = await this.listAllDocuments(collection, [Query.equal('id', normalizedIds)]);

    if (documents.length < normalizedIds.length) {
      const allDocuments = await this.listAllDocuments(collection);
      const merged = new Map<string, any>();

      for (const document of [...documents, ...allDocuments]) {
        merged.set(String(document.id), document);
      }

      documents = normalizedIds.map((id) => merged.get(id)).filter(Boolean);
    }

    return new Map<string, any>(documents.map((document) => [String(document.id), document]));
  }

  private async hydrateProfilesWithLocations(profiles: Record<string, any>[], selectSpec?: string | null) {
    const locationIds = unique(
      profiles
        .map((profile) => profile.location_id)
        .filter((locationId) => locationId !== null && locationId !== undefined)
    );
    const locationsById = await this.fetchByIds('locations', locationIds);

    return profiles.map((profile) => {
      const result = this.pickSelectedFields(profile, selectSpec);

      if (hasSelectedField(selectSpec, 'age')) {
        result.age = calculateProfileAge(profile);
      }

      if (hasSelectedField(selectSpec, 'birth_date')) {
        result.birth_date = normalizeBirthDate(profile.birth_date);
      }

      if (selectSpec?.includes('locations(')) {
        const location = profile.location_id ? locationsById.get(String(profile.location_id)) || null : null;
        result.locations = location ? this.pickSelectedFields(location, '*, city, region, country, id') : null;
        result.location = result.locations;
      }

      if (selectSpec?.includes('passions_count:')) {
        result.passions_count = profile.passions_count ?? [{ count: 0 }];
      }

      if (selectSpec?.includes('languages_count:')) {
        result.languages_count = profile.languages_count ?? [{ count: 0 }];
      }

      return result;
    });
  }

  private async hydrateRelationRows(
    rows: Record<string, any>[],
    relationCollection: string,
    relationIdField: string,
    relationKey: string,
    selectSpec?: string | null
  ) {
    const relationIds = unique(rows.map((row) => row[relationIdField]).filter(Boolean));
    const relationMap = await this.fetchByIds(relationCollection, relationIds);
    const relationSelection = getRelationSelection(selectSpec, relationKey);

    return rows.map((row) => {
      const result = this.pickSelectedFields(row, selectSpec);

      if (selectSpec?.includes(`${relationKey}(`)) {
        const relation = relationMap.get(String(row[relationIdField]));
        result[relationKey] = relation ? this.pickSelectedFields(relation, relationSelection) : null;
      }

      return result;
    });
  }

  private async hydrateMessages(messages: Record<string, any>[], selectSpec?: string | null) {
    const profileIds = unique(
      messages.flatMap((message) => [message.sender_id, message.receiver_id]).filter(Boolean)
    );
    const profilesById = await this.fetchByIds('profiles', profileIds);

    return messages.map((message) => {
      const result = this.pickSelectedFields(message, selectSpec);

      if (selectSpec?.includes('sender:profiles!sender_id')) {
        const sender = profilesById.get(String(message.sender_id));
        result.sender = sender ? this.pickSelectedFields(sender, 'id, first_name, last_name') : null;
      }

      if (selectSpec?.includes('receiver:profiles!receiver_id')) {
        const receiver = profilesById.get(String(message.receiver_id));
        result.receiver = receiver ? this.pickSelectedFields(receiver, 'id, first_name, last_name') : null;
      }

      return result;
    });
  }

  private async hydrateBlockedUsers(rows: Record<string, any>[], selectSpec?: string | null) {
    const profilesById = await this.fetchByIds(
      'profiles',
      rows.map((row) => row.blocked_id).filter(Boolean)
    );

    return rows.map((row) => {
      const result = this.pickSelectedFields(row, selectSpec);

      if (selectSpec?.includes('profile:profiles!blocked_users_blocked_id_fkey')) {
        const profile = profilesById.get(String(row.blocked_id));
        result.profile = profile
          ? this.pickSelectedFields(profile, 'id, first_name, last_name, avatar_url')
          : null;
      }

      return result;
    });
  }

  private async addProfileCounts(profiles: Record<string, any>[]) {
    const profileIds = profiles.map((profile) => String(profile.id));

    if (!profileIds.length) {
      return profiles;
    }

    const [passionRows, languageRows] = await Promise.all([
      this.listAllDocuments('profile_passions', [Query.equal('profile_id', profileIds)]),
      this.listAllDocuments('profile_languages', [Query.equal('profile_id', profileIds)]),
    ]);

    const passionsCount = new Map<string, number>();
    const languagesCount = new Map<string, number>();

    for (const row of passionRows) {
      const profileId = String(row.profile_id);
      passionsCount.set(profileId, (passionsCount.get(profileId) ?? 0) + 1);
    }

    for (const row of languageRows) {
      const profileId = String(row.profile_id);
      languagesCount.set(profileId, (languagesCount.get(profileId) ?? 0) + 1);
    }

    return profiles.map((profile) => ({
      ...profile,
      passions_count: [{ count: passionsCount.get(String(profile.id)) ?? 0 }],
      languages_count: [{ count: languagesCount.get(String(profile.id)) ?? 0 }],
    }));
  }

  private async transformSelectedDocuments(
    collection: string,
    documents: Record<string, any>[],
    selectSpec?: string | null
  ) {
    switch (collection) {
      case 'profiles': {
        let profiles = documents;

        if (selectSpec?.includes('profile_passions(count)') || selectSpec?.includes('profile_languages(count)')) {
          profiles = await this.addProfileCounts(profiles);
        }

        return this.hydrateProfilesWithLocations(profiles, selectSpec);
      }
      case 'profile_passions':
        return this.hydrateRelationRows(documents, 'passions', 'passion_id', 'passions', selectSpec);
      case 'profile_languages':
        return this.hydrateRelationRows(documents, 'languages', 'language_id', 'languages', selectSpec);
      case 'messages':
        return this.hydrateMessages(documents, selectSpec);
      case 'blocked_users':
        return this.hydrateBlockedUsers(documents, selectSpec);
      default:
        return documents.map((document) => this.pickSelectedFields(document, selectSpec));
    }
  }

  private async getMatchingDocuments(collection: string, operation: CollectionOperation) {
    const eqFilters = (operation.filters ?? []).filter(
      (filter): filter is Extract<CollectionFilter, { type: 'eq' }> => filter.type === 'eq'
    );
    const inFilters = (operation.filters ?? []).filter(
      (filter): filter is Extract<CollectionFilter, { type: 'in' }> => filter.type === 'in'
    );
    const orFilters = (operation.filters ?? []).filter(
      (filter): filter is Extract<CollectionFilter, { type: 'or' }> => filter.type === 'or'
    );

    const queries: string[] = [];

    if (collection === 'messages' && orFilters.length === 1) {
      const parsed = this.parseMessageOrExpression(orFilters[0].expression);

      if (parsed && (!operation.order?.column || operation.order.column === 'created_at')) {
        return this.getConversationDocuments(parsed, operation);
      }
    }

    for (const filter of eqFilters) {
      queries.push(Query.equal(filter.column, filter.value as any));
    }

    for (const filter of inFilters) {
      queries.push(Query.equal(filter.column, filter.value as any));
    }

    if (collection === 'messages' && orFilters.length === 1) {
      const parsed = this.parseMessageOrExpression(orFilters[0].expression);

      if (parsed) {
        queries.push(Query.equal('sender_id', [parsed.senderA, parsed.senderB]));
        queries.push(Query.equal('receiver_id', [parsed.receiverA, parsed.receiverB]));
      }
    }

    if (operation.order?.column) {
      queries.push(operation.order.ascending ? Query.orderAsc(operation.order.column) : Query.orderDesc(operation.order.column));
    }

    const documents = await this.listAllDocuments(collection, queries);
    const filtered = this.applyFilters(documents, operation.filters);

    return this.applyOrderAndWindow(filtered, operation);
  }

  private async createDocuments(collection: string, payload: any) {
    if (this.isStaticCollection(collection)) {
      throw new Error(`${collection} is managed in code and cannot be modified via collection operations.`);
    }

    const entries = Array.isArray(payload) ? payload.filter(Boolean) : [payload];
    const created: any[] = [];

    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }

      const requestedId = entry.id;
      const documentId =
        typeof requestedId === 'string' || typeof requestedId === 'number'
          ? String(requestedId)
          : ID.unique();
      const createdAt = new Date().toISOString();
      const data = {
        ...entry,
        id: requestedId ?? documentId,
      };

      switch (collection) {
        case 'profiles':
          data.created_at ??= createdAt;
          data.updated_at ??= createdAt;
          data.verified ??= false;
          data.is_private ??= false;
          data.show_age ??= true;
          data.show_location ??= true;
          break;
        case 'messages':
        case 'favorites':
        case 'blocked_users':
        case 'saved_searches':
          data.created_at ??= createdAt;
          break;
        case 'notifications':
          data.created_at ??= createdAt;
          data.read ??= false;
          break;
        case 'reports':
        case 'verification_requests':
        case 'contact_requests':
          data.created_at ??= createdAt;
          data.status ??= 'pending';
          break;
        default:
          break;
      }

      const createdDocument = await this.repo.createDocument<any>(
        this.getCollectionId(collection),
        data,
        documentId
      );
      created.push(normalizeDocument(createdDocument));
    }

    return created;
  }

  private async updateDocuments(collection: string, operation: CollectionOperation) {
    if (this.isStaticCollection(collection)) {
      throw new Error(`${collection} is managed in code and cannot be modified via collection operations.`);
    }

    const matching = await this.getMatchingDocuments(collection, operation);
    const updated: any[] = [];

    for (const document of matching) {
      const appwriteDocumentId = document._appwriteId ?? document.id;
      const updatedDocument = await this.repo.updateDocument<any>(
        this.getCollectionId(collection),
        String(appwriteDocumentId),
        operation.payload ?? {}
      );
      updated.push(normalizeDocument(updatedDocument));
    }

    return updated;
  }

  private async deleteDocuments(collection: string, operation: CollectionOperation) {
    if (this.isStaticCollection(collection)) {
      throw new Error(`${collection} is managed in code and cannot be modified via collection operations.`);
    }

    const matching = await this.getMatchingDocuments(collection, operation);

    for (const document of matching) {
      const appwriteDocumentId = document._appwriteId ?? document.id;
      await this.repo.deleteDocument(this.getCollectionId(collection), String(appwriteDocumentId));
    }

    return matching;
  }

  async executeCollectionOperation(collection: string, operation: CollectionOperation): Promise<SelectResponse<any>> {
    try {
      if (operation.action === 'select') {
        const matching = await this.getMatchingDocuments(collection, operation);
        const transformed = await this.transformSelectedDocuments(collection, matching, operation.select);

        if (operation.maybeSingle) {
          return { data: transformed[0] ?? null, error: null };
        }

        if (operation.single) {
          if (!transformed.length) {
            return {
              data: null,
              error: {
                code: 'PGRST116',
                message: 'JSON object requested, multiple (or no) rows returned',
              },
            };
          }

          return { data: transformed[0], error: null };
        }

        return { data: transformed, error: null };
      }

      if (operation.action === 'insert') {
        const created = await this.createDocuments(collection, operation.payload);
        const transformed = operation.select
          ? await this.transformSelectedDocuments(collection, created, operation.select)
          : created;

        if (operation.single) {
          return { data: transformed[0] ?? null, error: null };
        }

        return { data: operation.select ? transformed : null, error: null };
      }

      if (operation.action === 'upsert') {
        const payload = operation.payload ?? {};
        const logicalId = payload.id;

        if (logicalId === undefined || logicalId === null) {
          throw new Error('Upsert operations require an id field.');
        }

        const existing = await this.getMatchingDocuments(collection, {
          action: 'select',
          filters: [{ type: 'eq', column: 'id', value: logicalId }],
          single: true,
        });

        if (existing.length) {
          await this.updateDocuments(collection, {
            action: 'update',
            filters: [{ type: 'eq', column: 'id', value: logicalId }],
            payload,
          });
        } else {
          await this.createDocuments(collection, payload);
        }

        return { data: null, error: null };
      }

      if (operation.action === 'update') {
        const updated = await this.updateDocuments(collection, operation);
        const transformed = operation.select
          ? await this.transformSelectedDocuments(collection, updated, operation.select)
          : updated;

        if (operation.single) {
          return { data: transformed[0] ?? null, error: null };
        }

        return { data: operation.select ? transformed : null, error: null };
      }

      if (operation.action === 'delete') {
        const deleted = await this.deleteDocuments(collection, operation);
        const transformed = operation.select
          ? await this.transformSelectedDocuments(collection, deleted, operation.select)
          : deleted;

        if (operation.single) {
          return { data: transformed[0] ?? null, error: null };
        }

        return { data: operation.select ? transformed : null, error: null };
      }

      return { data: null, error: null };
    } catch (error) {
      return {
        data: null,
        error: toCompatError(error),
      };
    }
  }

  async getProfile(id: string) {
    const response = await this.executeCollectionOperation('profiles', {
      action: 'select',
      filters: [{ type: 'eq', column: 'id', value: id }],
      single: true,
      select:
        'id, created_at, first_name, last_name, about_me, age, gender, verified, is_private, show_age, show_location, location_id, locations(*)',
    });

    if (response.error || !response.data) {
      return null;
    }

    const [passionRows, languageRows] = await Promise.all([
      this.executeCollectionOperation('profile_passions', {
        action: 'select',
        filters: [{ type: 'eq', column: 'profile_id', value: id }],
        select: 'profile_id, passions(name)',
      }),
      this.executeCollectionOperation('profile_languages', {
        action: 'select',
        filters: [{ type: 'eq', column: 'profile_id', value: id }],
        select: 'profile_id, languages(name)',
      }),
    ]);

    return {
      ...response.data,
      passions:
        (passionRows.data as any[] | null)?.flatMap((row) => (row.passions?.name ? [row.passions.name] : [])) || [],
      languages:
        (languageRows.data as any[] | null)?.flatMap((row) =>
          row.languages?.name ? [row.languages.name] : []
        ) || [],
    };
  }

  async saveProfile(id: string, data: any) {
    const response = await this.executeCollectionOperation('profiles', {
      action: 'upsert',
      payload: {
        id,
        ...data,
        updated_at: new Date().toISOString(),
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return this.getProfile(id);
  }

  async listLanguages(): Promise<StaticLanguage[]> {
    const languages = this.getStaticCollectionDocuments('languages');

    return languages?.sort((left, right) =>
      String(left.name ?? '').localeCompare(String(right.name ?? ''))
    ) ?? [];
  }

  async listPassions(): Promise<StaticPassion[]> {
    const passions = this.getStaticCollectionDocuments('passions');

    return passions?.sort((left, right) =>
      String(left.name ?? '').localeCompare(String(right.name ?? ''))
    ) ?? [];
  }

  async listLocations(): Promise<StaticLocation[]> {
    const locations = this.getStaticCollectionDocuments('locations');

    return locations?.sort((left, right) => {
      const countryResult = String(left.country ?? '').localeCompare(String(right.country ?? ''));

      if (countryResult !== 0) {
        return countryResult;
      }

      const regionResult = String(left.region ?? '').localeCompare(String(right.region ?? ''));

      if (regionResult !== 0) {
        return regionResult;
      }

      return String(left.city ?? '').localeCompare(String(right.city ?? ''));
    }) ?? [];
  }

  async getMessages(userId: string) {
    return this.listMessagesForUser(userId);
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    const response = await this.executeCollectionOperation('messages', {
      action: 'insert',
      payload: {
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        created_at: new Date().toISOString(),
      },
      select:
        'id, created_at, sender_id, receiver_id, content, sender:profiles!sender_id(id, first_name, last_name), receiver:profiles!receiver_id(id, first_name, last_name)',
      single: true,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  }

  async getFavorites(userId: string) {
    return this.loadSavedProfiles(userId);
  }

  async toggleFavorite(userId: string, favoriteId: string) {
    const existing = await this.executeCollectionOperation('favorites', {
      action: 'select',
      filters: [
        { type: 'eq', column: 'user_id', value: userId },
        { type: 'eq', column: 'favorite_id', value: favoriteId },
      ],
      maybeSingle: true,
    });

    if (existing.data) {
      return this.executeCompatRpc('unsave_profile', { target_id: favoriteId, current_user_id: userId });
    }

    return this.executeCompatRpc('save_profile', { target_id: favoriteId, current_user_id: userId });
  }

  async invokeCompatFunction(name: string, data?: any) {
    if (name !== 'send-push') {
      return { success: false, message: `Unsupported function: ${name}` };
    }

    const currentUser = await this.getCurrentUser();
    const payload = normalizePushFunctionPayload(data, currentUser?.id ?? null);

    const functionId = getAppwriteFunctionId(name);

    if (functionId) {
      await this.functions.createExecution(functionId, JSON.stringify(payload), false);
      return { success: true };
    }

    if (payload.receiver_id) {
      await this.executeCollectionOperation('notifications', {
        action: 'insert',
        payload: {
          receiver_id: payload.receiver_id,
          actor_id: payload.actor_id,
          type: payload.notification_type,
          read: false,
          title: payload.title,
          body: payload.body,
          url: payload.url ?? null,
          created_at: new Date().toISOString(),
        },
      });
    }

    return { success: true, fallback: true };
  }

  async executeCompatQuery(query: any, _params?: any[]) {
    if (query && typeof query === 'object' && typeof query.collection === 'string') {
      return this.executeCollectionOperation(query.collection, query.operation ?? query);
    }

    return { rows: [] };
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
        return {
          data: await this.listBlockedUsers(
            typeof args?.user_id === 'string' && args.user_id.trim() ? args.user_id : undefined
          ),
          error: null,
        };
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
      default:
        return { data: null, error: { message: `Unsupported RPC: ${name}` } };
    }
  }

  async listDocuments(collectionId: string) {
    const response = await this.executeCollectionOperation(collectionId, {
      action: 'select',
    });

    return { documents: (response.data as any[]) ?? [] };
  }

  async deleteDocument(collectionId: string, documentId: string) {
    const response = await this.executeCollectionOperation(collectionId, {
      action: 'delete',
      filters: [{ type: 'eq', column: 'id', value: documentId }],
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return { success: true };
  }

  async saveProfileData(id: string, data: any) {
    let locationId = data.location_id ?? null;

    if (data.location?.city && data.location?.country) {
      locationId = this.resolveStaticLocationId(data.location);
    }

    const profilePayload = {
      id,
      first_name: data.first_name,
      last_name: data.last_name,
      about_me: data.about_me ?? '',
      age: data.birth_date ? null : data.age ?? null,
      birth_date: normalizeBirthDate(data.birth_date),
      gender: data.gender ?? null,
      location_id: locationId,
      updated_at: new Date().toISOString(),
    };

    const upsertProfile = await this.executeCollectionOperation('profiles', {
      action: 'upsert',
      payload: profilePayload,
    });

    if (upsertProfile.error) {
      throw new Error(upsertProfile.error.message);
    }

    await this.executeCollectionOperation('profile_languages', {
      action: 'delete',
      filters: [{ type: 'eq', column: 'profile_id', value: id }],
    });

    await this.executeCollectionOperation('profile_passions', {
      action: 'delete',
      filters: [{ type: 'eq', column: 'profile_id', value: id }],
    });

    if (Array.isArray(data.languages) && data.languages.length) {
      const languageLookup = await this.listAllDocuments('languages');
      const inserts = data.languages
        .map((languageName: string) =>
          languageLookup.find((language) => lowerCase(language.name) === lowerCase(languageName))
        )
        .filter(Boolean)
        .map((language) => ({
          profile_id: id,
          language_id: language.id,
        }));

      if (inserts.length) {
        await this.executeCollectionOperation('profile_languages', {
          action: 'insert',
          payload: inserts,
        });
      }
    }

    if (Array.isArray(data.passions) && data.passions.length) {
      const passionLookup = await this.listAllDocuments('passions');
      const inserts = data.passions
        .map((passionName: string) =>
          passionLookup.find((passion) => lowerCase(passion.name) === lowerCase(passionName))
        )
        .filter(Boolean)
        .map((passion) => ({
          profile_id: id,
          passion_id: passion.id,
        }));

      if (inserts.length) {
        await this.executeCollectionOperation('profile_passions', {
          action: 'insert',
          payload: inserts,
        });
      }
    }

    return this.getProfile(id);
  }

  async deleteProfile(id: string) {
    await Promise.all([
      this.executeCollectionOperation('profile_languages', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'profile_id', value: id }],
      }),
      this.executeCollectionOperation('profile_passions', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'profile_id', value: id }],
      }),
      this.executeCollectionOperation('favorites', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'user_id', value: id }],
      }),
      this.executeCollectionOperation('favorites', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'favorite_id', value: id }],
      }),
      this.executeCollectionOperation('saved_searches', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'user_id', value: id }],
      }),
      this.executeCollectionOperation('blocked_users', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'blocker_id', value: id }],
      }),
      this.executeCollectionOperation('blocked_users', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'blocked_id', value: id }],
      }),
      this.executeCollectionOperation('messages', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'sender_id', value: id }],
      }),
      this.executeCollectionOperation('messages', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'receiver_id', value: id }],
      }),
      this.executeCollectionOperation('notifications', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'receiver_id', value: id }],
      }),
      this.executeCollectionOperation('notifications', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'actor_id', value: id }],
      }),
      this.executeCollectionOperation('reports', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'reporter_id', value: id }],
      }),
      this.executeCollectionOperation('reports', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'reported_id', value: id }],
      }),
      this.executeCollectionOperation('verification_requests', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'user_id', value: id }],
      }),
      this.executeCollectionOperation('push_subscriptions', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'user_id', value: id }],
      }),
      this.executeCollectionOperation('user_presence', {
        action: 'delete',
        filters: [{ type: 'eq', column: 'user_id', value: id }],
      }),
    ]);

    return this.deleteDocument('profiles', id);
  }

  async listNotifications() {
    const currentUser = await this.requireCurrentUser();
    const response = await this.executeCollectionOperation('notifications', {
      action: 'select',
      filters: [{ type: 'eq', column: 'receiver_id', value: currentUser.id }],
      order: { column: 'created_at', ascending: false },
    });

    return (response.data as any[] | null)?.map((notification) => ({
      id: notification.id,
      type: notification.type,
      read: notification.read ?? false,
      createdAt: notification.created_at,
      actorId: notification.actor_id ?? undefined,
      title: notification.title ?? undefined,
      body: notification.body ?? undefined,
      url: notification.url ?? undefined,
    })) || [];
  }

  async markNotificationRead(notificationId: string) {
    await this.requireCurrentUser();

    return this.executeCollectionOperation('notifications', {
      action: 'update',
      filters: [{ type: 'eq', column: 'id', value: notificationId }],
      payload: { read: true },
    });
  }

  async markAllNotificationsRead() {
    const currentUser = await this.requireCurrentUser();

    return this.executeCollectionOperation('notifications', {
      action: 'update',
      filters: [{ type: 'eq', column: 'receiver_id', value: currentUser.id }],
      payload: { read: true },
    });
  }

  async createReport(payload: { reporterId: string; reportedId: string; reason: string }) {
    return this.executeCollectionOperation('reports', {
      action: 'insert',
      payload: {
        reporter_id: payload.reporterId,
        reported_id: payload.reportedId,
        reason: payload.reason,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    });
  }

  async listReports() {
    const response = await this.executeCollectionOperation('reports', {
      action: 'select',
      order: { column: 'created_at', ascending: false },
    });
    const reports = (response.data as any[]) ?? [];
    const profileIds = unique(
      reports.flatMap((report) => [report.reporter_id, report.reported_id]).filter(Boolean)
    );
    const profilesById = await this.fetchByIds('profiles', profileIds);

    return reports.map((report) => ({
      ...report,
      reporter: profilesById.get(String(report.reporter_id)) || null,
      reported: profilesById.get(String(report.reported_id)) || null,
    }));
  }

  async updateReportStatus(id: string, status: string) {
    return this.executeCollectionOperation('reports', {
      action: 'update',
      filters: [{ type: 'eq', column: 'id', value: id }],
      payload: { status },
    });
  }

  async listVerificationRequests() {
    const response = await this.executeCollectionOperation('verification_requests', {
      action: 'select',
      order: { column: 'created_at', ascending: false },
    });
    const requests = (response.data as any[]) ?? [];
    const profilesById = await this.fetchByIds(
      'profiles',
      requests.map((request) => request.user_id).filter(Boolean)
    );

    return requests.map((request) => ({
      ...request,
      profiles: profilesById.get(String(request.user_id)) || null,
    }));
  }

  async updateVerificationRequest(id: string, status: string, userId?: string) {
    await this.executeCollectionOperation('verification_requests', {
      action: 'update',
      filters: [{ type: 'eq', column: 'id', value: id }],
      payload: { status },
    });

    if (status === 'approved' && userId) {
      await this.executeCollectionOperation('profiles', {
        action: 'update',
        filters: [{ type: 'eq', column: 'id', value: userId }],
        payload: { verified: true },
      });
    }

    return { success: true };
  }

  async getAdminSettings() {
    const response = await this.executeCollectionOperation('admin_settings', {
      action: 'select',
      filters: [{ type: 'eq', column: 'id', value: ADMIN_SETTINGS_DOCUMENT_ID }],
      maybeSingle: true,
    });

    if (response.error || !response.data) {
      return { ...DEFAULT_ADMIN_SYSTEM_CONTROLS };
    }

    return normalizeAdminSystemControls(response.data);
  }

  async updateAdminSettings(patch: {
    maintenanceBannerText?: string;
    moderationHold?: boolean;
    followUpUserIds?: string[];
  }) {
    const current = await this.getAdminSettings();
    const updatedAt = new Date().toISOString();
    const next = normalizeAdminSystemControls({
      ...current,
      maintenanceBannerText:
        patch.maintenanceBannerText !== undefined ? patch.maintenanceBannerText : current.maintenanceBannerText,
      moderationHold: patch.moderationHold !== undefined ? patch.moderationHold : current.moderationHold,
      followUpUserIds: patch.followUpUserIds ?? current.followUpUserIds,
      updatedAt,
    });

    const response = await this.executeCollectionOperation('admin_settings', {
      action: 'upsert',
      payload: {
        id: ADMIN_SETTINGS_DOCUMENT_ID,
        maintenance_banner_text: next.maintenanceBannerText,
        moderation_hold: next.moderationHold,
        follow_up_user_ids: JSON.stringify(next.followUpUserIds),
        updated_at: updatedAt,
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return {
      ...next,
      updatedAt,
    };
  }

  async toggleAdminFollowUp(userId: string, enabled: boolean) {
    const current = await this.getAdminSettings();
    const followUpUserIds = enabled
      ? unique([...current.followUpUserIds, userId])
      : current.followUpUserIds.filter((entry) => entry !== userId);

    return this.updateAdminSettings({ followUpUserIds });
  }

  async listAdminNotificationsForUser(userId: string) {
    const response = await this.executeCollectionOperation('notifications', {
      action: 'select',
      filters: [{ type: 'eq', column: 'receiver_id', value: userId }],
      order: { column: 'created_at', ascending: false },
    });

    return ((response.data as any[]) ?? []).map((notification) => ({
      id: String(notification.id ?? ''),
      type: getStringValue(notification.type) ?? 'unknown',
      read: notification.read === true,
      createdAt: getStringValue(notification.created_at),
      actorId: getStringValue(notification.actor_id),
      title: getStringValue(notification.title),
      body: getStringValue(notification.body),
      url: getStringValue(notification.url),
    }));
  }

  async setAdminUserVerified(userId: string, verified: boolean) {
    const response = await this.executeCollectionOperation('profiles', {
      action: 'update',
      filters: [{ type: 'eq', column: 'id', value: userId }],
      payload: {
        verified,
        updated_at: new Date().toISOString(),
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    if (verified) {
      const requests = await this.listVerificationRequestsForUser(userId);
      const pendingRequest = requests.find((request) => request.status === 'pending');

      if (pendingRequest?.id) {
        await this.updateVerificationRequest(String(pendingRequest.id), 'approved', userId);
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

  async sendAdminNotification(payload: {
    adminUserId: string;
    userId: string;
    title: string;
    body: string;
    url?: string;
  }) {
    return this.invokeCompatFunction('send-push', {
      actor_id: payload.adminUserId,
      receiver_id: payload.userId,
      title: payload.title,
      body: payload.body,
      notification_type: 'admin_notice',
      url: payload.url ?? '/notifications',
    });
  }

  async listAdminProfiles(options?: { query?: string | null; limit?: number | null }) {
    const [profiles, messages, savedSearches, blockedUsers, reports, verificationRequests, locations, settings] =
      await Promise.all([
        this.listAllDocuments('profiles'),
        this.listAllDocuments('messages'),
        this.listAllDocuments('saved_searches'),
        this.listAllDocuments('blocked_users'),
        this.listAllDocuments('reports'),
        this.listAllDocuments('verification_requests'),
        this.listLocations(),
        this.getAdminSettings(),
      ]);

    const normalizedQuery = lowerCase(options?.query);
    const limit =
      typeof options?.limit === 'number' && Number.isFinite(options.limit) && options.limit > 0
        ? Math.min(Math.floor(options.limit), 25)
        : 8;
    const locationsById = new Map(locations.map((location: any) => [String(location.id), location]));
    const flaggedUsers = new Set(settings.followUpUserIds);
    const messageCountByUser = new Map<string, number>();
    const savedSearchCountByUser = new Map<string, number>();
    const blockedCountByUser = new Map<string, number>();
    const openReportsByUser = new Map<string, number>();
    const lastActiveAtByUser = new Map<string, string>();
    const pendingVerificationByUser = new Set<string>();

    for (const message of messages) {
      const createdAt = getStringValue(message.created_at);

      for (const userId of [getStringValue(message.sender_id), getStringValue(message.receiver_id)]) {
        if (!userId) {
          continue;
        }

        messageCountByUser.set(userId, (messageCountByUser.get(userId) ?? 0) + 1);

        if (createdAt) {
          const current = lastActiveAtByUser.get(userId);

          if (!current || compareValues(createdAt, current) > 0) {
            lastActiveAtByUser.set(userId, createdAt);
          }
        }
      }
    }

    for (const search of savedSearches) {
      const userId = getStringValue(search.user_id);

      if (userId) {
        savedSearchCountByUser.set(userId, (savedSearchCountByUser.get(userId) ?? 0) + 1);
      }
    }

    for (const blockedUser of blockedUsers) {
      const blockerId = getStringValue(blockedUser.blocker_id);

      if (blockerId) {
        blockedCountByUser.set(blockerId, (blockedCountByUser.get(blockerId) ?? 0) + 1);
      }
    }

    for (const report of reports) {
      const reportedId = getStringValue(report.reported_id);

      if (reportedId && getStringValue(report.status) !== 'resolved') {
        openReportsByUser.set(reportedId, (openReportsByUser.get(reportedId) ?? 0) + 1);
      }
    }

    for (const request of verificationRequests) {
      const userId = getStringValue(request.user_id);

      if (userId && getStringValue(request.status) === 'pending') {
        pendingVerificationByUser.add(userId);
      }
    }

    return profiles
      .map((profile) => {
        const id = String(profile.id ?? '');
        const displayName = buildDisplayName(profile);
        const location = buildLocationLabel(profile, locationsById);
        const joinedAt = getStringValue(profile.created_at);
        const updatedAt = getStringValue(profile.updated_at);
        const lastActiveAt =
          updatedAt && (!lastActiveAtByUser.get(id) || compareValues(updatedAt, lastActiveAtByUser.get(id)) > 0)
            ? updatedAt
            : lastActiveAtByUser.get(id) ?? joinedAt;

        return {
          id,
          displayName,
          firstName: getStringValue(profile.first_name),
          lastName: getStringValue(profile.last_name),
          verified: profile.verified === true,
          location,
          joinedAt,
          lastActiveAt,
          openReports: openReportsByUser.get(id) ?? 0,
          pendingVerification: pendingVerificationByUser.has(id),
          savedSearchCount: savedSearchCountByUser.get(id) ?? 0,
          blockedCount: blockedCountByUser.get(id) ?? 0,
          messageCount: messageCountByUser.get(id) ?? 0,
          flaggedForFollowUp: flaggedUsers.has(id),
        };
      })
      .filter((profile) => {
        if (!normalizedQuery) {
          return true;
        }

        return [profile.displayName, profile.id, profile.location ?? '']
          .some((value) => lowerCase(value).includes(normalizedQuery));
      })
      .sort((left, right) => {
        if (left.flaggedForFollowUp !== right.flaggedForFollowUp) {
          return left.flaggedForFollowUp ? -1 : 1;
        }

        if (left.openReports !== right.openReports) {
          return right.openReports - left.openReports;
        }

        if (left.pendingVerification !== right.pendingVerification) {
          return left.pendingVerification ? -1 : 1;
        }

        return compareValues(right.lastActiveAt, left.lastActiveAt) || left.displayName.localeCompare(right.displayName);
      })
      .slice(0, limit);
  }

  async getAdminUserInvestigation(userId: string) {
    const [profile, profileLookup, messages, savedSearches, blockedUsers, verificationHistory, reports, notifications, locations] =
      await Promise.all([
        this.getProfile(userId),
        this.listAdminProfiles({ query: userId, limit: 50 }),
        this.listMessagesForUser(userId),
        this.listSavedSearches(userId),
        this.listBlockedUsers(userId),
        this.listVerificationRequestsForUser(userId),
        this.listReports(),
        this.listAdminNotificationsForUser(userId),
        this.listLocations(),
      ]);

    const baseUser = profileLookup.find((entry) => entry.id === userId);

    if (!profile || !baseUser) {
      throw new Error('User not found');
    }

    const locationsById = new Map(locations.map((location: any) => [String(location.id), location]));

    return {
      user: {
        ...baseUser,
        aboutMe: getStringValue((profile as any).about_me),
        age: getNumberValue((profile as any).age),
        gender: getStringValue((profile as any).gender),
        passions: Array.isArray((profile as any).passions) ? (profile as any).passions : [],
        languages: Array.isArray((profile as any).languages) ? (profile as any).languages : [],
        isPrivate: (profile as any).is_private === true,
      },
      messages: messages.map((message) => ({
        id: String(message.id ?? ''),
        createdAt: getStringValue(message.created_at),
        direction: message.direction === 'sent' ? 'sent' : 'received',
        content: getStringValue(message.content) ?? '',
        sender: {
          id: String(message.sender?.id ?? ''),
          firstName: getStringValue(message.sender?.first_name),
          lastName: getStringValue(message.sender?.last_name),
        },
        receiver: {
          id: String(message.receiver?.id ?? ''),
          firstName: getStringValue(message.receiver?.first_name),
          lastName: getStringValue(message.receiver?.last_name),
        },
      })),
      savedSearches: savedSearches.map((search) => ({
        id: String(search.id ?? ''),
        name: getStringValue(search.name) ?? 'Saved search',
        query: getStringValue(search.query),
        location: getStringValue(search.location),
        language: getStringValue(search.language),
        gender: getStringValue(search.gender),
        minAge: getNumberValue(search.min_age),
        maxAge: getNumberValue(search.max_age),
        passionIds: getStringArray(search.passion_ids),
        createdAt: getStringValue(search.created_at),
      })),
      blockedUsers: blockedUsers.map((entry) => ({
        id: String(entry.id ?? ''),
        blockedId: getStringValue(entry.blocked_id),
        createdAt: getStringValue(entry.created_at),
        profile: buildAdminQueueUser(entry.profile, locationsById),
      })),
      verificationHistory: verificationHistory.map((entry) => ({
        id: String(entry.id ?? ''),
        status: getStringValue(entry.status) ?? 'pending',
        createdAt: getStringValue(entry.created_at),
      })),
      notifications,
      reportsFiled: reports
        .filter((report) => String(report.reporter_id ?? '') === userId)
        .map((report) => mapAdminReportQueueItem(report, locationsById)),
      reportsAgainst: reports
        .filter((report) => String(report.reported_id ?? '') === userId)
        .map((report) => mapAdminReportQueueItem(report, locationsById)),
    };
  }

  async getAdminDashboardSnapshot() {
    const [reports, verificationRequests, settings, locations, favorites, messages, notifications, pushSubscriptions, profiles] = await Promise.all([
      this.listReports(),
      this.listVerificationRequests(),
      this.getAdminSettings(),
      this.listLocations(),
      this.executeCollectionOperation('favorites', { action: 'select' }),
      this.executeCollectionOperation('messages', { action: 'select' }),
      this.executeCollectionOperation('notifications', { action: 'select' }),
      this.executeCollectionOperation('push_subscriptions', { action: 'select' }),
      this.executeCollectionOperation('profiles', { action: 'select' }),
    ]);

    const locationsById = new Map(locations.map((location: any) => [String(location.id), location]));
    const pendingReports = reports
      .filter((report) => getStringValue(report.status) === 'pending')
      .slice(0, 5)
      .map((report) => mapAdminReportQueueItem(report, locationsById));
    const pendingVerificationRequests = verificationRequests
      .filter((request) => getStringValue(request.status) === 'pending')
      .slice(0, 5)
      .map((request) => mapAdminVerificationQueueItem(request, locationsById));

    const profileList = (profiles.data as any[]) ?? [];
    const notificationList = (notifications.data as any[]) ?? [];
    const verifiedProfiles = profileList.filter((p) => p.verified === true).length;
    const completedProfiles = profileList.filter(
      (p) =>
        getStringValue(p.first_name) &&
        getStringValue(p.last_name) &&
        getStringValue(p.birth_date) &&
        getStringValue(p.gender)
    ).length;
    const unreadNotifications = notificationList.filter((n) => n.read !== true).length;
    const pendingReportCount = reports.filter((r) => getStringValue(r.status) === 'pending').length;
    const pendingVerificationCount = verificationRequests.filter((r) => getStringValue(r.status) === 'pending').length;

    const overview = {
      totalProfiles: profileList.length,
      verifiedProfiles,
      completedProfiles,
      totalMessages: ((messages.data as any[]) ?? []).length,
      totalFavorites: ((favorites.data as any[]) ?? []).length,
      totalNotifications: notificationList.length,
      unreadNotifications,
      activePushSubscriptions: ((pushSubscriptions.data as any[]) ?? []).length,
      totalReports: reports.length,
      pendingReports: pendingReportCount,
      totalVerificationRequests: verificationRequests.length,
      pendingVerificationRequests: pendingVerificationCount,
    };

    return {
      overview,
      queues: {
        reports: pendingReports,
        verificationRequests: pendingVerificationRequests,
      },
      quickActions: {
        pendingReports: pendingReportCount,
        pendingVerificationRequests: pendingVerificationCount,
        flaggedUsers: settings.followUpUserIds.length,
        unreadNotifications,
        totalQueueItems: pendingReportCount + pendingVerificationCount,
      },
      systemControls: settings,
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  async savePushSubscription(payload: {
    userId: string;
    endpoint: string;
    p256dh?: string;
    auth?: string;
  }) {
    const existing = await this.executeCollectionOperation('push_subscriptions', {
      action: 'select',
      filters: [
        { type: 'eq', column: 'user_id', value: payload.userId },
        { type: 'eq', column: 'endpoint', value: payload.endpoint },
      ],
      maybeSingle: true,
    });

    if (existing.data) {
      return { success: true, duplicate: true };
    }

    await this.executeCollectionOperation('push_subscriptions', {
      action: 'insert',
      payload: {
        user_id: payload.userId,
        endpoint: payload.endpoint,
        p256dh: payload.p256dh ?? null,
        auth: payload.auth ?? null,
      },
    });

    return { success: true };
  }

  async deletePushSubscription(userId: string, endpoint?: string) {
    const filters: CollectionFilter[] = [{ type: 'eq', column: 'user_id', value: userId }];

    if (endpoint) {
      filters.push({ type: 'eq', column: 'endpoint', value: endpoint });
    }

    await this.executeCollectionOperation('push_subscriptions', {
      action: 'delete',
      filters,
    });

    return { success: true };
  }

  async createContactRequest(payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
    category: string;
  }) {
    await this.executeCollectionOperation('contact_requests', {
      action: 'insert',
      payload: {
        ...payload,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    });

    return { success: true };
  }

  async listMessagesForUser(userId?: string) {
    const resolvedUserId = userId ?? (await this.requireCurrentUser()).id;
    const relevantMessages = await this.listMessagesForParticipant(resolvedUserId, true);
    const profilesById = await this.fetchByIds(
      'profiles',
      relevantMessages.flatMap((message) => [message.sender_id, message.receiver_id]).filter(Boolean)
    );

    return relevantMessages.map((message) => {
      const sender = profilesById.get(String(message.sender_id));
      const receiver = profilesById.get(String(message.receiver_id));

      return {
        id: message.id,
        created_at: message.created_at,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        content: message.content,
        read_at: message.read_at ?? null,
        direction: String(message.sender_id) === resolvedUserId ? 'sent' : 'received',
        sender: {
          id: String(message.sender_id),
          first_name: sender?.first_name ?? null,
          last_name: sender?.last_name ?? null,
        },
        receiver: {
          id: String(message.receiver_id),
          first_name: receiver?.first_name ?? null,
          last_name: receiver?.last_name ?? null,
        },
      };
    });
  }

  private async trackPresence(_requestedUserId?: string, requestedOnlineAt?: string) {
    const currentUser = await this.requireCurrentUser();
    const onlineAt = typeof requestedOnlineAt === 'string' && !Number.isNaN(Date.parse(requestedOnlineAt))
      ? requestedOnlineAt
      : new Date().toISOString();

    await this.executeCollectionOperation('user_presence', {
      action: 'upsert',
      payload: {
        id: currentUser.id,
        user_id: currentUser.id,
        online_at: onlineAt,
      },
    });

    return {
      data: {
        user_id: currentUser.id,
        online_at: onlineAt,
      },
      error: null,
    };
  }

  private async clearPresence(_requestedUserId?: string) {
    const currentUser = await this.requireCurrentUser();

    await this.executeCollectionOperation('user_presence', {
      action: 'delete',
      filters: [{ type: 'eq', column: 'user_id', value: currentUser.id }],
    });

    return { data: true, error: null };
  }

  private async getOnlineUsers() {
    const now = Date.now();
    const presenceRows = await this.listAllDocuments('user_presence', [Query.orderDesc('online_at')]);
    const activeRows: Array<{ user_id: string; online_at: string }> = [];
    const staleUserIds: string[] = [];

    for (const row of presenceRows) {
      const userId = String(row.user_id ?? '');
      const onlineAtValue = typeof row.online_at === 'string' ? Date.parse(row.online_at) : Number.NaN;

      if (!userId) {
        continue;
      }

      if (!Number.isNaN(onlineAtValue) && now - onlineAtValue <= PRESENCE_TTL_MS) {
        activeRows.push({ user_id: userId, online_at: row.online_at });
      } else {
        staleUserIds.push(userId);
      }
    }

    if (staleUserIds.length) {
      await this.executeCollectionOperation('user_presence', {
        action: 'delete',
        filters: [{ type: 'in', column: 'user_id', value: unique(staleUserIds) }],
      });
    }

    return {
      data: activeRows,
      error: null,
    };
  }

  async listBlockedUsers(userId?: string) {
    const resolvedUserId = userId ?? (await this.requireCurrentUser()).id;
    const response = await this.executeCollectionOperation('blocked_users', {
      action: 'select',
      filters: [{ type: 'eq', column: 'blocker_id', value: resolvedUserId }],
      order: { column: 'created_at', ascending: false },
      select:
        'id, blocker_id, blocked_id, created_at, profile:profiles!blocked_users_blocked_id_fkey(id, first_name, last_name, avatar_url)',
    });

    return (response.data as any[]) ?? [];
  }

  async listSavedSearches(userId?: string) {
    const resolvedUserId = userId ?? (await this.requireCurrentUser()).id;
    const response = await this.executeCollectionOperation('saved_searches', {
      action: 'select',
      filters: [{ type: 'eq', column: 'user_id', value: resolvedUserId }],
      order: { column: 'created_at', ascending: false },
      select: 'id, name, query, location, min_age, max_age, language, gender, passion_ids, created_at',
    });

    return (response.data as any[]) ?? [];
  }

  async listVerificationRequestsForUser(userId?: string) {
    const resolvedUserId = userId ?? (await this.requireCurrentUser()).id;
    const response = await this.executeCollectionOperation('verification_requests', {
      action: 'select',
      filters: [{ type: 'eq', column: 'user_id', value: resolvedUserId }],
      order: { column: 'created_at', ascending: false },
    });

    return (response.data as any[]) ?? [];
  }

  async exportCurrentUserData() {
    const currentUser = await this.requireCurrentUser();
    const [profile, messages, notifications, favorites, blockedUsers, savedSearches, verificationRequests] =
      await Promise.all([
        this.getProfile(currentUser.id),
        this.listMessagesForUser(currentUser.id),
        this.listNotifications(),
        this.loadSavedProfiles(currentUser.id),
        this.listBlockedUsers(currentUser.id),
        this.listSavedSearches(currentUser.id),
        this.listVerificationRequestsForUser(currentUser.id),
      ]);

    return {
      exported_at: new Date().toISOString(),
      user: currentUser,
      profile,
      messages,
      notifications,
      favorites,
      blocked_users: blockedUsers,
      saved_searches: savedSearches,
      verification_requests: verificationRequests,
    };
  }

  private async getDistinctCountries() {
    const locations = await this.listLocations();
    return {
      data: unique(locations.map((location: any) => location.country).filter(Boolean))
        .sort((left, right) => left.localeCompare(right))
        .map((country) => ({ country })),
      error: null,
    };
  }

  private async getDistinctRegions(country?: string) {
    const locations = await this.listLocations();
    const regions = unique(
      locations
        .filter((location: any) => !country || location.country === country)
        .map((location: any) => location.region)
        .filter(Boolean)
    ).sort((left, right) => left.localeCompare(right));

    return {
      data: regions.map((region) => ({ region })),
      error: null,
    };
  }

  private async getDistinctCities(country?: string, region?: string) {
    const locations = await this.listLocations();
    const cities = unique(
      locations
        .filter((location: any) => (!country || location.country === country) && (!region || location.region === region))
        .map((location: any) => location.city)
        .filter(Boolean)
    ).sort((left, right) => left.localeCompare(right));

    return {
      data: cities.map((city) => ({ city })),
      error: null,
    };
  }

  private async isBlocked(targetId: string) {
    const currentUser = await this.requireCurrentUser();
    const response = await this.executeCollectionOperation('blocked_users', {
      action: 'select',
      filters: [
        { type: 'eq', column: 'blocker_id', value: currentUser.id },
        { type: 'eq', column: 'blocked_id', value: targetId },
      ],
      maybeSingle: true,
    });

    return { data: Boolean(response.data), error: response.error };
  }

  private async isBlockedBy(targetId: string) {
    const currentUser = await this.requireCurrentUser();
    const response = await this.executeCollectionOperation('blocked_users', {
      action: 'select',
      filters: [
        { type: 'eq', column: 'blocker_id', value: targetId },
        { type: 'eq', column: 'blocked_id', value: currentUser.id },
      ],
      maybeSingle: true,
    });

    return { data: Boolean(response.data), error: response.error };
  }

  private async blockUser(targetId: string) {
    const currentUser = await this.requireCurrentUser();
    const response = await this.executeCollectionOperation('blocked_users', {
      action: 'select',
      filters: [
        { type: 'eq', column: 'blocker_id', value: currentUser.id },
        { type: 'eq', column: 'blocked_id', value: targetId },
      ],
      maybeSingle: true,
    });

    if (!response.data) {
      await this.executeCollectionOperation('blocked_users', {
        action: 'insert',
        payload: {
          blocker_id: currentUser.id,
          blocked_id: targetId,
          created_at: new Date().toISOString(),
        },
      });
    }

    return { data: true, error: null };
  }

  private async unblockUser(targetId: string) {
    const currentUser = await this.requireCurrentUser();
    await this.executeCollectionOperation('blocked_users', {
      action: 'delete',
      filters: [
        { type: 'eq', column: 'blocker_id', value: currentUser.id },
        { type: 'eq', column: 'blocked_id', value: targetId },
      ],
    });

    return { data: true, error: null };
  }

  private async isSaved(targetId: string) {
    const currentUser = await this.requireCurrentUser();
    const response = await this.executeCollectionOperation('favorites', {
      action: 'select',
      filters: [
        { type: 'eq', column: 'user_id', value: currentUser.id },
        { type: 'eq', column: 'favorite_id', value: targetId },
      ],
      maybeSingle: true,
    });

    return { data: Boolean(response.data), error: response.error };
  }

  private async saveProfileToFavorites(targetId: string) {
    const currentUser = await this.requireCurrentUser();
    const existing = await this.isSaved(targetId);

    if (!existing.data) {
      await this.executeCollectionOperation('favorites', {
        action: 'insert',
        payload: {
          user_id: currentUser.id,
          favorite_id: targetId,
          created_at: new Date().toISOString(),
        },
      });
    }

    return { data: true, error: null };
  }

  private async unsaveProfile(targetId: string) {
    const currentUser = await this.requireCurrentUser();
    await this.executeCollectionOperation('favorites', {
      action: 'delete',
      filters: [
        { type: 'eq', column: 'user_id', value: currentUser.id },
        { type: 'eq', column: 'favorite_id', value: targetId },
      ],
    });

    return { data: true, error: null };
  }

  private async loadSavedProfiles(currentUserId: string) {
    const favoriteRows = await this.executeCollectionOperation('favorites', {
      action: 'select',
      filters: [{ type: 'eq', column: 'user_id', value: currentUserId }],
      select: 'favorite_id',
    });

    const favoriteIds = ((favoriteRows.data as any[]) ?? []).map((row) => row.favorite_id);

    if (!favoriteIds.length) {
      return [];
    }

    const [profilesResponse, passionsResponse, languagesResponse, locations] = await Promise.all([
      this.executeCollectionOperation('profiles', {
        action: 'select',
        filters: [{ type: 'in', column: 'id', value: favoriteIds }],
        select:
          'id, first_name, last_name, about_me, age, gender, location_id, created_at, is_private, show_age, show_location',
      }),
      this.executeCollectionOperation('profile_passions', {
        action: 'select',
        filters: [{ type: 'in', column: 'profile_id', value: favoriteIds }],
        select: 'profile_id, passions(name)',
      }),
      this.executeCollectionOperation('profile_languages', {
        action: 'select',
        filters: [{ type: 'in', column: 'profile_id', value: favoriteIds }],
        select: 'profile_id, languages(name)',
      }),
      this.listLocations(),
    ]);

    const locationsById = new Map(
      locations.map((location: any) => [String(location.id), location])
    );
    const passionsByProfileId = new Map<string, string[]>();
    const languagesByProfileId = new Map<string, string[]>();

    for (const row of (passionsResponse.data as any[]) ?? []) {
      const names = passionsByProfileId.get(String(row.profile_id)) ?? [];
      if (row.passions?.name) {
        names.push(row.passions.name);
      }
      passionsByProfileId.set(String(row.profile_id), names);
    }

    for (const row of (languagesResponse.data as any[]) ?? []) {
      const names = languagesByProfileId.get(String(row.profile_id)) ?? [];
      if (row.languages?.name) {
        names.push(row.languages.name);
      }
      languagesByProfileId.set(String(row.profile_id), names);
    }

    const profilesById = new Map(
      ((profilesResponse.data as any[]) ?? []).map((profile) => [String(profile.id), profile])
    );

    return favoriteIds
      .map((favoriteId) => {
        const profile = profilesById.get(String(favoriteId));

        if (!profile) {
          return null;
        }

        const location = profile.location_id ? locationsById.get(String(profile.location_id)) : null;

        return {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          about_me: profile.about_me,
          location: profile.show_location === false ? null : location?.city ?? null,
          age: profile.show_age === false ? null : profile.age,
          gender: profile.gender,
          profile_languages: languagesByProfileId.get(String(profile.id)) ?? [],
          created_at: profile.created_at,
          profilepassions: passionsByProfileId.get(String(profile.id)) ?? [],
          is_private: profile.is_private,
          show_age: profile.show_age,
          show_location: profile.show_location,
        };
      })
      .filter(Boolean);
  }

  private async getSavedProfiles() {
    const currentUser = await this.requireCurrentUser();

    return {
      data: await this.loadSavedProfiles(currentUser.id),
      error: null,
    };
  }

  private async getConversations(currentUserId: string) {
    const relevantMessages = await this.listMessagesForParticipant(currentUserId, false);
    const conversationMap = new Map<string, any>();

    for (const message of relevantMessages) {
      const otherUserId = String(message.sender_id) === currentUserId ? String(message.receiver_id) : String(message.sender_id);
      const current = conversationMap.get(otherUserId);

      if (!current || compareValues(message.created_at, current.last_message_time) > 0) {
        conversationMap.set(otherUserId, {
          conversation_id: otherUserId,
          user_id: otherUserId,
          last_message: message.content,
          last_message_time: message.created_at,
          unread:
            String(message.receiver_id) === currentUserId && !message.read_at
              ? (current?.unread ?? 0) + 1
              : current?.unread ?? 0,
        });
      } else if (String(message.receiver_id) === currentUserId && !message.read_at) {
        current.unread = (current.unread ?? 0) + 1;
      }
    }

    const profilesById = await this.fetchByIds('profiles', Array.from(conversationMap.keys()));

    return {
      data: Array.from(conversationMap.values())
        .map((conversation) => {
          const profile = profilesById.get(String(conversation.user_id));
          const firstName = profile?.first_name ?? '';
          const lastName = profile?.last_name ?? '';
          return {
            ...conversation,
            first_name: firstName,
            last_name: lastName,
            full_name: [firstName, lastName].filter(Boolean).join(' ').trim(),
          };
        })
        .sort((left, right) => compareValues(right.last_message_time, left.last_message_time)),
      error: null,
    };
  }

  private async getRecentConversations(currentUserId: string) {
    const conversations = await this.getConversations(currentUserId);

    return {
      data: ((conversations.data as any[]) ?? []).slice(0, 5),
      error: conversations.error,
    };
  }

  private async markMessagesAsRead(senderId: string, receiverId: string) {
    const currentUser = await this.requireCurrentUser();
    const resolvedReceiverId = receiverId || currentUser.id;

    await this.executeCollectionOperation('messages', {
      action: 'update',
      filters: [
        { type: 'eq', column: 'sender_id', value: senderId },
        { type: 'eq', column: 'receiver_id', value: resolvedReceiverId },
      ],
      payload: { read_at: new Date().toISOString() },
    });

    return { data: true, error: null };
  }

  private async searchProfiles(filters: Record<string, any>) {
    const currentUserId = filters.p_current_user_id ? String(filters.p_current_user_id) : undefined;
    const toNullableNumber = (value: unknown) => {
      if (value === null || value === undefined || value === '') {
        return null;
      }

      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const loadBlockedRows = async (column: 'blocker_id' | 'blocked_id') => {
      if (!currentUserId) {
        return [];
      }

      try {
        return await this.listAllDocuments('blocked_users', [Query.equal(column, currentUserId)]);
      } catch {
        const allBlockedRows = await this.listAllDocuments('blocked_users');
        return allBlockedRows.filter((row) => String(row[column]) === currentUserId);
      }
    };
    const [locations, passions, languages, blockedByCurrentRows, blockedCurrentRows] = await Promise.all([
      this.listLocations(),
      this.listAllDocuments('passions'),
      this.listAllDocuments('languages'),
      loadBlockedRows('blocker_id'),
      loadBlockedRows('blocked_id'),
    ]);

    const locationsById = new Map<string, any>(locations.map((location: any) => [String(location.id), location]));
    const passionsById = new Map<string, any>(passions.map((passion: any) => [String(passion.id), passion]));
    const languagesById = new Map<string, any>(languages.map((language: any) => [String(language.id), language]));

    const blockedByCurrent = new Set<string>();
    const blockedCurrent = new Set<string>();

    for (const block of blockedByCurrentRows) {
      blockedByCurrent.add(String(block.blocked_id));
    }

    for (const block of blockedCurrentRows) {
      blockedCurrent.add(String(block.blocker_id));
    }

    const query = lowerCase(filters.p_query);
    const locationQuery = lowerCase(filters.p_location);
    const languageQuery = lowerCase(filters.p_language);
    const genderFilter = lowerCase(filters.p_gender);
    const passionFilter = Array.isArray(filters.p_passion_ids)
      ? filters.p_passion_ids.map((value: unknown) => String(value))
      : [];
    const minAge = toNullableNumber(filters.p_min_age);
    const maxAge = toNullableNumber(filters.p_max_age);
    const offset = Math.max(0, Math.floor(toNullableNumber(filters.p_offset) ?? 0));
    const limit = Math.max(1, Math.floor(toNullableNumber(filters.p_limit) ?? 10));
    const matchedLocationIds = locationQuery
      ? locations
        .filter((location: any) => {
          const locationValue = [location.city, location.region, location.country].filter(Boolean).join(', ');
          return lowerCase(locationValue).includes(locationQuery);
        })
        .map((location: any) => String(location.id))
      : [];

    if (locationQuery && !matchedLocationIds.length) {
      return {
        data: [],
        error: null,
      };
    }

    const profileQueries = [Query.orderDesc('created_at')];

    if (matchedLocationIds.length) {
      profileQueries.push(Query.equal('location_id', matchedLocationIds));
    }

    const targetResultCount = offset + limit;
    const batchSize = Math.min(BATCH_SIZE, Math.max(limit, 25));
    const results: Array<Record<string, any>> = [];
    let profileOffset = 0;

    while (results.length < targetResultCount) {
      const profiles = await this.listDocumentsPage('profiles', profileQueries, batchSize, profileOffset);

      if (!profiles.length) {
        break;
      }

      profileOffset += profiles.length;

      const candidateProfiles = profiles.filter((profile) => {
        const profileId = String(profile.id);

        if (currentUserId && profileId === currentUserId) {
          return false;
        }

        if (currentUserId && (blockedByCurrent.has(profileId) || blockedCurrent.has(profileId))) {
          return false;
        }

        const profileAge = calculateProfileAge(profile);

        if (minAge !== null && (profileAge === null || profileAge < minAge)) {
          return false;
        }

        if (maxAge !== null && (profileAge === null || profileAge > maxAge)) {
          return false;
        }

        if (genderFilter && lowerCase(profile.gender) !== genderFilter) {
          return false;
        }

        if (query) {
          const haystack = [profile.first_name, profile.last_name, profile.about_me]
            .map((value) => lowerCase(value))
            .join(' ');

          if (!haystack.includes(query)) {
            return false;
          }
        }

        if (locationQuery) {
          const location = profile.location_id ? locationsById.get(String(profile.location_id)) : null;
          const locationValue = location ? [location.city, location.region, location.country].filter(Boolean).join(', ') : null;

          if (!lowerCase(locationValue).includes(locationQuery)) {
            return false;
          }
        }

        return true;
      });

      if (candidateProfiles.length) {
        const candidateProfileIds = candidateProfiles.map((profile) => String(profile.id));
        const [passionRows, languageRows] = await Promise.all([
          this.listAllDocuments('profile_passions', [Query.equal('profile_id', candidateProfileIds)]),
          this.listAllDocuments('profile_languages', [Query.equal('profile_id', candidateProfileIds)]),
        ]);
        const passionsByProfile = new Map<string, string[]>();
        const passionIdsByProfile = new Map<string, string[]>();
        const languagesByProfile = new Map<string, string[]>();

        for (const row of passionRows) {
          const profileId = String(row.profile_id);
          const names = passionsByProfile.get(profileId) ?? [];
          const ids = passionIdsByProfile.get(profileId) ?? [];
          const passion = passionsById.get(String(row.passion_id));

          if (passion?.name) {
            names.push(passion.name);
          }

          if (row.passion_id) {
            ids.push(String(row.passion_id));
          }

          passionsByProfile.set(profileId, names);
          passionIdsByProfile.set(profileId, ids);
        }

        for (const row of languageRows) {
          const profileId = String(row.profile_id);
          const names = languagesByProfile.get(profileId) ?? [];
          const language = languagesById.get(String(row.language_id));

          if (language?.name) {
            names.push(language.name);
          }

          languagesByProfile.set(profileId, names);
        }

        const matchedProfiles = candidateProfiles
          .map((profile) => {
            const location = profile.location_id ? locationsById.get(String(profile.location_id)) : null;
            return {
              id: profile.id,
              first_name: profile.first_name ?? null,
              last_name: profile.last_name ?? null,
              about_me: profile.about_me ?? null,
              location: location ? [location.city, location.region, location.country].filter(Boolean).join(', ') : null,
              age: profile.show_age === false ? null : calculateProfileAge(profile),
              gender: profile.gender ?? null,
              profile_languages: languagesByProfile.get(String(profile.id)) ?? [],
              created_at: profile.created_at,
              last_login: profile.last_login ?? null,
              profilepassions: passionsByProfile.get(String(profile.id)) ?? [],
              is_private: profile.is_private ?? false,
              show_age: profile.show_age ?? true,
              show_location: profile.show_location ?? true,
            };
          })
          .filter((profile) => {
            if (languageQuery) {
              const hasLanguage = (profile.profile_languages ?? []).some((language) => lowerCase(language).includes(languageQuery));
              if (!hasLanguage) {
                return false;
              }
            }

            if (passionFilter.length) {
              const profilePassionIds = passionIdsByProfile.get(String(profile.id)) ?? [];
              if (!passionFilter.some((passionId) => profilePassionIds.includes(passionId))) {
                return false;
              }
            }

            return true;
          });

        results.push(...matchedProfiles);
      }

      if (profiles.length < batchSize) {
        break;
      }
    }

    return {
      data: results.slice(offset, offset + limit),
      error: null,
    };
  }

  private async getSuggestedProfiles(currentUserId: string, limit: number) {
    const [currentUserPassions, searchResults] = await Promise.all([
      this.listAllDocuments('profile_passions', [Query.equal('profile_id', currentUserId)]),
      this.searchProfiles({ p_current_user_id: currentUserId, p_limit: 500, p_offset: 0 }),
    ]);
    const currentPassionIds = new Set(currentUserPassions.map((row) => String(row.passion_id)));
    const allPassionRows = await this.listAllDocuments('profile_passions');
    const passionsByProfile = new Map<string, string[]>();

    for (const row of allPassionRows) {
      const ids = passionsByProfile.get(String(row.profile_id)) ?? [];
      ids.push(String(row.passion_id));
      passionsByProfile.set(String(row.profile_id), ids);
    }

    const suggestions = ((searchResults.data as any[]) ?? [])
      .map((profile) => {
        const sharedPassionsCount = (passionsByProfile.get(String(profile.id)) ?? []).filter((id) => currentPassionIds.has(id)).length;
        return {
          ...profile,
          shared_passions_count: sharedPassionsCount,
        };
      })
      .filter((profile) => profile.shared_passions_count > 0)
      .sort((left, right) => {
        if (right.shared_passions_count !== left.shared_passions_count) {
          return right.shared_passions_count - left.shared_passions_count;
        }

        return compareValues(right.created_at, left.created_at);
      })
      .slice(0, limit);

    return {
      data: suggestions,
      error: null,
    };
  }
}

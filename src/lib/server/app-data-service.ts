import { ID, Query } from 'node-appwrite';
import { getAppwriteCollectionId, getAppwriteFunctionId } from '@/lib/appwrite/config';
import {
  createAppwriteAdminFunctions,
  createAppwriteSessionAccount,
  getAppwriteErrorMessage,
} from '@/lib/appwrite/server';
import { AppwriteRepository } from './appwrite-repo';

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

  private async listAllDocuments(collection: string, queries: string[] = []) {
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

  private applyOrderAndWindow(documents: Record<string, any>[], operation: CollectionOperation) {
    const ordered = [...documents];

    if (operation.order?.column) {
      ordered.sort((left, right) => {
        const result = compareValues(left[operation.order!.column], right[operation.order!.column]);
        return operation.order!.ascending ? result : -result;
      });
    }

    const offset = operation.range?.from ?? 0;
    const explicitLimit = operation.range
      ? Math.max(0, operation.range.to - operation.range.from + 1)
      : operation.limit ?? null;

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
      const data = {
        ...entry,
        id: requestedId ?? documentId,
      };
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
      select: '*, locations(*)',
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

  async listPassions() {
    const response = await this.executeCollectionOperation('passions', {
      action: 'select',
      order: { column: 'name', ascending: true },
      select: 'id, name',
    });

    return (response.data as any[]) ?? [];
  }

  async listLocations() {
    const response = await this.executeCollectionOperation('locations', {
      action: 'select',
      order: { column: 'country', ascending: true },
      select: 'id, city, region, country',
    });

    return (response.data as any[]) ?? [];
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

    const functionId = getAppwriteFunctionId(name);

    if (functionId) {
      await this.functions.createExecution(functionId, JSON.stringify(data ?? {}), false);
      return { success: true };
    }

    const currentUser = await this.getCurrentUser();

    if (data?.receiver_id) {
      await this.executeCollectionOperation('notifications', {
        action: 'insert',
        payload: {
          receiver_id: data.receiver_id,
          actor_id: currentUser?.id ?? null,
          type: 'new_message',
          read: false,
          title: data.title ?? 'New message',
          body: data.body ?? '',
          url: data.url ?? null,
          created_at: new Date().toISOString(),
        },
      });
    }

    return { success: true, fallback: true };
  }

  async executeCompatQuery(query: any, params?: any[]) {
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
      const existingLocation = await this.executeCollectionOperation('locations', {
        action: 'select',
        filters: [
          { type: 'eq', column: 'city', value: data.location.city },
          { type: 'eq', column: 'region', value: data.location.region ?? '' },
          { type: 'eq', column: 'country', value: data.location.country },
        ],
        maybeSingle: true,
        select: 'id, city, region, country',
      });

      if (existingLocation.data) {
        locationId = (existingLocation.data as { id: string }).id;
      } else {
        const createdLocation = await this.executeCollectionOperation('locations', {
          action: 'insert',
          payload: {
            city: data.location.city,
            region: data.location.region ?? '',
            country: data.location.country,
          },
          select: 'id, city, region, country',
          single: true,
        });

        locationId = (createdLocation.data as { id: string }).id;
      }
    }

    const profilePayload = {
      id,
      first_name: data.first_name,
      last_name: data.last_name,
      about_me: data.about_me ?? '',
      age: data.age ?? null,
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
      this.executeCollectionOperation('verification_requests', {
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

  async trackAnalyticsEvent(payload: { eventName: string; properties?: Record<string, unknown>; path?: string }) {
    await this.executeCollectionOperation('analytics_events', {
      action: 'insert',
      payload: {
        event_name: payload.eventName,
        properties: payload.properties ?? {},
        path: payload.path ?? null,
        created_at: new Date().toISOString(),
      },
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
    const messages = await this.listAllDocuments('messages');
    const relevantMessages = messages
      .filter(
        (message) =>
          String(message.sender_id) === resolvedUserId || String(message.receiver_id) === resolvedUserId
      )
      .sort((left, right) => compareValues(left.created_at, right.created_at));
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
    const messages = await this.listAllDocuments('messages');
    const relevantMessages = messages.filter(
      (message) => String(message.sender_id) === currentUserId || String(message.receiver_id) === currentUserId
    );
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
          return {
            ...conversation,
            first_name: profile?.first_name ?? '',
            last_name: profile?.last_name ?? '',
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
    const [profiles, locations, passionRows, languageRows, blockedRows] = await Promise.all([
      this.listAllDocuments('profiles'),
      this.listLocations(),
      this.listAllDocuments('profile_passions'),
      this.listAllDocuments('profile_languages'),
      currentUserId ? this.listAllDocuments('blocked_users') : Promise.resolve([]),
    ]);

    const passionsByProfile = new Map<string, string[]>();
    const passionIdsByProfile = new Map<string, string[]>();
    const languagesByProfile = new Map<string, string[]>();
    const locationsById = new Map<string, any>(locations.map((location: any) => [String(location.id), location]));
    const passionsById = await this.fetchByIds(
      'passions',
      passionRows.map((row) => row.passion_id).filter(Boolean)
    );
    const languagesById = await this.fetchByIds(
      'languages',
      languageRows.map((row) => row.language_id).filter(Boolean)
    );

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

    const blockedByCurrent = new Set<string>();
    const blockedCurrent = new Set<string>();

    for (const block of blockedRows) {
      if (String(block.blocker_id) === currentUserId) {
        blockedByCurrent.add(String(block.blocked_id));
      }

      if (String(block.blocked_id) === currentUserId) {
        blockedCurrent.add(String(block.blocker_id));
      }
    }

    const query = lowerCase(filters.p_query);
    const locationQuery = lowerCase(filters.p_location);
    const languageQuery = lowerCase(filters.p_language);
    const genderFilter = lowerCase(filters.p_gender);
    const passionFilter = Array.isArray(filters.p_passion_ids)
      ? filters.p_passion_ids.map((value: unknown) => String(value))
      : [];
    const minAge = typeof filters.p_min_age === 'number' ? filters.p_min_age : null;
    const maxAge = typeof filters.p_max_age === 'number' ? filters.p_max_age : null;
    const offset = Number(filters.p_offset ?? 0);
    const limit = Number(filters.p_limit ?? 10);

    const results = profiles
      .filter((profile) => !currentUserId || String(profile.id) !== currentUserId)
      .filter((profile) => !currentUserId || (!blockedByCurrent.has(String(profile.id)) && !blockedCurrent.has(String(profile.id))))
      .map((profile) => {
        const location = profile.location_id ? locationsById.get(String(profile.location_id)) : null;
        return {
          id: profile.id,
          first_name: profile.first_name ?? null,
          last_name: profile.last_name ?? null,
          about_me: profile.about_me ?? null,
          location: location ? [location.city, location.region, location.country].filter(Boolean).join(', ') : null,
          age: profile.age ?? null,
          gender: profile.gender ?? null,
          profile_languages: languagesByProfile.get(String(profile.id)) ?? [],
          created_at: profile.created_at,
          profilepassions: passionsByProfile.get(String(profile.id)) ?? [],
          is_private: profile.is_private ?? false,
          show_age: profile.show_age ?? true,
          show_location: profile.show_location ?? true,
        };
      })
      .filter((profile) => {
        if (query) {
          const haystack = [profile.first_name, profile.last_name, profile.about_me]
            .map((value) => lowerCase(value))
            .join(' ');

          if (!haystack.includes(query)) {
            return false;
          }
        }

        if (locationQuery && !lowerCase(profile.location).includes(locationQuery)) {
          return false;
        }

        if (minAge !== null && (profile.age === null || profile.age < minAge)) {
          return false;
        }

        if (maxAge !== null && (profile.age === null || profile.age > maxAge)) {
          return false;
        }

        if (genderFilter && lowerCase(profile.gender) !== genderFilter) {
          return false;
        }

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
      })
      .sort((left, right) => compareValues(right.created_at, left.created_at));

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

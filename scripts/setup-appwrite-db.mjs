import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config as loadEnv } from 'dotenv';

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, '.env');
const envLocalPath = path.join(projectRoot, '.env.local');

if (existsSync(envPath)) {
  loadEnv({ path: envPath });
}

if (existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath, override: true });
}

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim();
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim();
const apiKey = process.env.APPWRITE_API_KEY?.trim();
const databaseId = (
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ??
  process.env.APPWRITE_DATABASE_ID ??
  process.env.DATABASE_ID
)?.trim();
const setupOnly = process.env.APPWRITE_SETUP_ONLY?.trim();
const setupFrom = process.env.APPWRITE_SETUP_FROM?.trim();

if (!endpoint || !projectId || !apiKey || !databaseId) {
  throw new Error(
    'Missing Appwrite configuration. Expected NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY, and NEXT_PUBLIC_APPWRITE_DATABASE_ID or APPWRITE_DATABASE_ID.'
  );
}

const syncSleep = (ms) => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const isTransientAppwriteError = (message) => {
  if (typeof message !== 'string') {
    return false;
  }

  const normalizedMessage = message.toLowerCase();

  return [
    'fetch failed',
    'connection reset by peer',
    'request timedout',
    'timed out',
    'unexpected eof while reading',
    'error 503',
    'bad gateway',
    'varnish cache server',
    'ssl routines',
  ].some((fragment) => normalizedMessage.includes(fragment));
};

const runCli = (args, { raw = false, allowFailure = false } = {}) => {
  const cliArgs = ['appwrite-cli'];

  if (raw) {
    cliArgs.push('--raw');
  }

  cliArgs.push(...args);

  let lastMessage = '';

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return execFileSync('npx', cliArgs, {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
    } catch (error) {
      const stdout = error.stdout?.toString().trim() ?? '';
      const stderr = error.stderr?.toString().trim() ?? '';
      const message = stderr || stdout || error.message;
      lastMessage = message;

      if (isTransientAppwriteError(message) && attempt < 3) {
        syncSleep(1000 * (attempt + 1));
        continue;
      }

      if (allowFailure) {
        return { ok: false, message };
      }

      throw new Error(message);
    }
  }

  if (allowFailure) {
    return { ok: false, message: lastMessage };
  }

  throw new Error(lastMessage || 'Unknown Appwrite CLI error');
};

const isAlreadyExistsError = (message) =>
  typeof message === 'string' && message.toLowerCase().includes('already exists');

const runCliJson = (args, options) => {
  const output = runCli(args, { ...options, raw: true });

  if (!output) {
    return null;
  }

  return JSON.parse(output);
};

const ensureClient = () => {
  runCli(['client', '--endpoint', endpoint, '--project-id', projectId, '--key', apiKey]);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCollections = () => {
  const response = runCliJson(['databases', 'list-collections', '--database-id', databaseId]);
  return response?.collections ?? [];
};

const getAttributes = (collectionId) => {
  const response = runCliJson(['databases', 'list-attributes', '--database-id', databaseId, '--collection-id', collectionId]);
  return response?.attributes ?? [];
};

const getIndexes = (collectionId) => {
  const response = runCliJson(['databases', 'list-indexes', '--database-id', databaseId, '--collection-id', collectionId]);
  return response?.indexes ?? [];
};

const ensureDatabase = () => {
  const existing = runCli(['databases', 'get', '--database-id', databaseId], { raw: true, allowFailure: true });

  if (existing && typeof existing === 'string') {
    console.log(`Database ${databaseId} already exists.`);
    return;
  }

  console.log(`Creating database ${databaseId}...`);
  runCli(['databases', 'create', '--database-id', databaseId, '--name', 'skillogue', '--enabled', 'true']);
};

const ensureCollection = (collection) => {
  const collections = getCollections();

  if (collections.some((item) => item.$id === collection.id)) {
    console.log(`Collection ${collection.id} already exists.`);
    return;
  }

  console.log(`Creating collection ${collection.id}...`);
  const result = runCli([
    'databases',
    'create-collection',
    '--database-id', databaseId,
    '--collection-id', collection.id,
    '--name', collection.name,
    '--document-security', 'false',
    '--enabled', 'true',
  ], { allowFailure: true });

  if (typeof result === 'object' && result.ok === false && !isAlreadyExistsError(result.message)) {
    throw new Error(result.message);
  }
};

const ensureAttribute = (collectionId, attribute) => {
  const attributes = getAttributes(collectionId);

  if (attributes.some((item) => item.key === attribute.key)) {
    console.log(`Attribute ${collectionId}.${attribute.key} already exists.`);
    return;
  }

  console.log(`Creating attribute ${collectionId}.${attribute.key}...`);

  const args = [
    'databases',
    `create-${attribute.kind}-attribute`,
    '--database-id', databaseId,
    '--collection-id', collectionId,
    '--key', attribute.key,
    '--required', String(Boolean(attribute.required)),
  ];

  if (typeof attribute.size === 'number') {
    args.push('--size', String(attribute.size));
  }

  if (typeof attribute.min === 'number') {
    args.push('--min', String(attribute.min));
  }

  if (typeof attribute.max === 'number') {
    args.push('--max', String(attribute.max));
  }

  if (Object.prototype.hasOwnProperty.call(attribute, 'default')) {
    args.push('--xdefault', String(attribute.default));
  }

  if (attribute.array) {
    args.push('--array', 'true');
  }

  const result = runCli(args, { allowFailure: true });

  if (typeof result === 'object' && result.ok === false && !isAlreadyExistsError(result.message)) {
    throw new Error(result.message);
  }
};

const waitForAttributes = async (collectionId, keys) => {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const attributes = getAttributes(collectionId);
    const relevant = attributes.filter((item) => keys.includes(item.key));

    if (
      relevant.length === keys.length &&
      relevant.every((item) => item.status === 'available' || item.status === 'available_at' || item.status === undefined)
    ) {
      return;
    }

    await wait(1000);
  }

  throw new Error(`Timed out waiting for attributes in ${collectionId}.`);
};

const ensureIndex = (collectionId, index) => {
  const indexes = getIndexes(collectionId);

  if (indexes.some((item) => item.key === index.key)) {
    console.log(`Index ${collectionId}.${index.key} already exists.`);
    return;
  }

  console.log(`Creating index ${collectionId}.${index.key}...`);

  const args = [
    'databases',
    'create-index',
    '--database-id', databaseId,
    '--collection-id', collectionId,
    '--key', index.key,
    '--type', index.type,
    '--attributes',
    ...index.attributes,
  ];

  if (index.orders?.length) {
    args.push('--orders', ...index.orders);
  }

  const result = runCli(args, { allowFailure: true });

  if (typeof result === 'object' && result.ok === false && !isAlreadyExistsError(result.message)) {
    throw new Error(result.message);
  }
};

const varchar = (key, size = 255, options = {}) => ({ kind: 'varchar', key, size, ...options });
const integer = (key, options = {}) => ({ kind: 'integer', key, ...options });
const boolean = (key, options = {}) => ({ kind: 'boolean', key, ...options });
const datetime = (key, options = {}) => ({ kind: 'datetime', key, ...options });
const analyticsPropertiesSize = 4096;
const contactMessageSize = 8192;

const collections = [
  {
    id: 'profiles',
    name: 'profiles',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('first_name', 255),
      varchar('last_name', 255),
      varchar('about_me', 4096),
      integer('age'),
      varchar('gender', 64),
      varchar('avatar_url', 2048),
      boolean('verified', { default: false }),
      boolean('is_private', { default: false }),
      boolean('show_age', { default: true }),
      boolean('show_location', { default: true }),
      varchar('location_id', 255),
      datetime('created_at', { required: true }),
      datetime('updated_at', { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'gender_idx', type: 'key', attributes: ['gender'], orders: ['ASC'] },
      { key: 'age_idx', type: 'key', attributes: ['age'], orders: ['ASC'] },
      { key: 'location_idx', type: 'key', attributes: ['location_id'], orders: ['ASC'] },
      { key: 'created_idx', type: 'key', attributes: ['created_at'], orders: ['DESC'] },
    ],
  },
  {
    id: 'locations',
    name: 'locations',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('city', 255, { required: true }),
      varchar('region', 255, { required: true }),
      varchar('country', 255, { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'country_region_city_idx', type: 'key', attributes: ['country', 'region', 'city'], orders: ['ASC', 'ASC', 'ASC'] },
      { key: 'city_region_country_unique', type: 'unique', attributes: ['city', 'region', 'country'], orders: ['ASC', 'ASC', 'ASC'] },
    ],
  },
  {
    id: 'passions',
    name: 'passions',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('name', 255, { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'name_idx', type: 'key', attributes: ['name'], orders: ['ASC'] },
    ],
  },
  {
    id: 'languages',
    name: 'languages',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('name', 255, { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'name_idx', type: 'key', attributes: ['name'], orders: ['ASC'] },
    ],
  },
  {
    id: 'profile_passions',
    name: 'profile_passions',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('profile_id', 255, { required: true }),
      varchar('passion_id', 255, { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'profile_idx', type: 'key', attributes: ['profile_id'], orders: ['ASC'] },
      { key: 'passion_idx', type: 'key', attributes: ['passion_id'], orders: ['ASC'] },
      { key: 'profile_passion_unique', type: 'unique', attributes: ['profile_id', 'passion_id'], orders: ['ASC', 'ASC'] },
    ],
  },
  {
    id: 'profile_languages',
    name: 'profile_languages',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('profile_id', 255, { required: true }),
      varchar('language_id', 255, { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'profile_idx', type: 'key', attributes: ['profile_id'], orders: ['ASC'] },
      { key: 'language_idx', type: 'key', attributes: ['language_id'], orders: ['ASC'] },
      { key: 'profile_language_unique', type: 'unique', attributes: ['profile_id', 'language_id'], orders: ['ASC', 'ASC'] },
    ],
  },
  {
    id: 'favorites',
    name: 'favorites',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('user_id', 255, { required: true }),
      varchar('favorite_id', 255, { required: true }),
      datetime('created_at', { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'user_idx', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
      { key: 'user_favorite_unique', type: 'unique', attributes: ['user_id', 'favorite_id'], orders: ['ASC', 'ASC'] },
    ],
  },
  {
    id: 'blocked_users',
    name: 'blocked_users',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('blocker_id', 255, { required: true }),
      varchar('blocked_id', 255, { required: true }),
      datetime('created_at', { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'blocker_idx', type: 'key', attributes: ['blocker_id'], orders: ['ASC'] },
      { key: 'blocked_idx', type: 'key', attributes: ['blocked_id'], orders: ['ASC'] },
      { key: 'blocker_blocked_unique', type: 'unique', attributes: ['blocker_id', 'blocked_id'], orders: ['ASC', 'ASC'] },
    ],
  },
  {
    id: 'messages',
    name: 'messages',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('sender_id', 255, { required: true }),
      varchar('receiver_id', 255, { required: true }),
      varchar('content', 8192, { required: true }),
      datetime('created_at', { required: true }),
      datetime('read_at'),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'sender_idx', type: 'key', attributes: ['sender_id'], orders: ['ASC'] },
      { key: 'receiver_idx', type: 'key', attributes: ['receiver_id'], orders: ['ASC'] },
      { key: 'sender_receiver_idx', type: 'key', attributes: ['sender_id', 'receiver_id'], orders: ['ASC', 'ASC'] },
      { key: 'receiver_read_idx', type: 'key', attributes: ['receiver_id', 'read_at'], orders: ['ASC', 'ASC'] },
      { key: 'created_idx', type: 'key', attributes: ['created_at'], orders: ['DESC'] },
    ],
  },
  {
    id: 'user_presence',
    name: 'user_presence',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('user_id', 255, { required: true }),
      datetime('online_at', { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'user_idx', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
      { key: 'online_at_idx', type: 'key', attributes: ['online_at'], orders: ['DESC'] },
    ],
  },
  {
    id: 'saved_searches',
    name: 'saved_searches',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('user_id', 255, { required: true }),
      varchar('name', 255, { required: true }),
      varchar('query', 1024),
      varchar('location', 255),
      integer('min_age'),
      integer('max_age'),
      varchar('language', 255),
      varchar('gender', 64),
      integer('passion_ids', { array: true }),
      datetime('created_at', { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'user_created_idx', type: 'key', attributes: ['user_id', 'created_at'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'notifications',
    name: 'notifications',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('receiver_id', 255, { required: true }),
      varchar('actor_id', 255),
      varchar('type', 255, { required: true }),
      varchar('title', 255, { required: true }),
      varchar('body', 4096),
      varchar('url', 2048),
      boolean('read', { default: false }),
      datetime('created_at', { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'receiver_created_idx', type: 'key', attributes: ['receiver_id', 'created_at'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'reports',
    name: 'reports',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('reporter_id', 255, { required: true }),
      varchar('reported_id', 255, { required: true }),
      varchar('reason', 4096, { required: true }),
      varchar('status', 64, { default: 'pending' }),
      datetime('created_at', { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'created_idx', type: 'key', attributes: ['created_at'], orders: ['DESC'] },
      { key: 'status_created_idx', type: 'key', attributes: ['status', 'created_at'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'verification_requests',
    name: 'verification_requests',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('user_id', 255, { required: true }),
      varchar('status', 64, { default: 'pending' }),
      datetime('created_at', { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'user_created_idx', type: 'key', attributes: ['user_id', 'created_at'], orders: ['ASC', 'DESC'] },
      { key: 'status_created_idx', type: 'key', attributes: ['status', 'created_at'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'push_subscriptions',
    name: 'push_subscriptions',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('user_id', 255, { required: true }),
      varchar('endpoint', 4096, { required: true }),
      varchar('p256dh', 1024),
      varchar('auth', 1024),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'user_idx', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
    ],
  },
  {
    id: 'analytics_events',
    name: 'analytics_events',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('event_name', 255, { required: true }),
      // Appwrite counts varchar storage against the collection byte budget, so keep analytics payloads modest.
      varchar('properties', analyticsPropertiesSize, { required: true }),
      varchar('path', 2048),
      datetime('created_at', { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'created_idx', type: 'key', attributes: ['created_at'], orders: ['DESC'] },
    ],
  },
  {
    id: 'contact_requests',
    name: 'contact_requests',
    attributes: [
      varchar('id', 255, { required: true }),
      varchar('name', 255, { required: true }),
      varchar('email', 320, { required: true }),
      varchar('subject', 255, { required: true }),
      varchar('message', contactMessageSize, { required: true }),
      varchar('category', 255, { required: true }),
      varchar('status', 64, { default: 'pending' }),
      datetime('created_at', { required: true }),
    ],
    indexes: [
      { key: 'id_unique', type: 'unique', attributes: ['id'], orders: ['ASC'] },
      { key: 'created_idx', type: 'key', attributes: ['created_at'], orders: ['DESC'] },
    ],
  },
];

const resolveCollectionsToProcess = () => {
  if (setupOnly) {
    const requestedIds = setupOnly
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const requestedIdSet = new Set(requestedIds);
    const selected = collections.filter((collection) => requestedIdSet.has(collection.id));

    if (selected.length !== requestedIdSet.size) {
      const knownIds = new Set(selected.map((collection) => collection.id));
      const missing = requestedIds.filter((id) => !knownIds.has(id));
      throw new Error(`Unknown collection ids in APPWRITE_SETUP_ONLY: ${missing.join(', ')}`);
    }

    return selected;
  }

  if (setupFrom) {
    const startIndex = collections.findIndex((collection) => collection.id === setupFrom);

    if (startIndex === -1) {
      throw new Error(`Unknown collection id in APPWRITE_SETUP_FROM: ${setupFrom}`);
    }

    return collections.slice(startIndex);
  }

  return collections;
};

const main = async () => {
  ensureClient();
  ensureDatabase();

  const collectionsToProcess = resolveCollectionsToProcess();

  for (const collection of collectionsToProcess) {
    ensureCollection(collection);

    for (const attribute of collection.attributes) {
      ensureAttribute(collection.id, attribute);
    }

    await waitForAttributes(collection.id, collection.attributes.map((attribute) => attribute.key));

    for (const index of collection.indexes) {
      ensureIndex(collection.id, index);
    }
  }

  console.log('Appwrite database schema is ready.');
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
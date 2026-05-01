require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { Client: AppwriteClient, Databases, Query } = require('node-appwrite');

const getEnvValue = (...keys) => {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return '';
};

const toEnvKeySegment = (value) => value.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();

const getCollectionId = (name) =>
  getEnvValue(`APPWRITE_COLLECTION_${toEnvKeySegment(name)}_ID`) || name;

const appwriteEndpoint = getEnvValue('NEXT_PUBLIC_APPWRITE_ENDPOINT');
const appwriteProjectId = getEnvValue('NEXT_PUBLIC_APPWRITE_PROJECT_ID');
const appwriteDatabaseId = getEnvValue('NEXT_PUBLIC_APPWRITE_DATABASE_ID', 'APPWRITE_DATABASE_ID');
const appwriteApiKey = getEnvValue('APPWRITE_API_KEY');
const profilesCollectionId = getCollectionId('profiles');

if (!appwriteEndpoint || !appwriteProjectId || !appwriteDatabaseId || !appwriteApiKey) {
  console.error(
    'Missing one or more required env vars: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, NEXT_PUBLIC_APPWRITE_DATABASE_ID, APPWRITE_API_KEY'
  );
  process.exit(1);
}

const shouldApply = process.argv.includes('--apply');
const shouldClearUnsupported = process.argv.includes('--clear-unsupported');
const pageSize = 100;

const GENDER_LOOKUP = {
  m: 'Male',
  man: 'Male',
  male: 'Male',
  maschile: 'Male',
  maschio: 'Male',
  uomo: 'Male',
  f: 'Female',
  female: 'Female',
  femmina: 'Female',
  femminile: 'Female',
  donna: 'Female',
  woman: 'Female',
};

const appwriteClient = new AppwriteClient()
  .setEndpoint(appwriteEndpoint)
  .setProject(appwriteProjectId)
  .setKey(appwriteApiKey);

const databases = new Databases(appwriteClient);

const normalizeGender = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  return GENDER_LOOKUP[normalizedValue] ?? null;
};

const listAllProfiles = async () => {
  const profiles = [];
  let offset = 0;

  while (true) {
    const result = await databases.listDocuments(appwriteDatabaseId, profilesCollectionId, [
      Query.limit(pageSize),
      Query.offset(offset),
    ]);

    profiles.push(...result.documents);

    if (result.documents.length < pageSize) {
      break;
    }

    offset += result.documents.length;
  }

  return profiles;
};

const incrementCount = (map, key) => {
  map.set(key, (map.get(key) ?? 0) + 1);
};

async function main() {
  console.log(
    shouldApply
      ? 'Applying profile gender normalization...'
      : 'Dry-run: analyzing profile gender normalization...'
  );

  const profiles = await listAllProfiles();
  const unsupportedCounts = new Map();
  const plannedUpdates = [];
  let emptyValues = 0;
  let alreadyCanonical = 0;
  let nullValues = 0;

  for (const profile of profiles) {
    const rawGender = Object.prototype.hasOwnProperty.call(profile, 'gender') ? profile.gender : null;
    const trimmedGender = typeof rawGender === 'string' ? rawGender.trim() : rawGender;
    const normalizedGender = normalizeGender(rawGender);
    const profileId = profile.id || profile.$id;

    if (trimmedGender == null) {
      nullValues += 1;
      continue;
    }

    if (trimmedGender === '') {
      emptyValues += 1;
      plannedUpdates.push({
        documentId: profile.$id,
        profileId,
        from: rawGender,
        to: null,
        reason: 'clear-empty',
      });
      continue;
    }

    if (normalizedGender) {
      if (trimmedGender === normalizedGender) {
        alreadyCanonical += 1;
        continue;
      }

      plannedUpdates.push({
        documentId: profile.$id,
        profileId,
        from: rawGender,
        to: normalizedGender,
        reason: 'canonicalize',
      });
      continue;
    }

    incrementCount(unsupportedCounts, trimmedGender);

    if (shouldClearUnsupported) {
      plannedUpdates.push({
        documentId: profile.$id,
        profileId,
        from: rawGender,
        to: null,
        reason: 'clear-unsupported',
      });
    }
  }

  const canonicalizedCount = plannedUpdates.filter((update) => update.reason === 'canonicalize').length;
  const clearedEmptyCount = plannedUpdates.filter((update) => update.reason === 'clear-empty').length;
  const clearedUnsupportedCount = plannedUpdates.filter((update) => update.reason === 'clear-unsupported').length;

  console.log(`Profiles scanned: ${profiles.length}`);
  console.log(`Already canonical: ${alreadyCanonical}`);
  console.log(`Null values left unchanged: ${nullValues}`);
  console.log(`Empty strings ${shouldApply ? 'to clear' : 'found'}: ${emptyValues}`);
  console.log(`Binary values ${shouldApply ? 'to canonicalize' : 'detected'}: ${canonicalizedCount}`);
  console.log(`Unsupported non-binary values found: ${Array.from(unsupportedCounts.values()).reduce((sum, count) => sum + count, 0)}`);

  if (unsupportedCounts.size > 0) {
    console.log('Unsupported values summary:');
    for (const [value, count] of Array.from(unsupportedCounts.entries()).sort((left, right) => right[1] - left[1])) {
      console.log(`  ${JSON.stringify(value)}: ${count}`);
    }
  }

  if (shouldClearUnsupported) {
    console.log(`Unsupported values ${shouldApply ? 'to clear' : 'scheduled to clear'}: ${clearedUnsupportedCount}`);
  } else if (unsupportedCounts.size > 0) {
    console.log('Unsupported values are only reported. Re-run with --clear-unsupported to clear them to null.');
  }

  if (!shouldApply) {
    console.log('Dry-run complete. Re-run with --apply to persist the planned updates.');
    return;
  }

  if (plannedUpdates.length === 0) {
    console.log('No profile genders required updates.');
    return;
  }

  const updatedAt = new Date().toISOString();

  for (const update of plannedUpdates) {
    await databases.updateDocument(appwriteDatabaseId, profilesCollectionId, update.documentId, {
      gender: update.to,
      updated_at: updatedAt,
    });

    console.log(
      `Updated profile ${update.profileId}: ${JSON.stringify(update.from)} -> ${JSON.stringify(update.to)} (${update.reason})`
    );
  }

  console.log(`Applied ${plannedUpdates.length} gender updates.`);
}

main().catch((error) => {
  console.error('Failed to normalize profile genders:', error?.message || error);
  process.exit(1);
});

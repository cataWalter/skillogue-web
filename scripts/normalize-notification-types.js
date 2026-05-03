require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { Client: AppwriteClient, Databases, Query } = require('node-appwrite');

const getEnvValue = (...keys) => {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return '';
};

const toEnvKeySegment = (value) => value.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
const getCollectionId = (name) =>
  getEnvValue(`APPWRITE_COLLECTION_${toEnvKeySegment(name)}_ID`) || name;

const endpoint = getEnvValue('NEXT_PUBLIC_APPWRITE_ENDPOINT');
const projectId = getEnvValue('NEXT_PUBLIC_APPWRITE_PROJECT_ID');
const databaseId = getEnvValue('NEXT_PUBLIC_APPWRITE_DATABASE_ID', 'APPWRITE_DATABASE_ID');
const apiKey = getEnvValue('APPWRITE_API_KEY');
const collectionId = getCollectionId('notifications');

if (!endpoint || !projectId || !databaseId || !apiKey) {
  console.error(
    'Missing required env vars: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, NEXT_PUBLIC_APPWRITE_DATABASE_ID, APPWRITE_API_KEY'
  );
  process.exit(1);
}

const shouldApply = process.argv.includes('--apply');
const PAGE_SIZE = 100;

const TYPE_MAP = {
  message: 'new_message',
  favorite: 'new_favorite',
  match: 'new_match',
};

const databases = new Databases(
  new AppwriteClient().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
);

const listAll = async () => {
  const docs = [];
  let offset = 0;
  while (true) {
    const page = await databases.listDocuments(databaseId, collectionId, [
      Query.limit(PAGE_SIZE),
      Query.offset(offset),
    ]);
    docs.push(...page.documents);
    if (page.documents.length < PAGE_SIZE) break;
    offset += page.documents.length;
  }
  return docs;
};

(async () => {
  console.log(`Mode: ${shouldApply ? 'APPLY' : 'DRY RUN'} (pass --apply to write changes)\n`);

  const all = await listAll();
  const stale = all.filter((doc) => TYPE_MAP[doc.type]);

  console.log(`Total notifications: ${all.length}`);
  console.log(`Stale type values found: ${stale.length}\n`);

  if (stale.length === 0) {
    console.log('Nothing to update.');
    return;
  }

  for (const doc of stale) {
    const newType = TYPE_MAP[doc.type];
    console.log(`  ${doc.$id}  ${doc.type} → ${newType}  (receiver: ${doc.receiver_id})`);
    if (shouldApply) {
      await databases.updateDocument(databaseId, collectionId, doc.$id, { type: newType });
    }
  }

  if (!shouldApply) {
    console.log('\nDry run complete. Re-run with --apply to commit changes.');
  } else {
    console.log(`\nUpdated ${stale.length} documents.`);
  }
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

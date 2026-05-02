require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { randomUUID } = require('crypto');
const { Client: AppwriteClient, Databases, Query, Users } = require('node-appwrite');
const staticMasterData = require('../src/lib/static-master-data');

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

if (!appwriteEndpoint || !appwriteProjectId || !appwriteDatabaseId || !appwriteApiKey) {
  console.error(
    'Missing one or more required env vars: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, NEXT_PUBLIC_APPWRITE_DATABASE_ID, APPWRITE_API_KEY'
  );
  process.exit(1);
}

const collectionIds = {
  profiles: getCollectionId('profiles'),
  languages: getCollectionId('languages'),
  profilePassions: getCollectionId('profile_passions'),
  profileLanguages: getCollectionId('profile_languages'),
};

const getBirthDateFromAge = (age) => {
  const today = new Date();
  const birthDate = new Date(today.getFullYear() - age, today.getMonth(), today.getDate());
  return birthDate.toISOString();
};

const appwriteClient = new AppwriteClient()
  .setEndpoint(appwriteEndpoint)
  .setProject(appwriteProjectId)
  .setKey(appwriteApiKey);

const users = new Users(appwriteClient);
const databases = new Databases(appwriteClient);

const referenceData = {
  locations: staticMasterData.locations,
  languages: [
    { id: 'lang_english', name: 'English' },
    { id: 'lang_italian', name: 'Italian' },
    { id: 'lang_french', name: 'French' },
    { id: 'lang_german', name: 'German' },
    { id: 'lang_spanish', name: 'Spanish' },
    { id: 'lang_portuguese', name: 'Portuguese' },
  ],
  passions: staticMasterData.passions,
};

const demoUsers = [
  {
    email: 'alice@example.com',
    password: 'Test1234!',
    firstName: 'Alice',
    lastName: 'Johnson',
    age: 28,
    gender: 'Female',
    aboutMe: 'Passionate about art and photography. Love exploring museums and capturing beautiful moments.',
    locationId: 'location-paris-ile-de-france-france',
    languages: ['English', 'French'],
    passions: ['Photography', 'Art', 'Travel'],
  },
  {
    email: 'bob@example.com',
    password: 'Test1234!',
    firstName: 'Bob',
    lastName: 'Smith',
    age: 32,
    gender: 'Male',
    aboutMe: 'Tech enthusiast and avid reader. Always looking for the next great sci-fi novel.',
    locationId: 'location-berlin-berlin-germany',
    languages: ['English', 'German'],
    passions: ['Gaming', 'Books', 'Cinema'],
  },
  {
    email: 'carol@example.com',
    password: 'Test1234!',
    firstName: 'Carol',
    lastName: 'Williams',
    age: 26,
    gender: 'Female',
    aboutMe: 'Yoga instructor and wellness coach. Helping others find their inner peace.',
    locationId: 'location-barcelona-catalonia-spain',
    languages: ['English', 'Spanish'],
    passions: ['Yoga', 'Fitness', 'Travel'],
  },
  {
    email: 'david@example.com',
    password: 'Test1234!',
    firstName: 'David',
    lastName: 'Brown',
    age: 30,
    gender: 'Male',
    aboutMe: 'Chef and food lover. I believe the way to the heart is through the stomach!',
    locationId: 'location-rome-lazio-italy',
    languages: ['English', 'Italian'],
    passions: ['Cooking', 'Travel', 'Cinema'],
  },
  {
    email: 'emma@example.com',
    password: 'Test1234!',
    firstName: 'Emma',
    lastName: 'Davis',
    age: 29,
    gender: 'Female',
    aboutMe: 'Travel blogger and adventurer. Currently exploring Southeast Asia.',
    locationId: 'location-lisbon-lisbon-portugal',
    languages: ['English', 'Portuguese', 'Spanish'],
    passions: ['Travel', 'Photography', 'Hiking'],
  },
  {
    email: 'frank@example.com',
    password: 'Test1234!',
    firstName: 'Frank',
    lastName: 'Miller',
    age: 35,
    gender: 'Male',
    aboutMe: 'Musician and composer. Playing guitar since I was 15.',
    locationId: 'loc_vienna_at',
    languages: ['English', 'German'],
    passions: ['Music', 'Art', 'Cinema'],
  },
  {
    email: 'grace@example.com',
    password: 'Test1234!',
    firstName: 'Grace',
    lastName: 'Wilson',
    age: 27,
    gender: 'Female',
    aboutMe: 'Fitness trainer and nutrition enthusiast. Lets crush those goals together!',
    locationId: 'loc_amsterdam_nl',
    languages: ['English'],
    passions: ['Fitness', 'Cycling', 'Yoga'],
  },
  {
    email: 'henry@example.com',
    password: 'Test1234!',
    firstName: 'Henry',
    lastName: 'Taylor',
    age: 31,
    gender: 'Male',
    aboutMe: 'Software engineer by day, gamer by night. Always up for a good co-op session.',
    locationId: 'location-berlin-berlin-germany',
    languages: ['English', 'German'],
    passions: ['Gaming', 'Music', 'Cycling'],
  },
  {
    email: 'ivy@example.com',
    password: 'Test1234!',
    firstName: 'Ivy',
    lastName: 'Anderson',
    age: 24,
    gender: 'Female',
    aboutMe: 'Artist and illustrator. I see the world in colors and shapes.',
    locationId: 'location-paris-ile-de-france-france',
    languages: ['English', 'French'],
    passions: ['Art', 'Photography', 'Books'],
  },
  {
    email: 'jack@example.com',
    password: 'Test1234!',
    firstName: 'Jack',
    lastName: 'Thomas',
    age: 33,
    gender: 'Male',
    aboutMe: 'Outdoor enthusiast. Hiking, camping, and everything nature.',
    locationId: 'location-milan-lombardy-italy',
    languages: ['English', 'Italian'],
    passions: ['Hiking', 'Travel', 'Cycling'],
  },
];

const validateDocumentId = (documentId, label) => {
  if (typeof documentId !== 'string' || !documentId.length) {
    throw new Error(`${label} must be a non-empty string`);
  }

  if (documentId.length > 36) {
    throw new Error(`${label} exceeds Appwrite's 36 character document-id limit: ${documentId}`);
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(documentId)) {
    throw new Error(`${label} contains unsupported Appwrite document-id characters: ${documentId}`);
  }
};

const validateReferenceIds = () => {
  for (const [collectionName, records] of Object.entries(referenceData)) {
    for (const record of records) {
      validateDocumentId(record.id, `${collectionName} id`);
    }
  }
};

const languageIdsByName = new Map(referenceData.languages.map((language) => [language.name, language.id]));
const passionIdsByName = new Map(referenceData.passions.map((passion) => [passion.name, passion.id]));

const findUserByEmail = async (email) => {
  const result = await users.list({
    queries: [Query.equal('email', email)],
    total: false,
  });

  return result.users[0] || null;
};

const findDocumentByAttributeId = async (collectionId, documentId) => {
  const result = await databases.listDocuments(appwriteDatabaseId, collectionId, [
    Query.equal('id', [documentId]),
    Query.limit(1),
  ]);

  return result.documents[0] || null;
};

const ensureDocument = async (collectionId, documentId, payload) => {
  try {
    await databases.getDocument(appwriteDatabaseId, collectionId, documentId);
    await databases.updateDocument(appwriteDatabaseId, collectionId, documentId, payload);
    return 'updated';
  } catch (error) {
    if (!error || typeof error !== 'object' || error.code !== 404) {
      throw error;
    }
  }

  const existing = await findDocumentByAttributeId(collectionId, documentId);

  if (existing) {
    await databases.updateDocument(appwriteDatabaseId, collectionId, existing.$id, payload);
    return 'updated';
  }

  try {
    await databases.createDocument(appwriteDatabaseId, collectionId, documentId, payload);
    return 'created';
  } catch (error) {
    if (!error || typeof error !== 'object' || error.code !== 409) {
      throw error;
    }

    const conflicted = await findDocumentByAttributeId(collectionId, documentId);
    if (conflicted) {
      await databases.updateDocument(appwriteDatabaseId, collectionId, conflicted.$id, payload);
      return 'updated';
    }

    await databases.updateDocument(appwriteDatabaseId, collectionId, documentId, payload);
    return 'updated';
  }
};

const seedReferenceCollection = async (collectionId, records, label) => {
  let created = 0;
  let updated = 0;

  for (const record of records) {
    const status = await ensureDocument(collectionId, record.id, record);
    if (status === 'created') {
      created += 1;
    } else {
      updated += 1;
    }
  }

  console.log(`${label}: ${created} created, ${updated} updated`);
};

const upsertProfile = async (userId, demoUser) => {
  const timestamp = new Date().toISOString();
  const updatePayload = {
    id: userId,
    first_name: demoUser.firstName,
    last_name: demoUser.lastName,
    about_me: demoUser.aboutMe,
    age: demoUser.age,
    birth_date: demoUser.birthDate || getBirthDateFromAge(demoUser.age),
    gender: demoUser.gender,
    verified: true,
    location_id: demoUser.locationId,
    updated_at: timestamp,
  };

  try {
    await databases.updateDocument(appwriteDatabaseId, collectionIds.profiles, userId, updatePayload);
    return 'updated';
  } catch (error) {
    if (!error || typeof error !== 'object' || error.code !== 404) {
      throw error;
    }

    await databases.createDocument(appwriteDatabaseId, collectionIds.profiles, userId, {
      ...updatePayload,
      created_at: timestamp,
    });
    return 'created';
  }
};

const replaceProfileRelations = async (collectionId, profileId, targetKey, targetIds) => {
  const existing = await databases.listDocuments(appwriteDatabaseId, collectionId, [
    Query.equal('profile_id', [profileId]),
    Query.limit(100),
  ]);

  for (const document of existing.documents) {
    await databases.deleteDocument(appwriteDatabaseId, collectionId, document.$id);
  }

  for (const targetId of targetIds) {
    const relationId = randomUUID();
    await databases.createDocument(appwriteDatabaseId, collectionId, relationId, {
      id: relationId,
      profile_id: profileId,
      [targetKey]: targetId,
    });
  }
};

const ensureDemoUser = async (demoUser) => {
  let appwriteUser = await findUserByEmail(demoUser.email);
  let userStatus = 'reused';

  if (!appwriteUser) {
    appwriteUser = await users.create({
      userId: randomUUID(),
      email: demoUser.email,
      password: demoUser.password,
      name: `${demoUser.firstName} ${demoUser.lastName}`,
    });
    userStatus = 'created';
  }

  const profileStatus = await upsertProfile(appwriteUser.$id, demoUser);
  const languageIds = demoUser.languages.map((name) => languageIdsByName.get(name)).filter(Boolean);
  const passionIds = demoUser.passions.map((name) => passionIdsByName.get(name)).filter(Boolean);

  if (languageIds.length !== demoUser.languages.length) {
    throw new Error(`Missing seeded language for ${demoUser.email}`);
  }

  if (passionIds.length !== demoUser.passions.length) {
    throw new Error(`Missing seeded passion for ${demoUser.email}`);
  }

  await replaceProfileRelations(collectionIds.profileLanguages, appwriteUser.$id, 'language_id', languageIds);
  await replaceProfileRelations(collectionIds.profilePassions, appwriteUser.$id, 'passion_id', passionIds);

  console.log(`${userStatus} user: ${demoUser.email} (${appwriteUser.$id}); profile ${profileStatus}; ${languageIds.length} languages; ${passionIds.length} passions`);

  return appwriteUser.$id;
};

async function seedDemoData() {
  console.log('Seeding Appwrite demo data...');

  validateReferenceIds();

  await seedReferenceCollection(collectionIds.languages, referenceData.languages, 'languages');
  console.log(`locations: using ${referenceData.locations.length} static entries from code`);
  console.log(`passions: using ${referenceData.passions.length} static entries from code`);

  for (const demoUser of demoUsers) {
    await ensureDemoUser(demoUser);
  }

  console.log('\nDemo data is ready.');
  console.log('Example login: alice@example.com / Test1234!');
}

seedDemoData().catch((error) => {
  console.error('Failed to seed demo data:', error?.message || error);
  process.exit(1);
});

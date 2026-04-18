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
  events: getCollectionId('events'),
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

// Returns an ISO datetime string offset by the given days/hours from now
const futureDate = (daysFromNow, hour = 18, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const buildFakeEvents = (userIds) => [
  {
    title: 'Photography Walk in Paris',
    description: 'Join us for a guided photography walk through the streets of Paris. Bring your camera and capture the magic of the city.',
    location_id: 'location-paris-ile-de-france-france',
    starts_at: futureDate(7, 10, 0),
    ends_at: futureDate(7, 13, 0),
    timezone: 'Europe/Paris',
    capacity: 20,
    status: 'published',
    creator_id: userIds[0],
  },
  {
    title: 'Berlin Tech Meetup',
    description: 'Monthly meetup for tech enthusiasts in Berlin. Share projects, discuss trends, and network with fellow developers.',
    location_id: 'location-berlin-berlin-germany',
    starts_at: futureDate(10, 19, 0),
    ends_at: futureDate(10, 22, 0),
    timezone: 'Europe/Berlin',
    capacity: 50,
    status: 'published',
    creator_id: userIds[1],
  },
  {
    title: 'Yoga on the Beach – Barcelona',
    description: 'Start your weekend with an energising yoga session on the beach. All levels welcome. Mats provided.',
    location_id: 'location-barcelona-catalonia-spain',
    starts_at: futureDate(14, 8, 0),
    ends_at: futureDate(14, 9, 30),
    timezone: 'Europe/Madrid',
    capacity: 30,
    status: 'published',
    creator_id: userIds[2],
  },
  {
    title: 'Italian Cooking Class – Rome',
    description: 'Learn to make authentic Roman pasta from scratch. Ingredients and aprons included. Wine pairing to follow.',
    location_id: 'location-rome-lazio-italy',
    starts_at: futureDate(18, 17, 0),
    ends_at: futureDate(18, 20, 0),
    timezone: 'Europe/Rome',
    capacity: 12,
    status: 'published',
    creator_id: userIds[3],
  },
  {
    title: 'Fado Night in Lisbon',
    description: 'An intimate evening of live Fado music in a traditional Alfama venue. Doors open at 20:00.',
    location_id: 'location-lisbon-lisbon-portugal',
    starts_at: futureDate(21, 20, 30),
    ends_at: null,
    timezone: 'Europe/Lisbon',
    capacity: 40,
    status: 'published',
    creator_id: userIds[4],
  },
  {
    title: 'Milan Fashion & Art Tour',
    description: "Explore Milan's fashion district and contemporary art galleries with a local guide.",
    location_id: 'location-milan-lombardy-italy',
    starts_at: futureDate(25, 11, 0),
    ends_at: futureDate(25, 15, 0),
    timezone: 'Europe/Rome',
    capacity: null,
    status: 'published',
    creator_id: userIds[5],
  },
  {
    title: 'Berlin Board Game Night',
    description: 'A relaxed evening of board games, snacks, and great company. Bring your favourite game or choose from our collection.',
    location_id: 'location-berlin-berlin-germany',
    starts_at: futureDate(28, 18, 30),
    ends_at: futureDate(28, 22, 30),
    timezone: 'Europe/Berlin',
    capacity: 24,
    status: 'published',
    creator_id: userIds[6],
  },
  {
    title: 'Paris Language Exchange',
    description: 'Practice French, English, Spanish, or any language you are learning. Friendly and informal atmosphere.',
    location_id: 'location-paris-ile-de-france-france',
    starts_at: futureDate(32, 19, 0),
    ends_at: futureDate(32, 21, 0),
    timezone: 'Europe/Paris',
    capacity: 30,
    status: 'published',
    creator_id: userIds[7],
  },
];

const upsertEvent = async (event) => {
  const timestamp = new Date().toISOString();
  const eventId = randomUUID();

  const existing = await databases.listDocuments(appwriteDatabaseId, collectionIds.events, [
    Query.equal('title', [event.title]),
    Query.equal('creator_id', [event.creator_id]),
    Query.limit(1),
  ]);

  if (existing.documents.length > 0) {
    const doc = existing.documents[0];
    await databases.updateDocument(appwriteDatabaseId, collectionIds.events, doc.$id, {
      title: event.title,
      description: event.description,
      location_id: event.location_id,
      starts_at: event.starts_at,
      ends_at: event.ends_at ?? null,
      timezone: event.timezone,
      capacity: event.capacity,
      status: event.status,
      updated_at: timestamp,
    });
    return 'updated';
  }

  await databases.createDocument(appwriteDatabaseId, collectionIds.events, eventId, {
    id: eventId,
    creator_id: event.creator_id,
    title: event.title,
    description: event.description,
    location_id: event.location_id,
    starts_at: event.starts_at,
    ends_at: event.ends_at ?? null,
    timezone: event.timezone,
    capacity: event.capacity,
    status: event.status,
    created_at: timestamp,
    updated_at: timestamp,
  });
  return 'created';
};

const seedEvents = async (userIds) => {
  const fakeEvents = buildFakeEvents(userIds);
  let created = 0;
  let updated = 0;

  for (const event of fakeEvents) {
    const status = await upsertEvent(event);
    console.log(`  ${status} event: "${event.title}"`);
    if (status === 'created') {
      created += 1;
    } else {
      updated += 1;
    }
  }

  console.log(`events: ${created} created, ${updated} updated`);
};

async function seedDemoData() {
  console.log('Seeding Appwrite demo data...');

  validateReferenceIds();

  await seedReferenceCollection(collectionIds.languages, referenceData.languages, 'languages');
  console.log(`locations: using ${referenceData.locations.length} static entries from code`);
  console.log(`passions: using ${referenceData.passions.length} static entries from code`);

  const userIds = [];
  for (const demoUser of demoUsers) {
    const userId = await ensureDemoUser(demoUser);
    userIds.push(userId);
  }

  await seedEvents(userIds);

  console.log('\nDemo data is ready.');
  console.log('Example login: alice@example.com / Test1234!');
}

seedDemoData().catch((error) => {
  console.error('Failed to seed demo data:', error?.message || error);
  process.exit(1);
});
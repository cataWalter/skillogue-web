require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { randomUUID } = require('crypto');
const { Client: AppwriteClient, Databases, Query, Users } = require('node-appwrite');

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

const appwriteClient = new AppwriteClient()
  .setEndpoint(appwriteEndpoint)
  .setProject(appwriteProjectId)
  .setKey(appwriteApiKey);

const users = new Users(appwriteClient);
const databases = new Databases(appwriteClient);

const testUsers = [
  { email: 'alice@example.com', password: 'Test1234!', firstName: 'Alice', lastName: 'Johnson', age: 28, gender: 'Female', aboutMe: 'Passionate about art and photography. Love exploring museums and capturing beautiful moments.' },
  { email: 'bob@example.com', password: 'Test1234!', firstName: 'Bob', lastName: 'Smith', age: 32, gender: 'Male', aboutMe: 'Tech enthusiast and avid reader. Always looking for the next great sci-fi novel.' },
  { email: 'carol@example.com', password: 'Test1234!', firstName: 'Carol', lastName: 'Williams', age: 26, gender: 'Female', aboutMe: 'Yoga instructor and wellness coach. Helping others find their inner peace.' },
  { email: 'david@example.com', password: 'Test1234!', firstName: 'David', lastName: 'Brown', age: 30, gender: 'Male', aboutMe: 'Chef and food lover. I believe the way to the heart is through the stomach!' },
  { email: 'emma@example.com', password: 'Test1234!', firstName: 'Emma', lastName: 'Davis', age: 29, gender: 'Female', aboutMe: 'Travel blogger and adventurer. Currently exploring Southeast Asia.' },
  { email: 'frank@example.com', password: 'Test1234!', firstName: 'Frank', lastName: 'Miller', age: 35, gender: 'Male', aboutMe: 'Musician and composer. Playing guitar since I was 15.' },
  { email: 'grace@example.com', password: 'Test1234!', firstName: 'Grace', lastName: 'Wilson', age: 27, gender: 'Female', aboutMe: 'Fitness trainer and nutrition enthusiast. Lets crush those goals together!' },
  { email: 'henry@example.com', password: 'Test1234!', firstName: 'Henry', lastName: 'Taylor', age: 31, gender: 'Male', aboutMe: 'Software engineer by day, gamer by night. Always up for a good co-op session.' },
  { email: 'ivy@example.com', password: 'Test1234!', firstName: 'Ivy', lastName: 'Anderson', age: 24, gender: 'Female', aboutMe: 'Artist and illustrator. I see the world in colors and shapes.' },
  { email: 'jack@example.com', password: 'Test1234!', firstName: 'Jack', lastName: 'Thomas', age: 33, gender: 'Male', aboutMe: 'Outdoor enthusiast. Hiking, camping, and everything nature.' },
];

const findUserByEmail = async (email) => {
  const result = await users.list({
    queries: [Query.equal('email', email)],
    total: false,
  });

  return result.users[0] || null;
};

const upsertProfile = async (userId, profile) => {
  const payload = {
    id: userId,
    first_name: profile.firstName,
    last_name: profile.lastName,
    about_me: profile.aboutMe,
    age: profile.age,
    gender: profile.gender,
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await databases.getDocument(appwriteDatabaseId, profilesCollectionId, userId);
    await databases.updateDocument(appwriteDatabaseId, profilesCollectionId, userId, payload);
    return 'updated';
  } catch (error) {
    if (!error || typeof error !== 'object' || error.code !== 404) {
      throw error;
    }

    await databases.createDocument(appwriteDatabaseId, profilesCollectionId, userId, payload);
    return 'created';
  }
};

async function createTestUsers() {
  console.log('Creating Appwrite test users and profiles...');

  for (const user of testUsers) {
    try {
      let appwriteUser = await findUserByEmail(user.email);
      let userStatus = 'reused';

      if (!appwriteUser) {
        appwriteUser = await users.create({
          userId: randomUUID(),
          email: user.email,
          password: user.password,
          name: `${user.firstName} ${user.lastName}`,
        });
        userStatus = 'created';
      }

      const profileStatus = await upsertProfile(appwriteUser.$id, user);
      console.log(`${userStatus} user: ${user.email} (${appwriteUser.$id}); profile ${profileStatus}`);
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error.message || error);
    }
  }

  console.log('\n✅ 10 Test users created successfully!');
  console.log('\n🔑 Login credentials:');
  console.log('📧 Email: alice@example.com');
  console.log('🔒 Password: Test1234!');
  console.log('\nAll users use the same password: Test1234!');
}

createTestUsers().catch(console.error);

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { Client: PgClient } = require('pg');
const { Client: AppwriteClient, Users } = require('node-appwrite');
const { randomUUID } = require('crypto');

const databaseUrl = process.env.DATABASE_URL;
const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const appwriteProjectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const appwriteApiKey = process.env.APPWRITE_API_KEY;

if (!databaseUrl || !appwriteEndpoint || !appwriteProjectId || !appwriteApiKey) {
  console.error('Missing one or more required env vars: DATABASE_URL, NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY');
  process.exit(1);
}

const pg = new PgClient({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 30000
});

const appwriteClient = new AppwriteClient()
  .setEndpoint(appwriteEndpoint)
  .setProject(appwriteProjectId)
  .setKey(appwriteApiKey);
const users = new Users(appwriteClient);

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

async function createTestUsers() {
  console.log('Creating Appwrite test users...');
  await pg.connect();

  for (const user of testUsers) {
    try {
      const createdUser = await users.create({
        userId: randomUUID(),
        email: user.email,
        password: user.password,
        name: `${user.firstName} ${user.lastName}`,
      });

      const insertQuery = `
        INSERT INTO profiles (id, first_name, last_name, about_me, age, gender, verified, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          about_me = EXCLUDED.about_me,
          age = EXCLUDED.age,
          gender = EXCLUDED.gender,
          verified = EXCLUDED.verified
      `;

      await pg.query(insertQuery, [createdUser.$id, user.firstName, user.lastName, user.aboutMe, user.age, user.gender]);
      
      console.log(`Created user: ${user.email} (${createdUser.$id})`);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 409) {
        console.log(`Skipped existing Appwrite user: ${user.email}`);
        continue;
      }

      console.error(`Error creating user ${user.email}:`, error.message || error);
    }
  }

  await pg.end();
  
  console.log('\n✅ 10 Test users created successfully!');
  console.log('\n🔑 Login credentials:');
  console.log('📧 Email: alice@example.com');
  console.log('🔒 Password: Test1234!');
  console.log('\nAll users use the same password: Test1234!');
}

createTestUsers().catch(console.error);
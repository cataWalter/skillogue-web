# Database Setup: Appwrite Cloud

This project uses Appwrite Cloud for both authentication and database.

## What Changed

### Database
- **Provider**: Appwrite Databases

### Authentication
- **Provider**: Appwrite Auth (managed authentication with email verification and recovery)

### ORM
- **Provider**: Handled via `node-appwrite` SDK on the server and `appwrite` SDK on the client.

## Prerequisites

1. **Appwrite Cloud Account**: Create a project on [Appwrite Cloud](https://cloud.appwrite.io)
2. **Environment Variables**: Set up the following in your `.env.local`:
   - `NEXT_PUBLIC_APPWRITE_ENDPOINT`
   - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
   - `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
   - `APPWRITE_API_KEY`
3. **Node.js**: v18+ required


## Setup Instructions

### 1. Create/Prepare PostgreSQL Database

Create a database `skillogue` (or your preferred name) and obtain a connection string. Example using local Postgres:

```bash
createdb skillogue
```

Your `DATABASE_URL` should look like:

```
postgresql://username:password@localhost:5432/skillogue
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: Your Postgres connection string
- `NEXT_PUBLIC_APP_URL`: Your app URL (e.g., `http://localhost:3000`)
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`: Your Appwrite Cloud endpoint
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`: Your Appwrite project ID
- `APPWRITE_API_KEY`: Appwrite server API key with at least `users.write` and `sessions.write`

### 3. Run Database Migrations

```bash
# Apply migrations to create tables
npm run db:migrate

# Verify the migration
npm run db:verify
```

Alternatively, you can use Drizzle Kit:

```bash
# Generate migration files from schema changes
npm run db:generate

# Push schema directly to database
npm run db:push
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

## Database Schema

Auth is provided by Appwrite; application tables use Postgres and Drizzle ORM. Key tables include:

- `profiles` - User profiles (extends auth users)
- `locations`, `passions`, `languages` - Reference tables
- `user_passions`, `profile_languages` - Junction tables
- `messages`, `message_reads`, `notifications`, `favorites` - Application data

## Migrating Legacy Data

If you have existing data in another PostgreSQL provider, export/import using `pg_dump`/`psql`:

```bash
# Export
pg_dump -h <legacy-host> -U <username> -d <db> > backup.sql

# Import
psql -h <new-host> -U <username> -d <db> < backup.sql
```

## Troubleshooting

- Verify your `DATABASE_URL` is correct and reachable
- Ensure SSL configuration is appropriate for your Postgres provider
- For auth issues, verify Appwrite endpoint, project ID, and API key

## Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
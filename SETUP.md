# Database Migration: Supabase → Neon PostgreSQL + Better Auth

This document explains the migration from Supabase to Neon PostgreSQL with Better Auth authentication.

## What Changed

### Database
- **From**: Supabase PostgreSQL (with Supabase-specific auth tables)
- **To**: Neon PostgreSQL (serverless, with excellent CLI support)

### Authentication
- **From**: Supabase Auth (built-in authentication service)
- **To**: Better Auth (modern, database-first authentication library)

### ORM
- **From**: Supabase JS client (direct API calls)
- **To**: Drizzle ORM (type-safe SQL ORM)

## Prerequisites

1. **Neon Account**: Sign up at [neon.tech](https://neon.tech) (free tier available)
2. **Node.js**: v18+ required

## Setup Instructions

### 1. Create Neon Database

```bash
# Install Neon CLI (if not already installed)
npm install -g neonctl

# Login to Neon
neon auth login

# Create a new project
neon projects create --name skillogue

# Create a database
neon databases create --project-id <your-project-id> --name skillogue
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: Your Neon database connection string (from Neon dashboard)
- `DATABASE_DIRECT_URL`: Direct connection string (same as DATABASE_URL for Neon)
- `NEON_API_KEY`: Your Neon API key (from Neon dashboard → Settings → API)
- `BETTER_AUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXT_PUBLIC_APP_URL`: Your app URL (e.g., `http://localhost:3000`)

### 3. Run Database Migrations

```bash
# Apply migrations to create tables
npx drizzle-kit migrate
```

Or manually run the SQL migration:
```bash
neon sql < drizzle/migrations/00001_initial_schema.sql --project-id <your-project-id>
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

## Neon CLI Commands

The Neon CLI provides full database management:

```bash
# View all projects
neon projects list

# View database branches
neon branches list --project-id <project-id>

# Create a new branch (for development/testing)
neon branches create --project-id <project-id> --name feature-branch

# Run SQL on a branch
neon sql "SELECT * FROM users;" --project-id <project-id> --branch main

# Get connection string
neon connection-string --project-id <project-id> --branch main
```

## Database Schema

The new schema includes:

### Auth Tables (Better Auth)
- `user` - User accounts
- `session` - User sessions
- `account` - OAuth accounts (for future social login)
- `verification` - Email verification tokens

### Application Tables
- `profiles` - User profiles (extends auth users)
- `locations` - Geographic locations
- `passions` - User interests/hobbies
- `languages` - Supported languages
- `user_passions` - User's passions (junction)
- `profile_languages` - User's languages (junction)
- `messages` - Private messages
- `message_reads` - Message read receipts
- `notifications` - User notifications
- `favorites` - Saved/favorite profiles
- `blocked_users` - Blocked user relationships
- `reports` - User reports
- `verification_requests` - Profile verification requests
- `push_subscriptions` - Push notification subscriptions
- `analytics_events` - Analytics tracking
- `saved_searches` - Saved search filters
- `contact_requests` - Contact form submissions

## API Routes

Better Auth provides the following endpoints:

- `POST /api/auth/sign-in/email` - Email/password login
- `POST /api/auth/sign-up/email` - Email/password registration
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/verify-email` - Verify email address

## Migration from Supabase

### Data Migration

If you have existing data in Supabase, you can export and import it:

1. Export from Supabase:
```bash
# Using pg_dump
pg_dump -h <supabase-host> -U postgres -d postgres > backup.sql
```

2. Import to Neon:
```bash
# Using psql
psql -h <neon-host> -U <username> -d skillogue < backup.sql
```

### Code Changes

The main code changes:

1. **Auth**: Replace `supabase.auth.*` with Better Auth API calls
2. **Database**: Replace Supabase client queries with Drizzle ORM
3. **Middleware**: Update to use Better Auth session cookies

## Troubleshooting

### Connection Issues
- Verify your `DATABASE_URL` is correct
- Check that your IP is allowed in Neon dashboard (if using IP allowlist)
- Ensure SSL mode is set to `require`

### Auth Issues
- Clear browser cookies and try again
- Verify `BETTER_AUTH_SECRET` is set correctly
- Check that `NEXT_PUBLIC_APP_URL` matches your current URL

### Migration Issues
- Ensure all tables are created: `neon sql "SELECT tablename FROM pg_tables;" --project-id <id>`
- Check for constraint errors in the logs

## Resources

- [Neon Documentation](https://neon.tech/docs)
- [Better Auth Documentation](https://better-auth.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Neon CLI Reference](https://neon.tech/docs/reference/cli-install)
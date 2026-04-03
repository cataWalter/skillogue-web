-- Migration: Initial Schema for Skillogue (Neon PostgreSQL + Better Auth)
-- Generated: 2024-04-04

-- =====================================================
-- AUTH TABLES (Better Auth)
-- =====================================================

CREATE TABLE IF NOT EXISTS "user" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text,
    "email" text NOT NULL UNIQUE,
    "emailVerified" timestamp,
    "image" text,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY,
    "userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "expiresAt" timestamp NOT NULL,
    "token" text NOT NULL UNIQUE,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY,
    "userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "accessTokenExpiresAt" timestamp,
    "refreshTokenExpiresAt" timestamp,
    "scope" text,
    "idToken" text,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamp NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- =====================================================
-- APPLICATION TABLES
-- =====================================================

-- Locations table
CREATE TABLE IF NOT EXISTS "locations" (
    "id" serial PRIMARY KEY,
    "city" text,
    "region" text,
    "country" text,
    "created_at" timestamptz DEFAULT now()
);

-- Profiles table (extends auth users)
CREATE TABLE IF NOT EXISTS "profiles" (
    "id" uuid PRIMARY KEY REFERENCES "user"("id") ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT now(),
    "first_name" text,
    "last_name" text,
    "about_me" text,
    "age" integer,
    "gender" text,
    "verified" boolean DEFAULT false,
    "is_private" boolean DEFAULT false,
    "show_age" boolean DEFAULT true,
    "show_location" boolean DEFAULT true,
    "location_id" integer REFERENCES "locations"("id"),
    "avatar_url" text
);

-- Passions table
CREATE TABLE IF NOT EXISTS "passions" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL UNIQUE,
    "created_at" timestamptz DEFAULT now()
);

-- Languages table
CREATE TABLE IF NOT EXISTS "languages" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL UNIQUE,
    "created_at" timestamptz DEFAULT now()
);

-- User Passions (junction table)
CREATE TABLE IF NOT EXISTS "user_passions" (
    "id" serial PRIMARY KEY,
    "user_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    "passion_id" integer REFERENCES "passions"("id") ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT now(),
    UNIQUE("user_id", "passion_id")
);

-- Profile Languages (junction table)
CREATE TABLE IF NOT EXISTS "profile_languages" (
    "id" serial PRIMARY KEY,
    "profile_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    "language_id" integer REFERENCES "languages"("id") ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT now(),
    UNIQUE("profile_id", "language_id")
);

-- Messages table
CREATE TABLE IF NOT EXISTS "messages" (
    "id" serial PRIMARY KEY,
    "created_at" timestamptz DEFAULT now(),
    "sender_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    "receiver_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    "content" text NOT NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" serial PRIMARY KEY,
    "created_at" timestamptz DEFAULT now(),
    "user_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    "actor_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    "type" text NOT NULL,
    "read" boolean DEFAULT false
);

-- Favorites table
CREATE TABLE IF NOT EXISTS "favorites" (
    "id" serial PRIMARY KEY,
    "created_at" timestamptz DEFAULT now(),
    "user_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    "favorite_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    UNIQUE("user_id", "favorite_id")
);

-- Saved Searches table
CREATE TABLE IF NOT EXISTS "saved_searches" (
    "id" serial PRIMARY KEY,
    "created_at" timestamptz DEFAULT now(),
    "user_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "query" text,
    "location" text,
    "min_age" integer,
    "max_age" integer,
    "language" text,
    "gender" text,
    "passion_ids" text
);

-- Reports table
CREATE TABLE IF NOT EXISTS "reports" (
    "id" serial PRIMARY KEY,
    "created_at" timestamptz DEFAULT now(),
    "reporter_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    "reported_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    "reason" text NOT NULL,
    "status" text DEFAULT 'pending'
);

-- Verification Requests table
CREATE TABLE IF NOT EXISTS "verification_requests" (
    "id" serial PRIMARY KEY,
    "created_at" timestamptz DEFAULT now(),
    "user_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    "status" text DEFAULT 'pending'
);

-- Blocked Users table
CREATE TABLE IF NOT EXISTS "blocked_users" (
    "id" serial PRIMARY KEY,
    "created_at" timestamptz DEFAULT now(),
    "blocker_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    "blocked_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    UNIQUE("blocker_id", "blocked_id")
);

-- Push Subscriptions table
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id" serial PRIMARY KEY,
    "created_at" timestamptz DEFAULT now(),
    "user_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    "endpoint" text NOT NULL,
    "p256dh" text,
    "auth" text,
    UNIQUE("user_id", "endpoint")
);

-- Analytics Events table
CREATE TABLE IF NOT EXISTS "analytics_events" (
    "id" serial PRIMARY KEY,
    "created_at" timestamptz DEFAULT now(),
    "user_id" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
    "event_name" text NOT NULL,
    "properties" jsonb DEFAULT '{}',
    "path" text
);

-- Message Reads table (for read receipts)
CREATE TABLE IF NOT EXISTS "message_reads" (
    "id" serial PRIMARY KEY,
    "created_at" timestamptz DEFAULT now(),
    "user_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
    "message_id" integer REFERENCES "messages"("id") ON DELETE CASCADE,
    UNIQUE("user_id", "message_id")
);

-- Contact Requests table
CREATE TABLE IF NOT EXISTS "contact_requests" (
    "id" serial PRIMARY KEY,
    "created_at" timestamptz DEFAULT now(),
    "user_id" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "subject" text,
    "message" text NOT NULL,
    "status" text DEFAULT 'pending'
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS "idx_messages_sender_receiver" ON "messages"("sender_id", "receiver_id");
CREATE INDEX IF NOT EXISTS "idx_messages_created_at" ON "messages"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_notifications_user_read" ON "notifications"("user_id", "read");
CREATE INDEX IF NOT EXISTS "idx_user_passions_user" ON "user_passions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_blocked_users_blocker" ON "blocked_users"("blocker_id");
CREATE INDEX IF NOT EXISTS "idx_favorites_user" ON "favorites"("user_id");
CREATE INDEX IF NOT EXISTS "idx_profiles_location" ON "profiles"("location_id");
CREATE INDEX IF NOT EXISTS "idx_profiles_age_gender" ON "profiles"("age", "gender");
CREATE INDEX IF NOT EXISTS "idx_profiles_verified" ON "profiles"("verified") WHERE "verified" = true;
CREATE INDEX IF NOT EXISTS "idx_reports_status" ON "reports"("status");
CREATE INDEX IF NOT EXISTS "idx_verification_status" ON "verification_requests"("status");
CREATE INDEX IF NOT EXISTS "idx_contact_status" ON "contact_requests"("status");

-- =====================================================
-- SEED DATA
-- =====================================================

INSERT INTO "locations" ("city", "region", "country") VALUES
    ('London', 'England', 'UK'),
    ('Paris', 'Île-de-France', 'France'),
    ('Berlin', 'Berlin', 'Germany'),
    ('New York', 'New York', 'USA'),
    ('Los Angeles', 'California', 'USA'),
    ('Tokyo', 'Tokyo', 'Japan'),
    ('Sydney', 'New South Wales', 'Australia'),
    ('Toronto', 'Ontario', 'Canada'),
    ('Miami', 'Florida', 'USA'),
    ('Seattle', 'Washington', 'USA'),
    ('Chicago', 'Illinois', 'USA'),
    ('Boston', 'Massachusetts', 'USA'),
    ('Austin', 'Texas', 'USA'),
    ('Denver', 'Colorado', 'USA'),
    ('San Francisco', 'California', 'USA'),
    ('Manchester', 'England', 'UK'),
    ('Edinburgh', 'Scotland', 'UK'),
    ('Birmingham', 'England', 'UK'),
    ('Munich', 'Bavaria', 'Germany'),
    ('Hamburg', 'Hamburg', 'Germany'),
    ('Madrid', 'Madrid', 'Spain'),
    ('Valencia', 'Valencia', 'Spain'),
    ('Milan', 'Lombardy', 'Italy'),
    ('Naples', 'Campania', 'Italy'),
    ('Melbourne', 'Victoria', 'Australia'),
    ('Brisbane', 'Queensland', 'Australia'),
    ('Vancouver', 'British Columbia', 'Canada'),
    ('Montreal', 'Quebec', 'Canada'),
    ('Calgary', 'Alberta', 'Canada'),
    ('Dubai', 'Dubai', 'UAE'),
    ('Abu Dhabi', 'Abu Dhabi', 'UAE'),
    ('Doha', 'Doha', 'Qatar')
ON CONFLICT DO NOTHING;

INSERT INTO "passions" ("name") VALUES
    ('Reading'),
    ('Traveling'),
    ('Cooking'),
    ('Photography'),
    ('Music'),
    ('Dancing'),
    ('Painting'),
    ('Writing'),
    ('Gaming'),
    ('Fitness'),
    ('Yoga'),
    ('Hiking'),
    ('Swimming'),
    ('Cycling'),
    ('Movies'),
    ('Theater'),
    ('Art'),
    ('Fashion'),
    ('Technology'),
    ('Science'),
    ('History'),
    ('Philosophy'),
    ('Gardening'),
    ('DIY'),
    ('Wine Tasting')
ON CONFLICT DO NOTHING;

INSERT INTO "languages" ("name") VALUES
    ('English'),
    ('Spanish'),
    ('French'),
    ('German'),
    ('Italian'),
    ('Portuguese'),
    ('Dutch'),
    ('Russian'),
    ('Chinese'),
    ('Japanese'),
    ('Korean'),
    ('Arabic'),
    ('Hindi'),
    ('Turkish'),
    ('Polish'),
    ('Swedish'),
    ('Norwegian'),
    ('Danish'),
    ('Finnish'),
    ('Greek')
ON CONFLICT DO NOTHING;
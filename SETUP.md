# Appwrite Setup

This project now uses Appwrite for the backend services it depends on in runtime: authentication, database documents, and optional function execution.

## What Changed

### Database
- **Provider**: Appwrite Databases

### Authentication
- **Provider**: Appwrite Auth (managed authentication with email verification and recovery)

### ORM
- **Access Layer**: Handled via `node-appwrite` on the server and `appwrite` in the browser compatibility client.

## Prerequisites

1. **Appwrite Cloud Account**: Create a project on [Appwrite Cloud](https://cloud.appwrite.io)
2. **Environment Variables**: Set up the following in your `.env.local`:
   - `NEXT_PUBLIC_APPWRITE_ENDPOINT`
   - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
   - `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
   - `APPWRITE_API_KEY`
   - Optional `APPWRITE_COLLECTION_*_ID` / `APPWRITE_FUNCTION_*_ID` overrides if your Appwrite resource IDs do not match the logical names used in code
3. **Node.js**: v18+ required


## Setup Instructions

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `NEXT_PUBLIC_APP_URL`: Your app URL (e.g., `http://localhost:3000`)
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`: Your Appwrite Cloud endpoint
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`: Your Appwrite project ID
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`: Your Appwrite database ID
- `APPWRITE_API_KEY`: Appwrite server API key with at least `users.write`, `sessions.write`, `databases.read`, and `databases.write`

Optional environment variables:
- `APPWRITE_COLLECTION_*_ID`: Explicit collection ID mapping when the collection ID is not the same as the logical name in code
- `APPWRITE_FUNCTION_*_ID`: Explicit function ID mapping when a function ID differs from its logical name
- Push notifications:
   - `VAPID_PUBLIC_KEY`: Required on the Next.js app server so the client can fetch the public key from `/api/push-subscription`
   - `VAPID_PRIVATE_KEY`: Required by the `functions/send-push` Appwrite function to send notifications
   - `VAPID_SUBJECT`: Required by the `functions/send-push` Appwrite function, usually `mailto:you@example.com`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` or `NEXT_PUBLIC_VAPID_KEY`: Optional client-side override if you want to inline the public key at build time instead of serving `VAPID_PUBLIC_KEY` from the app server

### 2. Create Appwrite Resources

Create the collections your app needs inside the configured Appwrite database. By default the app resolves collections by logical name, so the simplest path is to create IDs that match the code, for example:

- `profiles`
- `locations`
- `passions`
- `languages`
- `profile_passions`
- `profile_languages`
- `favorites`
- `messages`
- `notifications`
- `blocked_users`
- `verification_requests`
- `reports`
- `events`
- `event_rsvps`
- `push_subscriptions`
- `analytics_events`
- `contact_requests`

If your Appwrite IDs differ, set the matching `APPWRITE_COLLECTION_*_ID` overrides in your environment.

The recommended bootstrap path is to let the repo provision the database schema for you:

```bash
npm run appwrite:setup-db
```

That script creates the collections above, including the event search and calendar indexes for `events` and the unique RSVP index on `event_rsvps`.

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Validate Configuration

Run a production build to validate the runtime wiring:

```bash
npm run build
```

If you have Appwrite CLI access, you can also verify connectivity with:

```bash
npx appwrite-cli --version
```

## Troubleshooting

- Verify `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `NEXT_PUBLIC_APPWRITE_DATABASE_ID`, and `APPWRITE_API_KEY`
- If requests fail for specific collections, confirm the Appwrite collection IDs match the logical names or set `APPWRITE_COLLECTION_*_ID` overrides
- If function invocations fail, confirm the function exists and set the matching `APPWRITE_FUNCTION_*_ID` override when needed
- If the Settings page cannot enable push notifications, make sure the Next.js app has `VAPID_PUBLIC_KEY` available and the Appwrite `send-push` function has `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`

## Resources

- [Appwrite Documentation](https://appwrite.io/docs)
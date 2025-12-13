# Launch Readiness Checklist

## 1. Legal & Compliance (Priority: High)
- [x] **Cookie Consent Banner**: Implement a banner to collect user consent for cookies (GDPR).
  - *Note*: Implemented in `src/components/CookieBanner.tsx` and added to `RootLayout`.
- [x] **Terms & Privacy Checkbox**: Verify the "I agree" checkbox in `SignUp` works as expected and blocks registration if unchecked.
- [x] **Data Export**: Verify the "Download my data" feature in Settings generates a valid JSON/CSV file.
- [x] **Account Deletion**: Verify the "Delete Account" flow works and cascades deletes (removes profile, messages, etc.) or soft-deletes correctly.
  - *Note*: Created `delete_user_account` RPC in migration `20251212150000_launch_readiness.sql`.
- [ ] **Supabase Region**: Ensure the Supabase project is hosted in a region compliant with your target audience (e.g., EU for GDPR).

## 2. Features & Functionality
- [x] **Profile Verification**:
  - The UI supports a `verified` badge.
  - *Task*: Define and implement the backend logic/process to set `verified = true` (e.g., email confirmation hook or manual admin tool).
  - *Note*: Implemented `verification_requests` table and Admin Verification page.
- [x] **Reporting System**:
  - `ReportModal` inserts into `reports` table.
  - *Task*: Ensure there is a way to view these reports (Admin Dashboard or direct DB access for now).
  - *Note*: Implemented Admin Reports page.
- [x] **Messaging**:
  - Test real-time message delivery.
  - Test "Unread" counts.
  - *Note*: Implemented real-time updates and unread counts in `src/app/messages/page.tsx` and `Navbar`.
- [x] **Search & Filtering**:
  - Test all filter combinations (Age, Location, Passions).
  - Ensure pagination or infinite scroll works if implemented.
  - *Note*: Implemented `search_profiles` RPC for efficient filtering and pagination.
- [x] **User Blocking** (Safety):
  - Add "Block User" button in Chat and Profile.
  - Filter blocked users from Search and Messages.
- [x] **Saved Profiles / Favorites**:
  - Add "Heart" or "Bookmark" button to profiles.
  - Create a "Favorites" page.

## 3. UI/UX Polish
- [x] **Empty States**: Check how pages look with no data (e.g., no messages, no search results).
  - *Note*: Improved empty states in Search and Messages.
- [x] **Loading States**: Ensure `Skeleton` components are used effectively during data fetching.
  - *Note*: Added `SearchSkeleton` and improved loading states.
- [x] **Mobile Responsiveness**: Test critical flows (SignUp, Chat, Search) on mobile view.
- [x] **404 Page**: Customize `not-found.tsx` for a better user experience.
  - *Note*: Redesigned `not-found.tsx`.

## 4. Technical & Performance
- [x] **Build Check**: Run `npm run build` to ensure no type errors or build failures.
  - *Note*: Fixed linting errors and verified build success.
- [x] **Environment Variables**:
  - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel.
  - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set if used (e.g., for admin actions).
- [x] **SEO**:
  - Update `metadata` in `layout.tsx` and individual pages with correct titles and descriptions.
  - Check `robots.txt`.
  - *Note*: Updated global metadata and `robots.txt`.

## 5. Post-Launch
- [x] **Email Notifications**: Notify users of unread messages via email (e.g., Resend/SendGrid).
- [x] **Real-time Presence**: Show "Online" status and "Typing..." indicators in chat.
- [x] **Rich Media in Chat**: Allow image and file sharing in messages.
- [ ] **Push Notifications**: Browser or PWA push notifications for messages.
- [ ] **Monitoring**: Set up error tracking (e.g., Sentry) or monitor Vercel logs.
- [ ] **Analytics**: (Optional) Add privacy-friendly analytics if needed.


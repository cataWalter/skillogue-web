## 5. Pre-Production & Deployment (Missing Items)
- [x] **Mobile Optimization**:
  - Improve mobile view for all pages (Landing, Dashboard, Messages, Profile, Search, Settings, Auth).
- [ ] **Database Synchronization**:
  - Apply `supabase/production_setup.sql` to production (Contains Blocking, Favorites, and Contact Us).
  - Apply `supabase/enhancements.sql` to production (Contains Push Notifications and Analytics).
- [ ] **Edge Functions**:
  - Deploy `send-message-broadcast` function: `supabase functions deploy send-message-broadcast`.
  - Deploy `send-push` function: `supabase functions deploy send-push`.
  - Set environment secrets for the function (e.g., SMTP keys if using a mailer).
  - Set VAPID secrets: `supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=...`
- [x] **Security Audit**:
  - Review RLS policies for `blocked_users`, `saved_profiles`, and `messages` tables. (Verified and fixed `saved_profiles` to exclude blocked users)
  - Ensure no sensitive data is exposed in public views.
- [x] **SEO & Metadata**:
  - Update `src/app/layout.tsx` with production `metadata` (Title, Description, OpenGraph images).
  - Verify `robots.txt` and `sitemap.xml` (Created `sitemap.ts`).
- [ ] **Domain & SSL**:
  - Configure custom domain in Vercel/Netlify.
  - Verify SSL certificate provisioning.

## 6. Future Enhancements (Post-Launch)
- [x] **Push Notifications**: Browser or PWA push notifications for messages. (Implemented: `push_subscriptions` table, `send-push` edge function, Service Worker, and Settings UI).
- [x] **Advanced Analytics**: User behavior tracking. (Implemented: `analytics_events` table, `useAnalytics` hook, and automatic page view tracking).



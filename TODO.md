## Todo

* Develop the Settings page:
* Create a unified Account or Settings area:
* Refine the Edit Profile page
* Adjust Navigation:



* improve dashboard
* improve modal
* add blocked logic
* add report logic
* privacy analysis
* law requirements analysis
* tests
* enable notifications for messages
* show messages number and a popup when you are in another window
* documentation
* common layout
* implement real-time messaging with WebSockets or optimize polling
* Loading States & Skeleton Screens: Replace simple "Loading..." text with skeleton loaders, especially on Search.tsx,
  Messages.tsx, and Profile.tsx. This provides a much smoother experience while data is being fetched.
* Error Boundaries: Implement React Error Boundaries to gracefully handle JavaScript errors in the UI, preventing the
  entire app from crashing. Wrap major sections of your app (e.g., the Dashboard or Messages page) in an error boundary
  component.
* Form Feedback: On Login.tsx and ResetPassword.js, provide clearer inline validation feedback (e.g., password strength
  meters, real-time email validation).
* Accessibility (a11y): Add aria-label attributes to icons (like the X for disconnecting or the Send button in chat) and
  ensure all interactive elements are keyboard-navigable. Use semantic HTML where possible.
* Code Splitting: Implement route-based code splitting using React.lazy and Suspense in your App.js. This will
  significantly reduce the initial bundle size by only loading the code for the current page.
* Memoization: Use React.memo for components that render frequently with the same props (e.g., the Connection item in
  Connections.js or individual Message components) and useMemo/useCallback for expensive calculations or function
  references in parent components to prevent unnecessary re-renders.
* Centralize API Calls: Move all Supabase logic (like loadConnections, loadProfile, sendMessage) out of the page
  components and into a dedicated service layer (e.g., src/services/api.js). This promotes reusability and makes testing
  easier.
* Custom Hooks: Extract reusable logic into custom hooks. For example:
  useAuth.js: For managing user session and authentication state.
  useSupabaseQuery.js: A generic hook for fetching data from Supabase with loading/error states.
  useConversations.js: For handling the chat polling and message fetching logic.
* Type Safety: Since you're using React 19, strongly consider adopting TypeScript. This will catch bugs at compile time,
  provide better autocompletion, and make the codebase much easier to navigate and maintain as it grows.
* Backend Validation: While you use Zod on the frontend, never trust the client. Implement strict Zod validation on the
  Supabase backend (using PostgREST policies or a middleware) for all INSERT and UPDATE operations on tables like
  profiles, messages, and connections.
* Rate Limiting: Implement rate limiting on your Supabase functions or at the network level to prevent abuse (e.g.,
  spamming messages or login attempts).
* Real-time Updates: Replace the polling mechanism in Messages.tsx with Supabase's real-time subscriptions (
  supabase.channel().on().subscribe()). This is more efficient and provides an instant chat experience.
* Advanced Search: Fulfill the "improve search" TODO by adding filters (e.g., by passion, location, skill level) and
  potentially full-text search capabilities using Supabase's PostgreSQL full-text search.
* Complete the "reuse components" TODO: Create a Button.js component for all buttons to ensure consistent styling and
  behavior. Create a Card.js component for profile and connection cards.
* Standardize Styling: Ensure consistent spacing, typography, and color usage across all pages by leveraging Tailwind
  CSS classes systematically. Consider creating a tailwind.config.js theme for your primary colors.

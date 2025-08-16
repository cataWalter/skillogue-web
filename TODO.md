## Todo

High priority

* Chat

Medium priority

* Blocked Users Management
* add report logic
* Privacy & Visibility Settings
* Backend Validation: While you use Zod on the frontend, never trust the client. Implement strict Zod validation on the  Supabase backend (using PostgREST policies or a middleware) for all INSERT and UPDATE operations on tables like   profiles, messages, and connections.
* Create common components
*  Generate the avatar URL on the server (e.g., in a Supabase function) and store it in the profiles table. This reduces client-side processing and ensures consistency.
*  Add Meta Tags for SEO and Social Sharing: Why it's missing: The application is a single-page app (SPA). The provided code snippets do not show any <meta> tags for page titles, descriptions, or Open Graph tags (for sharing on social media) Todo: Use react-helmet or a similar library to dynamically set meta tags for different pages (e.g., the user's profile page should have a title like "John Doe | Skillogue").

Low priority

* privacy analysis
* law requirements analysis
* Loading States & Skeleton Screens: Replace simple "Loading..." text with skeleton loaders, especially on Search.tsx,
  Messages.tsx, and Profile.tsx. This provides a much smoother experience while data is being fetched.
* improve modal
* Accessibility (a11y): Add aria-label attributes to icons (like the X for disconnecting or the Send button in chat) and ensure all interactive elements are keyboard-navigable. Use semantic HTML where possible.
* Code Splitting: Implement route-based code splitting using React.lazy and Suspense in your App.js. This will   significantly reduce the initial bundle size by only loading the code for the current page.
* Memoization: Use React.memo for components that render frequently with the same props (e.g., the Connection item in   Connections.js or individual Message components) and useMemo/useCallback for expensive calculations or function   references in parent components to prevent unnecessary re-renders.

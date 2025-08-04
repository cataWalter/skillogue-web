# Skillogue: Connect Through Passions

Skillogue is a unique social platform designed to connect people based on their shared passions and interests, not their
profile pictures. In a world of visual noise, we focus on genuine connection. Our mission is to bridge the gap between
online communities and real-world interactions, creating a space where shared hobbies can flourish into meaningful
relationships.

## Core Features

Skillogue is built with a rich set of features focused on fostering community, safety, and authentic connections.

### Profile & Discovery

* **Core Details**: Build your profile with your first and last name, languages spoken, city, age, and gender.
* **Passion List**: Select from a wide range of passions and interests that define you.
* **Randomized Profile Pictures**: To encourage users to connect on a deeper level, profile pictures are randomly
  generated and cannot be uploaded by the user. This ensures that first impressions are based on personality and shared
  interests.
* **"About Me" Bio**: A dedicated free-text space for your personality to shine. Share your tone, your story, and how
  you engage with your interests.

### Connection & Communication

* **Advanced Filtering**: This is the core of the project. Easily search for and find other users by filtering based on
  any profile factor: passions, location, age, language, and more.
* **Private Messaging**: Once you discover a like-minded individual, you can start a conversation through our secure,
  easy-to-use, one-to-one chat feature, powered by a real-time backend.

### Safety & Trust

* **Reporting & Moderation**: Users are equipped with clear tools to report inappropriate behavior. We maintain an
  active moderation team to handle reports swiftly and ensure the platform remains a positive space.
* **Profile Verification**: To build trust in a community without visual identifiers, users can verify their profiles
  via email or phone number. A special "Verified" badge will appear on their profile, dramatically increasing perceived
  safety and user reliability.

## Technology Stack

This project is built on a modern, full-stack JavaScript blueprint centered around React for the frontend and Supabase
as the all-in-one backend.

| Category                 | Technology                                     | Role & Justification                                                                                                                            |
|--------------------------|------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| **Core Framework**       | **React**                                      | The foundation for our Frontend (UI). It's the industry standard for building modern, high-performance React applications.                      |
| **Backend & Database**   | **Supabase**                                   | Our all-in-one backend, providing the PostgreSQL Database, Authentication, and Real-time APIs for both development and production.              |
| **Styling & UI**         | **Tailwind CSS** & **shadcn/ui**               | **Tailwind** allows for rapid, utility-first styling. **shadcn/ui** provides a library of beautifully designed, accessible components.          |
| **Real-time Chat**       | **Supabase Realtime**                          | Powers our one-on-one private messaging. It's built into Supabase, allowing us to subscribe to database changes for a simple, integrated setup. |
| **Authentication**       | **Supabase Auth**                              | Handles all user sign-up, login, and session management. It's a complete, secure system that's part of the Supabase platform.                   |
| **Forms & Validation**   | **React Hook Form** & **Zod**                  | **React Hook Form** manages form state efficiently. **Zod** provides strict, type-safe validation for both frontend forms and backend data.     |
| **Deployment & Hosting** | **Vercel** (Frontend) & **Supabase** (Backend) | **Vercel** offers the best deployment experience for React. **Supabase** hosts our database and backend services, creating a clean separation.  |

## Todo

* registration onboarding
* reuse components
* remove connections
* remove follow
* improve search
* allow to save past searches
* improve settings
* enable notifications for messages
* improve dashboard
* improve modal
* add blocked logic
* add report logic
* privacy analysis
* law requirements analysis
* tests
* documentation
* common layout
* implement real-time messaging with WebSockets or optimize polling
* Loading States & Skeleton Screens: Replace simple "Loading..." text with skeleton loaders, especially on Search.js,
  Messages.js, and Profile.js. This provides a much smoother experience while data is being fetched.
* Error Boundaries: Implement React Error Boundaries to gracefully handle JavaScript errors in the UI, preventing the
  entire app from crashing. Wrap major sections of your app (e.g., the Dashboard or Messages page) in an error boundary
  component.
* Form Feedback: On Login.js and ResetPassword.js, provide clearer inline validation feedback (e.g., password strength
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
* Real-time Updates: Replace the polling mechanism in Messages.js with Supabase's real-time subscriptions (
  supabase.channel().on().subscribe()). This is more efficient and provides an instant chat experience.
* Advanced Search: Fulfill the "improve search" TODO by adding filters (e.g., by passion, location, skill level) and
  potentially full-text search capabilities using Supabase's PostgreSQL full-text search.
* Complete the "reuse components" TODO: Create a Button.js component for all buttons to ensure consistent styling and
  behavior. Create a Card.js component for profile and connection cards.
* Standardize Styling: Ensure consistent spacing, typography, and color usage across all pages by leveraging Tailwind
  CSS classes systematically. Consider creating a tailwind.config.js theme for your primary colors.











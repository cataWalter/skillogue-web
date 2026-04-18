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

This project is built on a modern, full-stack JavaScript stack centered around React for the frontend and Appwrite for auth, data, and backend workflows.

| Category              | Technology                        | Role & Justification                                                                                 |
|-----------------------|-----------------------------------|------------------------------------------------------------------------------------------------------|
| **Core Framework**    | **React + Next.js**               | Powers the UI, routing, server components, and API routes.                                           |
| **Backend Platform**  | **Appwrite**                      | Handles authentication, database documents, functions, and server-side integrations.                 |
| **Styling & UI**      | **Tailwind CSS**                  | Supports fast, consistent styling across the app.                                                    |
| **Forms & Validation**| **React Hook Form + Zod**         | Manages form state and validates payloads on the client and server.                                  |
| **Messaging Updates** | **Appwrite Realtime + API Routes**| Keeps conversation lists and active chats refreshed through the compatibility client and API layer.  |
| **Deployment**        | **Vercel + Appwrite**             | Vercel serves the app and Appwrite provides the required backend services.                           |

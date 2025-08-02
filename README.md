# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)


# Skillogue: Connect Through Passions

Skillogue is a unique social platform designed to connect people based on their shared passions and interests, not their profile pictures. In a world of visual noise, we focus on genuine connection. Our mission is to bridge the gap between online communities and real-world interactions, creating a space where shared hobbies can flourish into meaningful relationships.

## Core Features

Skillogue is built with a rich set of features focused on fostering community, safety, and authentic connections.

### Profile & Discovery

* **Core Details**: Build your profile with your first and last name, languages spoken, city, age, and gender.
* **Passion List**: Select from a wide range of passions and interests that define you.
* **Randomized Profile Pictures**: To encourage users to connect on a deeper level, profile pictures are randomly generated and cannot be uploaded by the user. This ensures that first impressions are based on personality and shared interests.
* **"About Me" Bio**: A dedicated free-text space for your personality to shine. Share your tone, your story, and how you engage with your interests.

### Connection & Communication

* **Advanced Filtering**: This is the core of the project. Easily search for and find other users by filtering based on any profile factor: passions, location, age, language, and more.
* **Private Messaging**: Once you discover a like-minded individual, you can start a conversation through our secure, easy-to-use, one-to-one chat feature, powered by a real-time backend.

### Safety & Trust

* **Reporting & Moderation**: Users are equipped with clear tools to report inappropriate behavior. We maintain an active moderation team to handle reports swiftly and ensure the platform remains a positive space.
* **Profile Verification**: To build trust in a community without visual identifiers, users can verify their profiles via email or phone number. A special "Verified" badge will appear on their profile, dramatically increasing perceived safety and user reliability.

## Technology Stack

This project is built on a modern, full-stack JavaScript blueprint centered around React for the frontend and Supabase as the all-in-one backend.

| Category                 | Technology                                     | Role & Justification                                                                                                                             |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Core Framework**       | **React**                                    | The foundation for our Frontend (UI). It's the industry standard for building modern, high-performance React applications.                       |
| **Backend & Database**   | **Supabase**                                   | Our all-in-one backend, providing the PostgreSQL Database, Authentication, and Real-time APIs for both development and production.               |
| **Styling & UI**         | **Tailwind CSS** & **shadcn/ui**               | **Tailwind** allows for rapid, utility-first styling. **shadcn/ui** provides a library of beautifully designed, accessible components.           |
| **Real-time Chat**       | **Supabase Realtime**                          | Powers our one-on-one private messaging. It's built into Supabase, allowing us to subscribe to database changes for a simple, integrated setup.  |
| **Authentication**       | **Supabase Auth**                              | Handles all user sign-up, login, and session management. It's a complete, secure system that's part of the Supabase platform.                    |
| **Forms & Validation**   | **React Hook Form** & **Zod**                  | **React Hook Form** manages form state efficiently. **Zod** provides strict, type-safe validation for both frontend forms and backend data.      |
| **Deployment & Hosting** | **Vercel** (Frontend) & **Supabase** (Backend) | **Vercel** offers the best deployment experience for React. **Supabase** hosts our database and backend services, creating a clean separation. |

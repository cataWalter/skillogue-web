# Manual Test Plan for Skillogue Web

This document outlines the manual tests to be performed to ensure the application is functioning correctly after the upgrade to Next.js 16.

## 1. Authentication & Authorization

| Test Case ID | Description | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | **Sign Up - Success** | 1. Go to `/signup`.<br>2. Enter valid email, password, and confirm password.<br>3. Click "Sign Up". | User is created, redirected to Onboarding or Dashboard. | |
| **AUTH-02** | **Sign Up - Validation** | 1. Go to `/signup`.<br>2. Try submitting empty form or mismatched passwords. | Error messages should appear. Form should not submit. | |
| **AUTH-03** | **Login - Success** | 1. Go to `/login`.<br>2. Enter valid credentials.<br>3. Click "Login". | User is logged in and redirected to `/dashboard`. | |
| **AUTH-04** | **Login - Failure** | 1. Go to `/login`.<br>2. Enter invalid credentials. | Error message "Invalid login credentials" (or similar) appears. | |
| **AUTH-05** | **Logout** | 1. Log in.<br>2. Click "Logout" in the Navbar or Profile menu. | User is logged out and redirected to `/login` or home. | |
| **AUTH-06** | **Forgot Password** | 1. Go to `/forgot-password`.<br>2. Enter registered email.<br>3. Submit. | Success message appears. Email is sent (check Supabase logs/inbox). | |
| **AUTH-07** | **Protected Routes** | 1. Ensure you are logged out.<br>2. Try to access `/dashboard`, `/profile`, `/settings`. | User is redirected to `/login`. | |
| **AUTH-08** | **Auth Routes Redirect** | 1. Ensure you are logged in.<br>2. Try to access `/login` or `/signup`. | User is redirected to `/dashboard`. | |

## 2. Onboarding

| Test Case ID | Description | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ONB-01** | **Complete Onboarding** | 1. Sign up a new user.<br>2. Complete the profile setup steps (Name, Age, Gender, etc.). | Profile is saved. User is redirected to Dashboard. | |

## 3. Dashboard & Navigation

| Test Case ID | Description | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DASH-01** | **Navbar Navigation** | 1. Log in.<br>2. Click on Dashboard, Search, Messages, Profile icons. | Correct pages load without full page refresh. Active state updates. | |
| **DASH-02** | **Responsive Navbar** | 1. Resize browser to mobile width.<br>2. Check if hamburger menu appears and works. | Menu opens/closes. Links work. | |
| **DASH-03** | **Dashboard Loading** | 1. Go to `/dashboard`. | Dashboard content (recommendations, stats) loads correctly. Skeletons show while loading. | |

## 4. Profile Management

| Test Case ID | Description | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PROF-01** | **View Own Profile** | 1. Go to `/profile`. | Profile details (Avatar, Name, Bio, Stats) are displayed correctly. | |
| **PROF-02** | **Edit Profile** | 1. Go to `/edit-profile`.<br>2. Change Name, Bio, or other fields.<br>3. Save. | Success message. Changes are reflected on `/profile`. | |
| **PROF-03** | **Change Avatar** | 1. Go to `/edit-profile`.<br>2. Generate/Select a new avatar.<br>3. Save. | New avatar is displayed in Navbar and Profile. | |

## 5. Search & Discovery

| Test Case ID | Description | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SRCH-01** | **Search Users** | 1. Go to `/search`.<br>2. Enter a keyword (name or skill). | Relevant users appear in the results list. | |
| **SRCH-02** | **View User Profile** | 1. Click on a user from search results. | User's public profile (`/user/[id]`) loads. | |

## 6. Messaging

| Test Case ID | Description | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **MSG-01** | **Send Message** | 1. Go to a user's profile.<br>2. Click "Message".<br>3. Type and send a message. | Message appears in the conversation. | |
| **MSG-02** | **Inbox List** | 1. Go to `/messages`. | List of conversations appears. Most recent at top. | |
| **MSG-03** | **Unread Count** | 1. Receive a message (simulate or use 2nd account). | Notification badge on Message icon in Navbar updates. | |

## 7. Settings

| Test Case ID | Description | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SET-01** | **Privacy Settings** | 1. Go to `/settings/privacy`.<br>2. Toggle visibility options. | Settings are saved. | |
| **SET-02** | **Data Export** | 1. Go to `/settings/data-export`.<br>2. Request export. | JSON file with user data is downloaded. | |
| **SET-03** | **Delete Account** | 1. Go to `/settings/delete-account`.<br>2. Confirm deletion. | Account is deleted. User logged out. (Use a test account!) | |

## 8. Admin (If Authorized)

| Test Case ID | Description | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ADM-01** | **Access Admin Panel** | 1. Log in as Admin.<br>2. Go to `/admin`. | Admin dashboard loads. | |
| **ADM-02** | **Unauthorized Access** | 1. Log in as regular user.<br>2. Go to `/admin`. | Access denied or redirect to home. | |

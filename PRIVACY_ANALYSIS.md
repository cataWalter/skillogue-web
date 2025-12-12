# Privacy Analysis

## Data Collection
We collect the following Personally Identifiable Information (PII):
- **Identity**: First Name, Last Name, Age, Gender.
- **Contact**: Email address (via Supabase Auth).
- **Location**: City, Region, Country.
- **Interests**: Passions, Languages.
- **Communications**: Private messages between users.
- **Technical**: IP address, User Agent (via Supabase logs).

## Data Storage & Security
- **Database**: Data is stored in a PostgreSQL database hosted by Supabase.
- **Authentication**: Supabase Auth handles user sessions and password security.
- **Encryption**: Data is encrypted in transit (HTTPS) and at rest (Supabase encryption).

## Data Usage
- **Matching**: Profile data is used to suggest matches to other users.
- **Communication**: Messaging feature allows users to contact each other.
- **Notifications**: Email and in-app notifications for engagement.

## User Rights (Gap Analysis)
- [x] **Right to Access**: Users can view their own profile.
- [x] **Right to Rectification**: Users can edit their profile.
- [x] **Right to Erasure**: Users can delete their account (implemented in Settings).
- [ ] **Right to Data Portability**: No automated "Export Data" feature currently exists.
- [ ] **Consent Management**: Basic cookie notice exists, but no granular consent for tracking/analytics.

## Recommendations
1.  **Implement Data Export**: Create a feature to download all user data as JSON/CSV.
2.  **Enhance Cookie Consent**: Implement a proper cookie banner if analytics or marketing cookies are added.
3.  **Privacy Policy**: Create a dedicated page detailing data handling practices.

# Database Fix Instructions

The application requires some database schema updates to support privacy features.
The automated check detected that the `profiles` table is missing the following columns:
- `is_private`
- `show_age`
- `show_location`

## How to Fix

Since the application does not have direct administrative access to the database, you need to run the migration manually in the Supabase Dashboard.

1.  **Log in** to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project (`oyucjqjijrtipvssqxbc`).
3.  Go to the **SQL Editor** (icon on the left sidebar).
4.  Click **New Query**.
5.  **Copy and paste** the content of the `privacy_migration.sql` file (located in the root of this project) into the query editor.
    
    Or copy it from here:
    ```sql
    ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS show_age boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_location boolean DEFAULT true;
    ```
6.  Click **Run**.

## Verification

After running the script, you can verify the fix by running the check script in your terminal:

```bash
node scripts/check-db.js
```

It should output: `Privacy columns exist.`

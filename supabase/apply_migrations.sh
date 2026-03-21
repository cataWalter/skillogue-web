#!/bin/bash
# Script to apply Skillogue migrations to Supabase
# 
# Option 1: Run via Supabase CLI (requires correct password)
#   supabase db push -p 'YOUR_PASSWORD'
#
# Option 2: Run via Supabase Dashboard SQL Editor
#   Copy and paste the contents of:
#   - supabase/migrations/00002_missing_tables_and_functions.sql
#   - supabase/production_setup.sql
#   - supabase/enhancements.sql
#
# Option 3: Run via psql (requires PostgreSQL installed)
#   PGPASSWORD='YOUR_PASSWORD' psql -h HOST -U postgres -d postgres -f FILE.sql

echo "============================================"
echo "Skillogue Database Migration Script"
echo "============================================"
echo ""
echo "The following files have been created:"
echo ""
echo "1. supabase/migrations/00002_missing_tables_and_functions.sql"
echo "   - Missing tables: blocked_users, push_subscriptions, analytics_events, message_reads"
echo "   - RPC Functions: 24+ functions for search, messaging, blocking, favorites, etc."
echo ""
echo "2. supabase/production_setup.sql"
echo "   - Contact requests table"
echo "   - Enhanced blocking functionality"
echo "   - Admin policies"
echo "   - Additional seed locations"
echo ""
echo "3. supabase/enhancements.sql"
echo "   - Analytics materialized views"
echo "   - Real-time enhancements"
echo "   - Audit logging system"
echo ""
echo "============================================"
echo "To apply these migrations:"
echo "============================================"
echo ""
echo "Option A - Supabase CLI:"
echo "  supabase db push"
echo ""
echo "Option B - Supabase Dashboard:"
echo "  1. Go to https://supabase.com/dashboard"
echo "  2. Select your project"
echo "  3. Go to SQL Editor"
echo "  4. Copy the contents of each .sql file and run"
echo ""
echo "Option C - psql (if installed):"
echo "  PGPASSWORD='your_password' psql \\"
echo "    -h db.your-project.supabase.co \\"
echo "    -U postgres \\"
echo "    -d postgres \\"
echo "    -f supabase/migrations/00002_missing_tables_and_functions.sql"
echo ""

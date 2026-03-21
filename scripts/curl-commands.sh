#!/bin/bash

# Individual CURL commands for Supabase database operations
# Use these commands one at a time or source this file

SUPABASE_URL="https://nsbgzdxxzeznozgtsplm.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmd6ZHh4emV6bm96Z3RzcGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjc4NzAsImV4cCI6MjA4OTYwMzg3MH0.tHMboH_uJEy8Ch-FM5i9A5O4oZl_GcqHS9bJ6rLzlDM"

echo "========================================="
echo "Supabase CURL Commands Reference"
echo "========================================="

# ============================================
# INSERT COMMANDS
# ============================================

echo ""
echo "--- INSERT COMMANDS ---"
echo ""

# Insert single passion
echo "# Insert single passion:"
echo 'curl -X POST "${SUPABASE_URL}/rest/v1/passions" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"name": "Yoga"}'"'"''
echo ""

# Insert multiple passions
echo "# Insert multiple passions:"
echo 'curl -X POST "${SUPABASE_URL}/rest/v1/passions" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'[{"name": "Hiking"}, {"name": "Swimming"}, {"name": "Cycling"}]'"'"''
echo ""

# Insert single language
echo "# Insert single language:"
echo 'curl -X POST "${SUPABASE_URL}/rest/v1/languages" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"name": "Dutch"}'"'"''
echo ""

# Insert single location
echo "# Insert single location:"
echo 'curl -X POST "${SUPABASE_URL}/rest/v1/locations" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"city": "Amsterdam", "region": "North Holland", "country": "Netherlands"}'"'"''
echo ""

# Insert user profile (requires auth user ID)
echo "# Insert user profile (replace USER_ID with actual UUID):"
echo 'curl -X POST "${SUPABASE_URL}/rest/v1/profiles" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{'
echo '    "id": "USER_ID",'
echo '    "first_name": "Alice",'
echo '    "last_name": "Smith",'
echo '    "about_me": "Love hiking and photography!",'
echo '    "age": 25,'
echo '    "gender": "female",'
echo '    "verified": true,'
echo '    "is_private": false,'
echo '    "show_age": true,'
echo '    "show_location": true'
echo '  }'"'"''
echo ""

# Insert user passion association
echo "# Insert user passion (link user to passion):"
echo 'curl -X POST "${SUPABASE_URL}/rest/v1/user_passions" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"user_id": "USER_ID", "passion_id": 1}'"'"''
echo ""

# Insert user language association
echo "# Insert user language (link user to language):"
echo 'curl -X POST "${SUPABASE_URL}/rest/v1/profile_languages" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"profile_id": "USER_ID", "language_id": 1}'"'"''
echo ""

# Insert message
echo "# Insert message between users:"
echo 'curl -X POST "${SUPABASE_URL}/rest/v1/messages" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{'
echo '    "sender_id": "SENDER_USER_ID",'
echo '    "receiver_id": "RECEIVER_USER_ID",'
echo '    "content": "Hey! Nice to meet you."'
echo '  }'"'"''
echo ""

# ============================================
# QUERY COMMANDS
# ============================================

echo ""
echo "--- QUERY COMMANDS ---"
echo ""

# Get all passions
echo "# Get all passions:"
echo 'curl "${SUPABASE_URL}/rest/v1/passions?select=*" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"'
echo ""

# Get all languages
echo "# Get all languages:"
echo 'curl "${SUPABASE_URL}/rest/v1/languages?select=*" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"'
echo ""

# Get all locations
echo "# Get all locations:"
echo 'curl "${SUPABASE_URL}/rest/v1/locations?select=*" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"'
echo ""

# Get user profile
echo "# Get user profile by ID:"
echo 'curl "${SUPABASE_URL}/rest/v1/profiles?id=eq.USER_ID&select=*" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"'
echo ""

# Get user passions
echo "# Get user passions:"
echo 'curl "${SUPABASE_URL}/rest/v1/user_passions?user_id=eq.USER_ID&select=passions(name)" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"'
echo ""

# Get messages between two users
echo "# Get messages between two users:"
echo 'curl "${SUPABASE_URL}/rest/v1/messages?or=(and(sender_id.eq.USER1,receiver_id.eq.USER2),and(sender_id.eq.USER2,receiver_id.eq.USER1))&order=created_at.asc&select=*" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"'
echo ""

# Search profiles by location
echo "# Search profiles by location:"
echo 'curl "${SUPABASE_URL}/rest/v1/profiles?select=*,locations(city,region,country)&locations.city=eq.New York" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"'
echo ""

# ============================================
# UPDATE COMMANDS
# ============================================

echo ""
echo "--- UPDATE COMMANDS ---"
echo ""

# Update profile
echo "# Update user profile:"
echo 'curl -X PATCH "${SUPABASE_URL}/rest/v1/profiles?id=eq.USER_ID" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"about_me": "Updated bio text!"}'"'"''
echo ""

# Mark notification as read
echo "# Mark notification as read:"
echo 'curl -X PATCH "${SUPABASE_URL}/rest/v1/notifications?id=eq.NOTIFICATION_ID" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"read": true}'"'"''
echo ""

# ============================================
# DELETE COMMANDS
# ============================================

echo ""
echo "--- DELETE COMMANDS ---"
echo ""

# Delete user passion
echo "# Remove passion from user:"
echo 'curl -X DELETE "${SUPABASE_URL}/rest/v1/user_passions?user_id=eq.USER_ID&passion_id=eq.PASSION_ID" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"'
echo ""

# Delete message
echo "# Delete a message:"
echo 'curl -X DELETE "${SUPABASE_URL}/rest/v1/messages?id=eq.MESSAGE_ID" \'
echo '  -H "apikey: ${SUPABASE_ANON_KEY}" \'
echo '  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"'
echo ""

echo ""
echo "========================================="
echo "End of CURL Commands Reference"
echo "========================================="
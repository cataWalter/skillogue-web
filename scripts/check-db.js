
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('Checking database connection...');
  
  // Check if we can connect
  const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
  
  if (error) {
    console.error('Error connecting to database or profiles table missing:', error.message);
    if (error.code === '42P01') { // undefined_table
        console.log('Profiles table does not exist. You need to run the schema.sql script.');
    }
  } else {
    console.log('Successfully connected to profiles table.');
    
    // Check for privacy columns
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('is_private, show_age, show_location').limit(1);
    if (profileError) {
        console.error('Error checking privacy columns:', profileError.message);
        console.log('You might need to run the privacy_migration.sql script.');
    } else {
        console.log('Privacy columns exist.');
    }
  }

  // Check for other tables
  const tables = ['passions', 'languages', 'profile_passions', 'profile_languages', 'messages', 'notifications', 'blocks', 'reports'];
  
  for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (tableError) {
          console.error(`Error accessing table ${table}:`, tableError.message);
      } else {
          console.log(`Table ${table} exists.`);
      }
  }
}

checkDatabase();

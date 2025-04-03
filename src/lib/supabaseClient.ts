
import { createClient } from '@supabase/supabase-js';

// For development purposes only - replace with your actual Supabase credentials
// Remove these defaults in production
const defaultSupabaseUrl = 'https://xyzcompany.supabase.co';
const defaultSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZW5ldG9oYXJwbmF5eXd4d2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5MTYyMTUsImV4cCI6MjAxNTQ5MjIxNX0.PLACEHOLDER';

// Use environment variables if available, otherwise fall back to defaults
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultSupabaseAnonKey;

// Only log warnings in development
if (import.meta.env.DEV && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.warn('⚠️ Using default Supabase credentials. Set up your .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for proper functionality.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


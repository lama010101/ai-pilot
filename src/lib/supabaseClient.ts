
import { createClient } from '@supabase/supabase-js';

// For development purposes only - replace with your actual Supabase credentials
// Remove these defaults in production
const defaultSupabaseUrl = 'https://zwdkywvgoowrqbhftbkc.supabase.co';
const defaultSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZGt5d3Znb293cnFiaGZ0YmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NTk2MzksImV4cCI6MjA1OTIzNTYzOX0.HXZ9OEGAv6Qis1uCGEPv1NW_9g7HgXFofXnU_K82uYk';

// Use environment variables if available, otherwise fall back to defaults
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultSupabaseAnonKey;

// Development flag for fake authentication
export const USE_FAKE_AUTH = import.meta.env.VITE_USE_FAKE_AUTH === 'true';

// Only log warnings in development
if (import.meta.env.DEV && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.warn('⚠️ Using default Supabase credentials. Set up your .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for proper functionality.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

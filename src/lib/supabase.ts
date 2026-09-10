import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iudjmyuggwvvldakdjqt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1ZGpteXVnZ3d2dmxkYWtkanF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNzAwNjYsImV4cCI6MjEwNDY0NjA2Nn0.cCGBzARQOa2GyhanPLp5wpvK9ZkPkkBb6Sh--TxAwEk';

export let supabase: SupabaseClient | null = null;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
} catch (err) {
  console.warn('[SUPABASE_CLIENT] Failed to initialize Supabase client:', err);
  supabase = null;
}

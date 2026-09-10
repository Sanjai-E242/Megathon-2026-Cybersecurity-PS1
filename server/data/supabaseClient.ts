import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://iudjmyuggwvvldakdjqt.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1ZGpteXVnZ3d2dmxkYWtkanF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNzAwNjYsImV4cCI6MjEwNDY0NjA2Nn0.cCGBzARQOa2GyhanPLp5wpvK9ZkPkkBb6Sh--TxAwEk';

export let supabase: SupabaseClient | null = null;

try {
  if (supabaseUrl && supabaseKey && supabaseKey !== 'dummy_anon_key_for_development') {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`[SUPABASE] Connected to Supabase instance: ${supabaseUrl}`);
  } else {
    console.log('[SUPABASE] Running in local in-memory persistence mode (Supabase key not configured).');
  }
} catch (error) {
  console.warn('[SUPABASE] Supabase initialization failed, falling back to in-memory store:', error);
  supabase = null;
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const supabaseUrl = (meta && meta.env && meta.env.VITE_SUPABASE_URL) || 'https://bwejxnkyzbaczyqsxybh.supabase.co';
const supabaseAnonKey = (meta && meta.env && meta.env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZWp4bmt5emJhY3p5cXN4eWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzA4NzIsImV4cCI6MjA4OTI0Njg3Mn0.OVkDxsg2fiRxahQQK8Avd-fU_b4qlmXbDdXt4aHLubE';

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

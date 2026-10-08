import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Resolve configuration from client-side environment or direct production defaults
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  'https://uztxsjbmugfbhgedpmpe.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.ANON_KEY ||
  'sb_publishable_jgXwQ8Vy2UZbQPkS2a4Z9Q_eTcjs7Xk';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };

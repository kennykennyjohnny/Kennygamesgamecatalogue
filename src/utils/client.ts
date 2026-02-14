import { createClient } from '@jsr/supabase__supabase-js';
import { projectId, publicAnonKey } from './supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    persistSession: false, // We handle session manually with localStorage
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

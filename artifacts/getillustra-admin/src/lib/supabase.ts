import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl : 'https://placeholder.supabase.co';

export const supabase = createClient(supabaseUrl, supabaseKey);

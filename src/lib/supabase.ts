import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Environment Variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}


const validUrl = supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))
    ? supabaseUrl
    : 'https://placeholder.supabase.co';

export const isSupabaseConfigured = validUrl !== 'https://placeholder.supabase.co' && supabaseKey !== 'placeholder';

export const supabase = createClient(
    validUrl,
    supabaseKey || 'placeholder'
);

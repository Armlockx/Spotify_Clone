import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './config.js';

const supabaseUrl = SUPABASE_CONFIG.url || process.env.SUPABASE_URL || window?.env?.SUPABASE_URL || '';
const supabaseKey = SUPABASE_CONFIG.anonKey || process.env.SUPABASE_KEY || window?.env?.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn(
        'Supabase URL/key não configurados. Verifique se config.js está carregado ou defina SUPABASE_URL/SUPABASE_KEY no ambiente.'
    );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true
    }
});


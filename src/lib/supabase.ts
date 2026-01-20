import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if credentials are available
let supabase: SupabaseClient | null = null;

console.log('[DEBUG] Init Supabase...');
console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Key:', supabaseAnonKey ? 'Set' : 'Missing');

if (supabaseUrl && supabaseAnonKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('[DEBUG] Supabase Client Created');
    } catch (e) {
        console.error('[ERROR] Supabase Create Failed:', e);
    }
} else {
    console.warn('⚠️ Supabase credentials missing in environment variables');
}

export { supabase };

// Types
export interface News {
    id: number;
    created_at: string;
    title: string;
    summary: string | null;
    content: string | null;
    original_url: string | null;
    source: string;
    published_at: string | null;
    sentiment_score: number | null;
    image_url: string | null;
    category?: string;
    show_on_chart?: boolean;      // 차트 표시 여부
    related_coin?: string | null;  // 어떤 코인 차트에 표시할지 (BTC, ETH 등)
}

export interface Research {
    id: number;
    created_at: string;
    title: string;
    author: string;
    summary: string | null;
    content: string | null;
    tags: string[] | null;
    is_premium: boolean;
    thumbnail_url: string | null;
}

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
    return !!(supabaseUrl && supabaseAnonKey && supabase);
}

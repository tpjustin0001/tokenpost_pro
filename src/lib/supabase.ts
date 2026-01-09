import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if credentials are available
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
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

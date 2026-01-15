import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// API Key for authentication
const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;

export async function DELETE(request: NextRequest) {
    try {
        // 1. Auth check
        const apiKey = request.headers.get('X-API-KEY');

        if (!EXTERNAL_API_KEY) {
            return NextResponse.json(
                { error: 'Server configuration error: EXTERNAL_API_KEY not set' },
                { status: 500 }
            );
        }

        if (!apiKey || apiKey !== EXTERNAL_API_KEY) {
            return NextResponse.json(
                { error: 'Unauthorized: Invalid API Key' },
                { status: 401 }
            );
        }

        // 2. Delete all news
        const { error: newsError, count: newsCount } = await supabase
            .from('news')
            .delete()
            .neq('id', 0); // Delete all (using neq to match all)

        // 3. Delete all research
        const { error: researchError, count: researchCount } = await supabase
            .from('research')
            .delete()
            .neq('id', 0);

        if (newsError || researchError) {
            console.error('[Clear API] Errors:', { newsError, researchError });
            return NextResponse.json(
                { error: 'Database delete failed', details: { newsError, researchError } },
                { status: 500 }
            );
        }

        console.log(`[Clear API] Cleared: news=${newsCount}, research=${researchCount}`);
        return NextResponse.json({
            success: true,
            message: 'Clear operation completed',
            deleted: {
                news: newsCount ?? 0,
                research: researchCount ?? 0,
                usingServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
            }
        });

    } catch (error) {
        console.error('[Clear API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}

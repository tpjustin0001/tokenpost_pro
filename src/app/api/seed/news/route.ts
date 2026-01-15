import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Seed test data
export async function GET() {
    if (!supabase) {
        return NextResponse.json({
            success: false,
            error: 'Supabase client not initialized'
        }, { status: 500 });
    }

    try {
        const { data, error } = await supabase
            .from('news')
            .insert([
                {
                    title: 'Bitcoin breaks resistance level, aiming for new high',
                    summary: 'Institutional demand surges as ETF inflows hit record numbers.',
                    content: 'Bitcoin has shown strong momentum...',
                    category: 'Market',
                    related_coin: 'BTC',
                    sentiment_score: 0.85,
                    show_on_chart: true,
                    source: 'TokenPost Analytics',
                    published_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Test news inserted successfully',
            data
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// POST: Receive news from external sources
export async function POST(request: NextRequest) {
    if (!supabase) {
        return NextResponse.json({
            success: false,
            error: 'Supabase client not initialized'
        }, { status: 500 });
    }

    try {
        const body = await request.json();

        // Validate required fields
        if (!body.title) {
            return NextResponse.json({
                success: false,
                error: 'Missing required field: title'
            }, { status: 400 });
        }

        // Prepare news data
        const newsData = {
            title: body.title,
            summary: body.summary || '',
            content: body.content || '',
            category: body.category || 'Market',
            related_coin: body.related_coin || body.symbol || null,
            sentiment_score: body.sentiment_score ?? body.signal ?? 0,
            show_on_chart: body.show_on_chart ?? true,
            source: body.source || 'External API',
            published_at: body.published_at || new Date().toISOString(),
            url: body.url || null,  // Supabase news 테이블에 url 컬럼 필요
        };

        console.log('[News API] Received:', JSON.stringify(newsData, null, 2));

        const { data, error } = await supabase
            .from('news')
            .insert([newsData])
            .select();

        if (error) {
            console.error('[News API] Insert Error:', error);
            return NextResponse.json({
                success: false,
                error: `Database error: ${error.message}`
            }, { status: 500 });
        }

        console.log('[News API] Success:', data?.[0]?.id);

        return NextResponse.json({
            success: true,
            message: 'News received and saved successfully',
            id: data?.[0]?.id,
            data: data?.[0]
        });

    } catch (error: any) {
        console.error('[News API] Error:', error);
        return NextResponse.json({
            success: false,
            error: `Failed to process request: ${error.message}`
        }, { status: 500 });
    }
}

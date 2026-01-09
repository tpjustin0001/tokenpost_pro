import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
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
                    published_at: new Date().toISOString() // NOW
                }
            ])
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

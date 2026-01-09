import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Recent news item (using current time)
    const now = new Date();

    const newsItem = {
        title: "Bitcoin ETF Inflows Surge to Record Highs",
        summary: "Spot Bitcoin ETFs have recorded their highest daily inflow since launch, signaling strong institutional demand.",
        content: "Spot Bitcoin ETFs have recorded their highest daily inflow since launch, signaling strong institutional demand. BlackRock's IBIT led the pack with over $500M in a single day.",
        category: "Market",
        source: "TokenPost Pro",
        image_url: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=2069&auto=format&fit=crop",
        sentiment_score: 0.85,
        related_coin: "BTC",
        show_on_chart: true,
        published_at: now.toISOString(),
        author: "AI Analyst"
    };

    const { data, error } = await supabase
        .from('news')
        .insert([newsItem])
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
}

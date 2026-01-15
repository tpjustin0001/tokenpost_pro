import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for secure server-side insert
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// API Key for authentication
const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;

export async function POST(request: NextRequest) {
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

        // 2. Parse payload - support both JSON and multipart/form-data
        const contentTypeHeader = request.headers.get('content-type') || '';
        let contentType: string;
        let payload: Record<string, any>;

        if (contentTypeHeader.includes('multipart/form-data')) {
            // Parse multipart/form-data
            const formData = await request.formData();
            contentType = formData.get('type')?.toString() || 'news';

            // Build payload from form fields
            payload = {};
            formData.forEach((value, key) => {
                if (key !== 'type') {
                    // Handle arrays (e.g., tags[])
                    if (key.endsWith('[]')) {
                        const cleanKey = key.slice(0, -2);
                        if (!payload[cleanKey]) payload[cleanKey] = [];
                        payload[cleanKey].push(value.toString());
                    } else if (key === 'show_on_chart' || key === 'is_premium') {
                        payload[key] = value.toString() === 'true';
                    } else if (key === 'sentiment_score') {
                        payload[key] = parseFloat(value.toString());
                    } else {
                        payload[key] = value.toString();
                    }
                }
            });
        } else {
            // Parse JSON
            const body = await request.json();
            contentType = body.type || 'news';
            payload = body.data || body;
        }

        if (!payload || !payload.title) {
            return NextResponse.json(
                { error: 'Missing required field: title' },
                { status: 400 }
            );
        }

        // 3. Insert into Supabase
        if (contentType === 'news') {
            const dbPayload = {
                title: payload.title,
                summary: payload.summary,
                content: payload.content,
                source: payload.source || 'External',
                published_at: payload.published_at || new Date().toISOString(),
                sentiment_score: payload.sentiment_score,
                image_url: payload.image_url,
                category: payload.category,
                show_on_chart: payload.show_on_chart ?? false,
                related_coin: payload.related_coin
            };

            const { data, error } = await supabase
                .from('news')
                .insert(dbPayload)
                .select()
                .single();

            if (error) {
                console.error('[Ingest API] Supabase error:', error);
                return NextResponse.json(
                    { error: 'Database insert failed', details: error.message },
                    { status: 500 }
                );
            }

            console.log(`[Ingest API] News inserted: ID ${data.id}`);
            return NextResponse.json({
                success: true,
                type: 'news',
                id: data.id,
                title: data.title
            });

        } else if (contentType === 'research') {
            const dbPayload = {
                title: payload.title,
                author: payload.author || 'TokenPost',
                summary: payload.summary,
                content: payload.content,
                tags: payload.tags || [],
                is_premium: payload.is_premium ?? false,
                image_url: payload.thumbnail_url,
                category: payload.type || 'REPORT'
            };

            const { data, error } = await supabase
                .from('research')
                .insert(dbPayload)
                .select()
                .single();

            if (error) {
                console.error('[Ingest API] Supabase error:', error);
                return NextResponse.json(
                    { error: 'Database insert failed', details: error.message },
                    { status: 500 }
                );
            }

            console.log(`[Ingest API] Research inserted: ID ${data.id}`);
            return NextResponse.json({
                success: true,
                type: 'research',
                id: data.id,
                title: data.title
            });

        } else {
            return NextResponse.json(
                { error: `Unsupported content type: ${contentType}` },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('[Ingest API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}

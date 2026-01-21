import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for secure server-side insert
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// API Key for authentication
const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;

/**
 * Parse Korean date format to ISO timestamp
 * Supports: "2026년 1월 21일 오후 6:05", "2026년 1월 21일 18:05", "2026-01-21T18:05:00"
 * Assumes KST (Asia/Seoul) timezone and converts to UTC
 */
function parseKoreanDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString();

    // If already ISO format, return as-is
    if (dateStr.includes('T') && (dateStr.includes('Z') || dateStr.includes('+'))) {
        return dateStr;
    }

    // Korean format: "2026년 1월 21일 오후 6:05" or "2026년 1월 21일 18:05"
    const koreanRegex = /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)?\s*(\d{1,2}):(\d{2})/;
    const match = dateStr.match(koreanRegex);

    if (match) {
        const [, year, month, day, ampm, hourStr, minute] = match;
        let hour = parseInt(hourStr);

        // Handle AM/PM (오전/오후)
        if (ampm === '오후' && hour < 12) hour += 12;
        if (ampm === '오전' && hour === 12) hour = 0;

        // Create date in KST (UTC+9)
        const kstDate = new Date(Date.UTC(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            hour - 9, // Convert KST to UTC by subtracting 9 hours
            parseInt(minute)
        ));

        return kstDate.toISOString();
    }

    // Try parsing as regular date string
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
    }

    // Fallback to current time
    console.warn(`[Ingest API] Could not parse date: ${dateStr}, using current time`);
    return new Date().toISOString();
}

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
                published_at: parseKoreanDate(payload.published_at),
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
                category: payload.type || 'REPORT',
                published_at: parseKoreanDate(payload.published_at)
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

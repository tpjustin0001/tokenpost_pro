import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ETH_PER_VALIDATOR = 32;
const ETH_TOTAL_SUPPLY = 120_000_000;

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('eth_staking_metrics')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('[ETH Staking API] DB Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'No data found' }, { status: 404 });
        }

        // --- Calculate Derived Metrics (Replicating Python Logic) ---
        const entry_queue = data.entry_queue;
        const exit_queue = data.exit_queue;
        const entry_wait_seconds = data.entry_wait_seconds;
        const exit_wait_seconds = data.exit_wait_seconds;
        const active_validators = data.active_validators;
        const total_staked_eth = data.total_staked_eth;
        const staking_apr = data.staking_apr || 3.5;

        // 1. ETH values
        const entry_queue_eth = entry_queue * ETH_PER_VALIDATOR;
        const exit_queue_eth = exit_queue * ETH_PER_VALIDATOR;

        // 2. Times
        const entry_wait_days = entry_wait_seconds / 86400;
        const entry_wait_hours = entry_wait_seconds / 3600;
        const exit_wait_minutes = exit_wait_seconds / 60;

        // 3. Staked %
        const staked_percentage = (total_staked_eth / ETH_TOTAL_SUPPLY) * 100;

        // 4. Signal Logic
        // 🔴 매도 경보: exit_wait_days > 3 (approx 4320 mins)
        // 🟢 강력 홀딩: entry_wait_days > 10 AND exit_wait_minutes < 60
        // 🟡 중립: 그 외
        const exit_wait_days_calc = exit_wait_minutes / 1440;

        let signal = 'NEUTRAL';
        let signal_color = 'yellow';
        let signal_text = '중립';
        let signal_emoji = '🟡';

        if (exit_wait_days_calc > 3) {
            signal = 'SELL_ALERT';
            signal_color = 'red';
            signal_text = '매도 경보';
            signal_emoji = '🔴';
        } else if (entry_wait_days > 10 && exit_wait_minutes < 60) {
            signal = 'STRONG_HOLD';
            signal_color = 'green';
            signal_text = '강력 홀딩';
            signal_emoji = '🟢';
        }

        // 5. AI Report Logic
        const pressure_status = exit_queue_eth < 1000 ? "소멸" : "증가";
        let market_insight = "유동성 충분";
        if (staked_percentage > 25) market_insight = "공급 쇼크 가능성";
        else if (staked_percentage > 20) market_insight = "안정적 잠금";

        const ai_report = `이더리움 스테이킹 이탈 대기열이 ${exit_queue_eth.toLocaleString()} ETH로 급감하며 매도 압력이 **${pressure_status}**되었습니다. 반면 진입 대기열은 ${entry_queue_eth.toLocaleString()} ETH로, 대기 시간만 **${entry_wait_days.toFixed(1)}일**에 달합니다. 현재 총 공급량의 **${staked_percentage.toFixed(2)}%**가 잠겨있어 **${market_insight}**으로 분석됩니다.`;

        // Response Object
        const responseData = {
            success: true,
            entry_queue,
            exit_queue,
            entry_queue_eth,
            exit_queue_eth,
            entry_wait_days,
            entry_wait_hours,
            exit_wait_minutes,
            active_validators,
            staking_apr,
            total_staked_eth,
            staked_percentage,
            signal,
            signal_color,
            signal_text,
            signal_emoji,
            ai_report,
            timestamp: data.created_at
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('[ETH Staking API] Server Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

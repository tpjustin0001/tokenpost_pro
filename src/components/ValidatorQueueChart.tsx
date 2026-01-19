'use client';

import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ChartOptions
} from 'chart.js';
import { useMemo } from 'react';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Watermark plugin
const watermarkPlugin = {
    id: 'watermark',
    beforeDraw: (chart: ChartJS) => {
        const ctx = chart.ctx;
        const { width, height } = chart;

        ctx.save();
        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TokenPost PRO', width / 2, height / 2);
        ctx.restore();
    }
};

ChartJS.register(watermarkPlugin);

interface HistoryPoint {
    entry_queue: number;
    exit_queue: number;
    created_at: string;
}

interface ValidatorQueueChartProps {
    data: HistoryPoint[];
    period: '7d' | '30d' | '90d' | '1y' | 'all';
}

export default function ValidatorQueueChart({ data, period }: ValidatorQueueChartProps) {
    const chartData = useMemo(() => {
        // Format labels based on period
        const labels = data.map(d => {
            const date = new Date(d.created_at);
            if (period === '7d' || period === '30d' || period === '90d') {
                return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
            } else {
                return date.toLocaleDateString('ko-KR', { year: '2-digit', month: 'short' });
            }
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Entry Queue',
                    data: data.map(d => d.entry_queue),
                    borderColor: 'rgb(54, 162, 235)', // Blue
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                    yAxisID: 'y',
                },
                {
                    label: 'Exit Queue',
                    data: data.map(d => d.exit_queue),
                    borderColor: 'rgb(255, 99, 132)', // Red/Pink
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                    yAxisID: 'y1', // Keep separate axis or merge if scale is similar? Usually separate for visibility
                }
            ],
        };
    }, [data, period]);

    const options: ChartOptions<'line'> = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'end' as const,
                labels: {
                    boxWidth: 12,
                    padding: 8,
                    font: { size: 10 },
                    color: '#9ca3af',
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: { size: 11 },
                bodyFont: { size: 10 },
                padding: 8,
                callbacks: {
                    label: (context: any) => {
                        const label = context.dataset.label || '';
                        const value = context.raw as number;
                        return `${label}: ${value.toLocaleString()}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    font: { size: 10, family: 'Inter' },
                    color: '#9ca3af',
                    maxRotation: 45,
                    autoSkip: true,
                    maxTicksLimit: 8,
                }
            },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false,
                },
                ticks: {
                    font: { size: 10, family: 'Inter' },
                    color: '#6b7280',
                    padding: 8,
                    callback: function (value: string | number) {
                        if (typeof value === 'number') {
                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`; // e.g., 2.5M
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}k`; // e.g., 500k
                            return value;
                        }
                        return value;
                    }
                }
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                grid: {
                    drawOnChartArea: false,
                    drawBorder: false,
                },
                ticks: {
                    font: { size: 10, family: 'Inter' },
                    color: '#6b7280', // Match left axis color for cleaner look, or keep distinct? ValidatorQueue uses gray for both generally
                    padding: 8,
                    callback: function (value: string | number) {
                        if (typeof value === 'number') {
                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                            return value;
                        }
                        return value;
                    }
                }
            }
        }
    }), [period]);

    if (data.length < 2) {
        return <div style={{ color: '#6b7280', fontSize: '11px', textAlign: 'center', padding: '20px' }}>데이터 수집 중...</div>;
    }

    return (
        <div style={{ height: '180px', position: 'relative' }}>
            <Line data={chartData} options={options} />
        </div>
    );
}

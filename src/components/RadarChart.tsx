'use client';

import { useMemo } from 'react';

interface RadarChartProps {
    data: { label: string; value: number }[]; // value 0-100
    color?: string;
    size?: number;
}

export default function RadarChart({ data, color = '#3b82f6', size = 300 }: RadarChartProps) {
    const center = size / 2;
    const radius = (size / 2) - 40; // Padding
    const sides = data.length;
    const angleStep = (Math.PI * 2) / sides;

    // Calculate vertices for the polygon background
    const levels = 4;
    const backgroundPolygons = useMemo(() => {
        const polys = [];
        for (let i = 1; i <= levels; i++) {
            const levelRadius = (radius / levels) * i;
            const points = data.map((_, index) => {
                const angle = index * angleStep - Math.PI / 2; // Start from top
                const x = center + levelRadius * Math.cos(angle);
                const y = center + levelRadius * Math.sin(angle);
                return `${x},${y}`;
            }).join(' ');
            polys.push(points);
        }
        return polys;
    }, [data, center, radius, angleStep]);

    // Calculate axes lines
    const axes = useMemo(() => {
        return data.map((_, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return { x1: center, y1: center, x2: x, y2: y };
        });
    }, [data, center, radius, angleStep]);

    // Calculate data points
    const dataPoints = useMemo(() => {
        return data.map((item, index) => {
            const valueRadius = (radius * item.value) / 100;
            const angle = index * angleStep - Math.PI / 2;
            const x = center + valueRadius * Math.cos(angle);
            const y = center + valueRadius * Math.sin(angle);
            return { x, y };
        });
    }, [data, center, radius, angleStep]);

    const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background Levels */}
            {backgroundPolygons.map((points, i) => (
                <polygon
                    key={i}
                    points={points}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                />
            ))}

            {/* Axes */}
            {axes.map((line, i) => (
                <line
                    key={i}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                />
            ))}

            {/* Data Polygon */}
            <polygon
                points={polygonPoints}
                fill={color}
                fillOpacity="0.2"
                stroke={color}
                strokeWidth="2"
            />

            {/* Data Points & Labels */}
            {data.map((item, index) => {
                const angle = index * angleStep - Math.PI / 2;
                // Label position (slightly outside radius)
                const labelRadius = radius + 25;
                const lx = center + labelRadius * Math.cos(angle);
                const ly = center + labelRadius * Math.sin(angle);

                return (
                    <g key={index}>
                        <circle
                            cx={dataPoints[index].x}
                            cy={dataPoints[index].y}
                            r="4"
                            fill={color}
                            stroke="#fff"
                            strokeWidth="1"
                        />
                        <text
                            x={lx}
                            y={ly}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="rgba(255, 255, 255, 0.7)"
                            fontSize="12"
                            fontWeight="500"
                        >
                            {item.label}
                        </text>
                        <text
                            x={lx}
                            y={ly + 14}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={color}
                            fontSize="11"
                            fontWeight="700"
                        >
                            {item.value}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

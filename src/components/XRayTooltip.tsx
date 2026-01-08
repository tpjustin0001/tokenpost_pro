'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './XRayTooltip.module.css';

interface XRayTooltipProps {
    content: string;
    children: React.ReactNode;
}

export default function XRayTooltip({ content, children }: XRayTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = (e: React.MouseEvent) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setPosition({
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8,
        });
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    return (
        <div
            ref={triggerRef}
            className={styles.trigger}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            <span className={styles.xrayIcon}>?</span>

            {isVisible && (
                <div
                    className={styles.tooltip}
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                    }}
                >
                    <div className={styles.tooltipArrow} />
                    <div className={styles.tooltipContent}>
                        <span className={styles.xrayBadge}>X-RAY</span>
                        {content}
                    </div>
                </div>
            )}
        </div>
    );
}

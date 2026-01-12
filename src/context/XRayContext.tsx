'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Context definition
interface XRayContextType {
    isXRayActive: boolean;
    toggleXRay: () => void;
    setXRayActive: (active: boolean) => void;
}

const XRayContext = createContext<XRayContextType | undefined>(undefined);

// Provider Component
export function XRayProvider({ children }: { children: ReactNode }) {
    const [isXRayActive, setXRayActive] = useState(false);

    const toggleXRay = () => setXRayActive((prev) => !prev);

    return (
        <XRayContext.Provider value={{ isXRayActive, toggleXRay, setXRayActive }}>
            {children}
            {isXRayActive && <XRayOverlay />}
        </XRayContext.Provider>
    );
}

// Hook
export function useXRay() {
    const context = useContext(XRayContext);
    if (!context) {
        throw new Error('useXRay must be used within an XRayProvider');
    }
    return context;
}

// Internal Overlay Component
function XRayOverlay() {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 45, // Sidebar is 50, Modal is 100. We want to be below Sidebar but above content.
            pointerEvents: 'none', // Allow clicks to pass through to highlighted elements? 
            // Wait. If we cover everything, we block clicks.
            // If pointerEvents is none, clicks go to elements.
            // But we want to DIM non-highlighted elements.
            // Usually we use z-index stacking. Highlighted elements get z-index 51.
            // But we can't easily change z-index of arbitrary elements without layout issues (stacking contexts).

            // Alternative: SVG overlay with cutouts? Hard.
            // Alternative: Everything is covered, but XRayTooltips render ON TOP of this overlay?
            // To do that, XRayTooltips need to be Portaled or z-indexed high.
            // If XRayTooltip uses z-index 50+, it might work if parents don't trap it.
            // Let's assume z-index 50 is enough.

            // But if pointerEvents is 'auto', we block clicks to dashboard.
            // "Click data set... explain".
            // If overlay blocks clicks, user CANNOT click data.
            // So overlay must allow clicks OR pointer-events: none.
            // If pointer-events: none, user can click ANYTHING.
            // Is that okay?
            // User: "Switch... click data set".
            // If I click "News", it navigates. I probably don't want navigation when X-Ray is ON.
            // I want ONLY X-Rayable elements to be clickable.

            // So: pointer-events: auto (blocks clicks).
            // BUT XRayTooltips must be ABOVE the overlay.
            // If XRayTooltip has z-index 51, it captures clicks.
            backdropFilter: 'blur(2px)',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '80px',
        }}>
            <div style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                pointerEvents: 'none'
            }}>
                X-Ray Mode Active: 관련 데이터를 클릭하여 설명을 확인하세요.
            </div>
        </div>
    );
}

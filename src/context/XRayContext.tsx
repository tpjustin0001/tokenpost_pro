'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface XRayContextType {
    isXRayMode: boolean;
    toggleXRayMode: () => void;
    showExplanation: (key: string) => void;
    hideExplanation: () => void;
    currentExplanation: string | null;
}

const XRayContext = createContext<XRayContextType>({
    isXRayMode: false,
    toggleXRayMode: () => { },
    showExplanation: () => { },
    hideExplanation: () => { },
    currentExplanation: null,
});

export const useXRay = () => useContext(XRayContext);

interface XRayProviderProps {
    children: ReactNode;
}

export function XRayProvider({ children }: XRayProviderProps) {
    const [isXRayMode, setIsXRayMode] = useState(false);
    const [currentExplanation, setCurrentExplanation] = useState<string | null>(null);

    const toggleXRayMode = () => {
        setIsXRayMode(!isXRayMode);
        setCurrentExplanation(null);
    };

    const showExplanation = (key: string) => {
        if (isXRayMode) {
            setCurrentExplanation(key);
        }
    };

    const hideExplanation = () => {
        setCurrentExplanation(null);
    };

    return (
        <XRayContext.Provider value={{
            isXRayMode,
            toggleXRayMode,
            showExplanation,
            hideExplanation,
            currentExplanation,
        }}>
            {children}
        </XRayContext.Provider>
    );
}

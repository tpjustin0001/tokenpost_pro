'use client';

import { ReactNode } from 'react';
import { usePageView } from '@/services/analytics';
import { useAuth } from '@/context/AuthContext';

/**
 * Analytics Provider - Client Component
 * 
 * Wraps the app to automatically track page views.
 * Uses the authenticated user's email if available.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    // Track page views with user info if logged in
    usePageView(user?.email, user?.uuid);

    return <>{children}</>;
}

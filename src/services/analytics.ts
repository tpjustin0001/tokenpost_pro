'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Analytics Event Types
export interface AnalyticsEvent {
    event_type: 'page_view' | 'click' | 'scroll' | 'time_spent' | 'action';
    page_path: string;
    user_email?: string;
    user_id?: string;
    session_id?: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}

// Generate or retrieve session ID
function getSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
}

/**
 * Track an analytics event to Supabase
 * Silently fails if Supabase is not configured or insert fails
 */
export async function trackEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'session_id'>): Promise<void> {
    if (!supabase) {
        console.warn('[Analytics] Supabase not configured, skipping event');
        return;
    }

    const fullEvent: AnalyticsEvent = {
        ...event,
        session_id: getSessionId(),
        timestamp: new Date().toISOString(),
    };

    try {
        const { error } = await supabase.from('user_analytics').insert({
            event_type: fullEvent.event_type,
            page_path: fullEvent.page_path,
            user_email: fullEvent.user_email || null,
            user_id: fullEvent.user_id || null,
            session_id: fullEvent.session_id,
            metadata: fullEvent.metadata || {},
            created_at: fullEvent.timestamp,
        });

        if (error) {
            // Silently log - don't break the app
            console.warn('[Analytics] Failed to track event:', error.message);
        }
    } catch (err) {
        console.warn('[Analytics] Error tracking event:', err);
    }
}

/**
 * Track a page view event
 */
export function trackPageView(pagePath: string, userEmail?: string, userId?: string): void {
    trackEvent({
        event_type: 'page_view',
        page_path: pagePath,
        user_email: userEmail,
        user_id: userId,
    });
}

/**
 * Track a user action (click, form submit, etc.)
 */
export function trackAction(
    actionName: string,
    pagePath: string,
    metadata?: Record<string, unknown>,
    userEmail?: string
): void {
    trackEvent({
        event_type: 'action',
        page_path: pagePath,
        user_email: userEmail,
        metadata: { action: actionName, ...metadata },
    });
}

/**
 * React Hook: Automatically tracks page views on route changes
 * Usage: Place in layout.tsx or a top-level component
 */
export function usePageView(userEmail?: string, userId?: string): void {
    const pathname = usePathname();
    const lastPathRef = useRef<string | null>(null);

    useEffect(() => {
        // Avoid duplicate tracking on initial render or same page
        if (pathname && pathname !== lastPathRef.current) {
            lastPathRef.current = pathname;
            trackPageView(pathname, userEmail, userId);
        }
    }, [pathname, userEmail, userId]);
}

/**
 * React Hook: Track time spent on current page
 * Sends event when user leaves the page
 */
export function useTimeOnPage(pagePath: string, userEmail?: string): void {
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        startTimeRef.current = Date.now();

        return () => {
            const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
            if (timeSpent > 5) { // Only track if spent more than 5 seconds
                trackEvent({
                    event_type: 'time_spent',
                    page_path: pagePath,
                    user_email: userEmail,
                    metadata: { seconds: timeSpent },
                });
            }
        };
    }, [pagePath, userEmail]);
}

// ============================================
// Admin Dashboard Analytics Functions
// ============================================

export interface AnalyticsSummary {
    totalPageViews: number;
    uniqueUsers: number;
    topPages: { page_path: string; count: number }[];
    recentActivity: {
        page_path: string;
        user_email: string | null;
        created_at: string;
    }[];
}

/**
 * Get analytics summary for admin dashboard
 */
export async function getAnalyticsSummary(days: number = 7): Promise<AnalyticsSummary | null> {
    if (!supabase) return null;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
        const { data: pageViews, error } = await supabase
            .from('user_analytics')
            .select('page_path, user_email, created_at')
            .eq('event_type', 'page_view')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Calculate unique users
        const uniqueEmails = new Set(
            pageViews?.filter(p => p.user_email).map(p => p.user_email)
        );

        // Count page views per path
        const pathCounts: Record<string, number> = {};
        pageViews?.forEach((pv) => {
            pathCounts[pv.page_path] = (pathCounts[pv.page_path] || 0) + 1;
        });

        const topPages = Object.entries(pathCounts)
            .map(([page_path, count]) => ({ page_path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            totalPageViews: pageViews?.length || 0,
            uniqueUsers: uniqueEmails.size,
            topPages,
            recentActivity: pageViews?.slice(0, 15) || [],
        };
    } catch (err) {
        console.error('[Analytics] Failed to get summary:', err);
        return null;
    }
}

export interface UserActivity {
    email: string;
    pageViews: number;
    lastSeen: string;
    topPages: string[];
}

/**
 * Get per-user activity list for admin dashboard
 */
export async function getUserActivities(days: number = 7): Promise<UserActivity[]> {
    if (!supabase) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
        const { data, error } = await supabase
            .from('user_analytics')
            .select('page_path, user_email, created_at')
            .not('user_email', 'is', null)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by user email
        const userMap: Record<string, { views: { page_path: string; created_at: string }[] }> = {};
        data?.forEach((event) => {
            if (!event.user_email) return;
            if (!userMap[event.user_email]) {
                userMap[event.user_email] = { views: [] };
            }
            userMap[event.user_email].views.push(event);
        });

        return Object.entries(userMap).map(([email, { views }]) => {
            const pathCounts: Record<string, number> = {};
            views.forEach(v => {
                pathCounts[v.page_path] = (pathCounts[v.page_path] || 0) + 1;
            });

            const topPages = Object.entries(pathCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([path]) => path);

            return {
                email,
                pageViews: views.length,
                lastSeen: views[0]?.created_at || '',
                topPages,
            };
        }).sort((a, b) => b.pageViews - a.pageViews);
    } catch (err) {
        console.error('[Analytics] Failed to get user activities:', err);
        return [];
    }
}

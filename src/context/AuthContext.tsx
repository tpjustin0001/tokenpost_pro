'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    TokenPostUser,
    getAccessToken,
    getUserProfile,
    saveUserProfile,
    fetchProfile,
    logout as authLogout,
    initiateLogin
} from '../services/authService';

interface AuthContextType {
    user: TokenPostUser | null;
    isLoggedIn: boolean;
    loading: boolean;
    login: () => void;
    logout: () => void;
    refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<TokenPostUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch by only running on client
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Check for existing session on mount
        const initAuth = async () => {
            const token = getAccessToken();
            const cachedUser = getUserProfile();

            if (token && cachedUser) {
                setUser(cachedUser);
            } else if (token) {
                // Token exists but no cached user, fetch profile
                try {
                    const profile = await fetchProfile(token);
                    saveUserProfile(profile);
                    setUser(profile);
                } catch (error) {
                    console.error('Failed to fetch user profile:', error);
                    // Token might be expired, clear it
                    authLogout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, [mounted]);

    const login = () => {
        initiateLogin();
    };

    const logout = () => {
        setUser(null);
        authLogout();
    };

    const refreshUserProfile = async () => {
        const token = getAccessToken();
        if (token) {
            try {
                const profile = await fetchProfile(token);
                saveUserProfile(profile);
                setUser(profile);
            } catch (error) {
                console.error('Failed to refresh user profile:', error);
            }
        }
    };

    // Don't render until mounted to prevent hydration mismatch
    if (!mounted) {
        return null;
    }

    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn: !!user,
            loading,
            login,
            logout,
            refreshUserProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}


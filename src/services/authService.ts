'use client';

// TokenPost OAuth 2.0 Configuration (PRO)
export const OAUTH_CONFIG = {
    CLIENT_ID: 's5ViDSauo8wENm2AgqPK39J2oI13PbVn',
    CLIENT_SECRET: 'xE4mNc8XQBHU3CNWrj3ci9HlFzbHXYdlot73EygyMEg54cKb9uK54X9DE130k08it2heu0B9703Ef701Y6ooOiSK67wrXn0yZ0DaEuG1N1iw3afJtN7QbnLdZm7FTfaa',
    REDIRECT_URI: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
    AUTH_URL: 'https://accounts.tokenpost.kr/login',
    TOKEN_URL: 'https://oapi.tokenpost.kr/oauth/v1/token',
    USER_INFO_URL: 'https://oapi.tokenpost.kr/oauth/v1/userInfo',
    SCOPE: 'email,uid,grade,nickname',
    USER_INFO_SCOPE: 'user.nickname,subscription,grade,point.tpc'
};

// CORS Proxy Helper
const withProxy = (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`;

// PKCE Utilities
const generateRandomString = (length: number): string => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
        result += charset[values[i] % charset.length];
    }
    return result;
};

const pkceChallengeFromVerifier = async (verifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hashed = await window.crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(hashed);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// User Interface
export interface TokenPostUser {
    uid?: string;
    email?: string;
    nickname?: string;
    profile_image?: string;
    grade?: string;
    subscription?: {
        plan?: string;
        status?: string;
    };
    point_tpc?: number;
}

// Auth Service Functions
export const initiateLogin = async () => {
    const state = generateRandomString(16);
    const verifier = generateRandomString(64);

    localStorage.setItem('oauth_state', state);
    localStorage.setItem('oauth_code_verifier', verifier);

    const challenge = await pkceChallengeFromVerifier(verifier);

    const params = new URLSearchParams({
        client_id: OAUTH_CONFIG.CLIENT_ID,
        redirect_uri: OAUTH_CONFIG.REDIRECT_URI,
        scope: OAUTH_CONFIG.SCOPE,
        response_type: 'code',
        state: state,
        code_challenge: challenge,
        code_challenge_method: 'S256'
    });

    window.location.href = `${OAUTH_CONFIG.AUTH_URL}?${params.toString()}`;
};

export const handleCallback = async (code: string, state: string): Promise<{ access_token: string; refresh_token?: string }> => {
    const savedState = localStorage.getItem('oauth_state');
    const verifier = localStorage.getItem('oauth_code_verifier');

    if (state !== savedState) {
        throw new Error('CSRF Warning: State mismatch');
    }

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: OAUTH_CONFIG.CLIENT_ID,
        client_secret: OAUTH_CONFIG.CLIENT_SECRET,
        redirect_uri: OAUTH_CONFIG.REDIRECT_URI,
        code_verifier: verifier || ''
    });

    const response = await fetch(withProxy(OAUTH_CONFIG.TOKEN_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${errorText}`);
    }

    // Cleanup PKCE state
    localStorage.removeItem('oauth_state');
    localStorage.removeItem('oauth_code_verifier');

    return await response.json();
};

export const fetchProfile = async (token: string): Promise<TokenPostUser> => {
    const url = `${OAUTH_CONFIG.USER_INFO_URL}?scope=${encodeURIComponent(OAUTH_CONFIG.USER_INFO_SCOPE)}`;

    const response = await fetch(withProxy(url), {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user profile');
    }

    return await response.json();
};

export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_profile');
    window.location.href = '/';
};

// Storage Helpers
export const saveTokens = (accessToken: string, refreshToken?: string) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
    }
};

export const getAccessToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
};

export const saveUserProfile = (user: TokenPostUser) => {
    localStorage.setItem('user_profile', JSON.stringify(user));
};

export const getUserProfile = (): TokenPostUser | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('user_profile');
    return stored ? JSON.parse(stored) : null;
};

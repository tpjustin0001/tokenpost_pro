'use client';

// TokenPost OAuth 2.0 Configuration (PRO)
export const OAUTH_CONFIG = {
    // 클라이언트 키 (환경변수 우선)
    CLIENT_ID: process.env.NEXT_PUBLIC_TP_CLIENT_ID || 's5ViDSauo8wENm2AgqPK39J2oI13PbVn',
    CLIENT_SECRET: process.env.NEXT_PUBLIC_TP_CLIENT_SECRET || 'xE4mNc8XQBHU3CNWrj3ci9HlFzbHXYdlot73EygyMEg54cKb9uK54X9DE130k08it2heu0B9703Ef701Y6ooOiSK67wrXn0yZ0DaEuG1N1iw3afJtN7QbnLdZm7FTfaa',

    // Callback URL (개발/배포 환경 분기) - 슬래시 없이
    REDIRECT_URI: typeof window !== 'undefined' && window.location.origin.includes('localhost')
        ? 'http://localhost:3000'
        : 'https://pro.tokenpost.kr',

    // 인증 페이지 (www.tokenpost.kr)
    AUTH_URL: 'https://www.tokenpost.kr/oauth/login',

    // API 엔드포인트 (Now using Flask backend proxy to bypass CORS)
    TOKEN_URL: '/api/python/oauth/token',       // Flask proxy endpoint
    USER_INFO_URL: '/api/python/oauth/userinfo', // Flask proxy endpoint

    // [수정됨] 로그인 요청 Scope - TokenPost 설정과 일치
    SCOPE: 'email nickname grade uid point.tpc subscription',

    // UserInfo API Scope - TokenPost API 문서 기준 (user. 접두어 필요)
    USER_INFO_SCOPE: 'user.email,user.nickname,subscription,grade,point.tpc'
};

// No longer using CORS proxy - Flask backend handles it
// const withProxy = (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`;

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

// User Interface - Matches actual API response structure
export interface TokenPostUserResponse {
    user: {
        uuid: string;
        nickname?: string;
        email?: string;
        profile_image?: string;
    };
    grade?: {
        name: string;
        icon_url?: string;
        exp?: number;
    };
    subscription?: {
        plan?: string;
        status?: string;
    };
    point?: {
        tpc?: number;
    };
}

// Flattened user interface for app consumption
export interface TokenPostUser {
    uuid: string;
    nickname?: string;
    email?: string;
    profile_image?: string;
    grade_name?: string;
    grade_icon?: string;
    grade_exp?: number;
    subscription_plan?: string;
    subscription_status?: string;
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

    // Send as JSON to Flask proxy (which will convert to form data for TokenPost API)
    const response = await fetch(OAUTH_CONFIG.TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            client_id: OAUTH_CONFIG.CLIENT_ID,
            client_secret: OAUTH_CONFIG.CLIENT_SECRET,
            redirect_uri: OAUTH_CONFIG.REDIRECT_URI,
            code_verifier: verifier || ''
        })
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

    // Call Flask proxy directly (no CORS wrapper needed)
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('UserInfo API Error:', response.status, errorText);
        throw new Error(`Failed to fetch user profile: ${response.status}`);
    }

    // Parse response
    const data = await response.json();
    console.log('UserInfo API Response:', JSON.stringify(data, null, 2));

    // Handle both nested and flat response structures
    // API might return { user: {...}, grade: {...} } or flat { uuid, nickname, ... }
    const userData = data.user || data;

    // Transform to flat structure with null-safe access
    const user: TokenPostUser = {
        uuid: userData.uuid || userData.uid || '',
        nickname: userData.nickname || '',
        email: userData.email || '',
        profile_image: userData.profile_image || '',
        grade_name: data.grade?.name || userData.grade || '',
        grade_icon: data.grade?.icon_url || '',
        grade_exp: data.grade?.exp || 0,
        // API returns "Plan" with capital P, and "status" as "Y"/"N"
        subscription_plan: data.subscription?.Plan || data.subscription?.plan || '',
        subscription_status: data.subscription?.status || '',  // "Y" = subscribed, "N" = not subscribed
        point_tpc: data.point?.tpc || 0
    };

    console.log('Parsed User:', user);
    return user;
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

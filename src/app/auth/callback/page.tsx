'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleCallback, saveTokens, fetchProfile, saveUserProfile } from '../../../services/authService';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const processCallback = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const error = searchParams.get('error');

            if (error) {
                setStatus('error');
                setErrorMessage(`OAuth Error: ${error}`);
                return;
            }

            if (!code || !state) {
                setStatus('error');
                setErrorMessage('Missing authorization code or state');
                return;
            }

            try {
                // Exchange code for tokens
                const tokens = await handleCallback(code, state);
                saveTokens(tokens.access_token, tokens.refresh_token);

                // Fetch and save user profile
                const profile = await fetchProfile(tokens.access_token);
                saveUserProfile(profile);

                setStatus('success');

                // Redirect to home after short delay
                setTimeout(() => {
                    router.push('/');
                }, 1000);
            } catch (err) {
                console.error('OAuth callback error:', err);
                setStatus('error');
                setErrorMessage(err instanceof Error ? err.message : 'Unknown error occurred');
            }
        };

        processCallback();
    }, [searchParams, router]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)'
        }}>
            {status === 'processing' && (
                <>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
                    <h2>로그인 처리 중...</h2>
                    <p style={{ color: 'var(--text-muted)' }}>잠시만 기다려주세요</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <h2>로그인 성공!</h2>
                    <p style={{ color: 'var(--text-muted)' }}>홈으로 이동합니다...</p>
                </>
            )}

            {status === 'error' && (
                <>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                    <h2>로그인 실패</h2>
                    <p style={{ color: 'var(--accent-red)', marginBottom: '16px' }}>{errorMessage}</p>
                    <button
                        onClick={() => router.push('/')}
                        style={{
                            padding: '12px 24px',
                            background: 'var(--accent-blue)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        홈으로 돌아가기
                    </button>
                </>
            )}
        </div>
    );
}

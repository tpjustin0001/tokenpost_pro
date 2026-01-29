'use client';

import { useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import styles from './LoginGate.module.css';

interface LoginGateProps {
    children: React.ReactNode;
}

export default function LoginGate({ children }: LoginGateProps) {
    const { user, isLoggedIn, loading, login, logout } = useAuth();
    const searchParams = useSearchParams();

    // DEV: Skip login on localhost ONLY in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

    // Allow bypass only if explicitly in DEV mode and on localhost OR capture mode
    const isCaptureMode = searchParams.get('mode') === 'capture';
    const captureKey = searchParams.get('key');
    const isValidCapture = isCaptureMode && captureKey === (process.env.NEXT_PUBLIC_CAPTURE_KEY || 'tokenpost-capture-secret');

    if ((isDev && isLocalhost) || isValidCapture) {
        return <>{children}</>;
    }

    // 1. Show loading spinner
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>로딩 중...</p>
            </div>
        );
    }

    // 2. Check login
    const isValidLogin = isLoggedIn && user && user.uuid;

    if (!isValidLogin) {
        return (
            <div className={styles.gateContainer}>
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.logo}>
                            TokenPost<span>PRO</span>
                            <span className={styles.betaBadge}>BETA</span>
                        </div>
                        <h2 className={styles.modalTitle}>로그인이 필요합니다</h2>
                        <p className={styles.modalDescription}>
                            TokenPost PRO는 프리미엄 암호화폐 분석 서비스입니다.<br />
                            서비스를 이용하시려면 TokenPost 계정으로 로그인해주세요.
                        </p>
                        <button className={styles.loginButton} onClick={login}>
                            TokenPost 계정으로 로그인
                        </button>
                        <p className={styles.signupHint}>
                            아직 계정이 없으신가요?{' '}
                            <a href="https://www.tokenpost.kr/join" target="_blank" rel="noopener noreferrer">
                                회원가입
                            </a>
                        </p>
                    </div >
                </div >
            </div >
        );
    }

    // 3. Check PRO subscription
    // Admin whitelist - always grant PRO access
    const ADMIN_WHITELIST = ['justin@tokenpost.kr'];
    const isWhitelisted = ADMIN_WHITELIST.includes(user.email || '');

    // API returns status: "Y"/"N", Plan: "Plus"/"Free"
    const hasPROAccess = isWhitelisted ||  // 화이트리스트 계정
        user.subscription_status === 'Y' ||  // status가 'Y'면 구독자
        (user.subscription_plan && user.subscription_plan !== 'Free');  // Plan이 Free가 아니면 구독자

    // [Strict Mode] Removed 'user.grade_name' fallback to prevent non-subscribers from entering.

    console.log('[LoginGate] PRO Check:', {
        email: user.email,
        isWhitelisted,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        grade_name: user.grade_name,
        hasPROAccess: !!hasPROAccess
    });

    if (!hasPROAccess) {
        return (
            <div className={styles.gateContainer}>
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.logo}>
                            TokenPost<span>PRO</span>
                        </div>
                        <h2 className={styles.modalTitle}>PRO 구독이 필요합니다</h2>
                        <p className={styles.modalDescription}>
                            안녕하세요, <strong>{user.nickname || user.email}</strong>님!<br />
                            TokenPost PRO는 프리미엄 구독 회원 전용 서비스입니다.
                        </p>
                        <a
                            href="https://www.tokenpost.kr/membership"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.loginButton}
                            style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}
                        >
                            PRO 구독 알아보기
                        </a>
                        <button
                            onClick={logout}
                            className={styles.secondaryButton}
                        >
                            다른 계정으로 로그인
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 4. User has valid login + PRO access
    return <>{children}</>;
}

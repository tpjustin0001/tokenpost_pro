'use client';

import { useAuth } from '../context/AuthContext';
import styles from './LoginGate.module.css';

interface LoginGateProps {
    children: React.ReactNode;
}

export default function LoginGate({ children }: LoginGateProps) {
    const { user, isLoggedIn, loading, login, logout } = useAuth();

    // 1. Show loading spinner while checking auth status
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>로딩 중...</p>
            </div>
        );
    }

    // 2. Check if user is properly logged in (must have valid uuid)
    const isValidLogin = isLoggedIn && user && user.uuid;

    if (!isValidLogin) {
        return (
            <div className={styles.gateContainer}>
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.logo}>
                            TokenPost<span>PRO</span>
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
                    </div>
                </div>
            </div>
        );
    }

    // 3. Check PRO subscription
    // grade_name 있으면 PRO로 간주 (TokenPost에서 등급이 있으면 구독자)
    const hasPROAccess = user.subscription_plan ||
        user.subscription_status === 'active' ||
        user.grade_name;  // 등급이 있으면 구독자로 간주

    console.log('[LoginGate] PRO Check:', {
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        grade_name: user.grade_name,
        hasPROAccess
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
                            href="https://www.tokenpost.kr/pro"
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

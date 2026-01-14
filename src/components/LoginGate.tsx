'use client';

import { useAuth } from '../context/AuthContext';
import styles from './LoginGate.module.css';

interface LoginGateProps {
    children: React.ReactNode;
}

export default function LoginGate({ children }: LoginGateProps) {
    const { isLoggedIn, loading, login } = useAuth();

    // Show loading state
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>로딩 중...</p>
            </div>
        );
    }

    // Not logged in - show login modal ONLY (no content rendered at all)
    if (!isLoggedIn) {
        return (
            <div className={styles.gateContainer}>
                {/* NO CONTENT RENDERED - Cannot bypass with CSS/JS */}
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.logo}>
                            TokenPost<span>PRO</span>
                        </div>
                        <div className={styles.modalIcon}>🔐</div>
                        <h2 className={styles.modalTitle}>로그인이 필요합니다</h2>
                        <p className={styles.modalDescription}>
                            TokenPost PRO는 회원 전용 서비스입니다.<br />
                            로그인하여 프리미엄 크립토 인텔리전스를 이용하세요.
                        </p>
                        <button
                            className={styles.loginButton}
                            onClick={login}
                        >
                            TokenPost 계정으로 로그인
                        </button>
                        <p className={styles.signupHint}>
                            계정이 없으신가요? <a href="https://www.tokenpost.kr/signup" target="_blank" rel="noopener noreferrer">회원가입</a>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Logged in - show content
    return <>{children}</>;
}

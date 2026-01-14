'use client';

import { useAuth } from '../context/AuthContext';
import styles from './LoginGate.module.css';

interface LoginGateProps {
    children: React.ReactNode;
}

export default function LoginGate({ children }: LoginGateProps) {
    // Completely bypass login check for deployment
    return <>{children}</>;
}

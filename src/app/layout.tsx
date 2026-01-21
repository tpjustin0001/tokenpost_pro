import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TokenPost PRO | 한국형 기관급 크립토 터미널",
  description: "글로벌 수준의 크립토 데이터 인텔리전스에 한국 시장의 특수성을 결합한 프리미엄 터미널",
  keywords: ["crypto", "bitcoin", "김치프리미엄", "암호화폐", "터미널", "tokenpost"],
  icons: {
    icon: 'https://s1.tokenpost.kr/assets/images/tokenpost/common/faviconV2.ico',
    apple: 'https://s1.tokenpost.kr/assets/images/tokenpost/common/faviconV2.ico',
  },
};

import { XRayProvider } from '@/context/XRayContext';
import { AnalyticsProvider } from '@/context/AnalyticsProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning={true}>
        <a href="#main-content" className="skip-to-content">
          메인 콘텐츠로 건너뛰기
        </a>
        <ThemeProvider>
          <AuthProvider>
            <AnalyticsProvider>
              {/* Header removed - logout now in Sidebar */}
              <XRayProvider>
                <div className="page-wrapper">
                  {children}
                </div>
              </XRayProvider>
            </AnalyticsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

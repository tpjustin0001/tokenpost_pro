import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <div className="page-wrapper">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

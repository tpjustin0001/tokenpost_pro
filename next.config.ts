import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '/coins/**',
      },
      {
        protocol: 'https',
        hostname: 'www.cryptocompare.com',
        pathname: '/media/**',
      },
    ],
  },
  async rewrites() {
    // REWRITE: Vercel Frontend -> Render/Railway Backend
    // Default to Localhost in Development, Railway in Production
    let backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      if (process.env.NODE_ENV === 'development') {
        backendUrl = 'http://127.0.0.1:5001';
      } else {
        backendUrl = 'https://tokenpostpro-production.up.railway.app';
      }
    }

    // Ensure protocol exists (Fix for Vercel Build Error)
    if (!backendUrl.startsWith('http')) {
      backendUrl = `https://${backendUrl}`;
    }

    console.log('[Next.js Rewrite] Proxying /api/python to:', backendUrl);

    return [
      {
        source: '/api/python/:path*', // Frontend calls /api/python/crypto...
        destination: `${backendUrl}/api/:path*`, // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;

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
    // Default to Railway if env var is missing (e.g. Local Dev)
    let backendUrl = process.env.BACKEND_URL || 'https://tokenpostpro-production.up.railway.app';

    // Ensure protocol exists (Fix for Vercel Build Error)
    if (!backendUrl.startsWith('http')) {
      backendUrl = `https://${backendUrl}`;
    }

    return [
      {
        source: '/api/python/:path*', // Frontend calls /api/python/crypto...
        destination: `${backendUrl}/api/:path*`, // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;

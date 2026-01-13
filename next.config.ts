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
    // REWRITE: Vercel Frontend -> Render Backend (Production & Dev)
    const backendUrl = process.env.BACKEND_URL || 'https://tokenpost-pro.onrender.com';
    return [
      {
        source: '/api/python/:path*', // Frontend calls /api/python/crypto...
        destination: `${backendUrl}/api/:path*`, // Proxy to Render /api/crypto...
      },
    ];
  },
};

export default nextConfig;

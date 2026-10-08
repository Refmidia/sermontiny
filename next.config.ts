import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['mysql2'],
  experimental: {
    // A Vercel recusa requisições acima de 4,5 MB.
    serverActions: { bodySizeLimit: '4mb' },
  },
};

export default nextConfig;

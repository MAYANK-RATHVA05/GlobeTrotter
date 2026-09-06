import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Ensure server-only packages are not bundled for client
  serverExternalPackages: ['mysql2', 'bcryptjs', 'jsonwebtoken'],
};

export default nextConfig;

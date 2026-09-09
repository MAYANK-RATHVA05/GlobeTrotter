import type { NextConfig } from 'next';
const nextConfig: NextConfig = { reactStrictMode: true, serverExternalPackages: ['mongoose', 'bcryptjs', 'jsonwebtoken'] };
export default nextConfig;

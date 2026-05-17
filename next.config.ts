import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Supabase storage and common hotel/map CDNs
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google OAuth profile pics
    ],
  },

  // Silence noisy hydration logs in production
  reactStrictMode: true,
};

export default nextConfig;

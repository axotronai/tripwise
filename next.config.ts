import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Allow images from Supabase storage and common hotel/map CDNs
  images: {
    remotePatterns: [
      // Restrict to exact Supabase project — not a wildcard
      { protocol: 'https', hostname: 'yddexbtyehryrhyqfgtl.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google OAuth profile pics
    ],
  },

  reactStrictMode: true,

  // ─── Security headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
          // Isolate browsing context (prevents Spectre-class side-channel attacks)
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
          // Restrict cross-origin resource sharing
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
          // Stop MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Enable browser XSS filter (legacy browsers)
          { key: 'X-XSS-Protection',       value: '1; mode=block' },
          // Force HTTPS for 1 year (enable in production)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // Limit referrer leakage
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          // Restrict powerful browser APIs
          {
            key:   'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=()',
          },
          // Basic CSP — allows Supabase, Google Fonts, Leaflet tiles, Groq
          // Tighten further once you know all third-party hosts
          {
            key:   'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + inline (needed for Next.js hydration) + eval for maps + TravelPayouts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://tp-em.com",
              // Styles: self + inline (Tailwind)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + Supabase + Unsplash + Google + tile servers
              "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://lh3.googleusercontent.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
              // API calls: self + Supabase + Amadeus + RapidAPI + Groq + OpenMeteo + TravelPayouts
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://test.api.amadeus.com https://irctc1.p.rapidapi.com https://api.groq.com https://api.open-meteo.com https://tp-em.com https://*.travelpayouts.com",
              // Frames: none
              "frame-src 'none'",
              // Workers (Next.js service worker)
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default withBundleAnalyzer(nextConfig);

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ServiceWorkerRegistrar from "@/components/layout/ServiceWorkerRegistrar";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://axozen.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'TripWise — AI Trip Planner for India',
    template: '%s | TripWise',
  },
  description: 'Plan your perfect India trip with AI. Build day-by-day itineraries, search trains & flights, compare hotels, and track budget in INR — all free.',
  keywords: ['India trip planner', 'travel itinerary', 'train booking', 'flight search', 'hotel search', 'budget tracker', 'AI travel'],
  authors: [{ name: 'TripWise' }],
  creator: 'TripWise',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TripWise',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: BASE_URL,
    siteName: 'TripWise',
    title: 'TripWise — AI Trip Planner for India',
    description: 'Plan your perfect India trip with AI. Free day-by-day itineraries, train & flight search, hotel finder, and budget tracking.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TripWise — AI Trip Planner for India',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TripWise — AI Trip Planner for India',
    description: 'Plan your perfect India trip with AI. Free itineraries, train & flight search, hotel finder.',
    images: ['/og-image.png'],
    creator: '@tripwisein',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

const LD_ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TripWise',
  url: BASE_URL,
  logo: `${BASE_URL}/icon-512.png`,
  sameAs: ['https://twitter.com/tripwisein'],
}

const LD_WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'TripWise',
  url: BASE_URL,
  inLanguage: 'en-IN',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${BASE_URL}/destinations/{search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://tp-em.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(LD_ORGANIZATION) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(LD_WEBSITE) }}
        />
      </head>
      <body className={`${inter.className} min-h-full flex flex-col bg-gray-50`}>
        {/* TravelPayouts affiliate tracking — fires on every page */}
        <Script
          id="travelpayouts-tracker"
          src="https://tp-em.com/NTMwMjE2.js?t=530216"
          strategy="afterInteractive"
        />
        <ServiceWorkerRegistrar />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

import type { Metadata } from 'next'
import HomePageClient from './HomePageClient'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://axozen.com'

export const metadata: Metadata = {
  title: 'TripWise — Free AI Trip Planner for India | Itinerary, Trains & Hotels',
  description:
    'Plan your perfect India trip in minutes. AI builds a complete day-by-day itinerary with trains, flights, hotels, and budget tracker — 100% free. Goa, Manali, Kerala, Ladakh & more.',
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: BASE_URL,
    siteName: 'TripWise',
    title: 'TripWise — Free AI Trip Planner for India',
    description:
      'AI builds your complete India itinerary — trains, hotels, budget, map — all in one place. 100% free.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'TripWise — AI Trip Planner for India',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TripWise — Free AI Trip Planner for India',
    description: 'AI-powered itineraries, train search, hotel finder & INR budget tracker. Free forever.',
    images: [`${BASE_URL}/og-image.png`],
    creator: '@tripwisein',
  },
}

export default function HomePage() {
  return <HomePageClient />
}

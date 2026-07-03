import type { Metadata } from 'next'
import HotelsClient from './HotelsClient'

export const metadata: Metadata = {
  title: 'Hotel Price Comparison India — Compare Booking.com, Agoda, MakeMyTrip',
  description: 'Compare hotel prices across Booking.com, Agoda, Hotels.com and MakeMyTrip side by side. Find the cheapest hotel for your India trip in seconds.',
  keywords: ['hotel price comparison India', 'cheapest hotels India', 'hotel booking comparison', 'compare hotels Goa Manali Jaipur'],
  openGraph: {
    title: 'Compare Hotel Prices — TripWise India',
    description: 'Find the cheapest hotel across 5+ booking sites instantly.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function HotelsPage() {
  return <HotelsClient />
}

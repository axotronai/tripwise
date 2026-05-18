import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://axozen.com'

// Popular Indian destinations for static sitemap entries
const POPULAR_DESTINATIONS = [
  'goa', 'manali', 'jaipur', 'kerala', 'ladakh', 'rishikesh', 'agra', 'mumbai',
  'delhi', 'bangalore', 'hyderabad', 'pune', 'kolkata', 'varanasi', 'udaipur',
  'shimla', 'ooty', 'darjeeling', 'andaman', 'coorg', 'hampi', 'mysore',
  'amritsar', 'jodhpur', 'pushkar', 'jim-corbett', 'ranthambore', 'kashmir',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                        lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/destinations`,      lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/trains`,            lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/packing-list`,      lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/login`,             lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const destinationPages: MetadataRoute.Sitemap = POPULAR_DESTINATIONS.map(slug => ({
    url:             `${BASE_URL}/destinations/${slug}`,
    lastModified:    now,
    changeFrequency: 'weekly',
    priority:        0.8,
  }))

  return [...staticPages, ...destinationPages]
}

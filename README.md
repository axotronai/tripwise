# TripWise — India Vacation Planner

> Stop juggling IRCTC, MakeMyTrip, Google Maps, and spreadsheets. Plan your entire India trip in one place — free.

## Features
- **Multi-day itinerary builder** — drag-and-drop activities across days
- **AI itinerary generation** — Groq (Llama 3.3) generates a full plan in seconds
- **Train, flight & bus search** — with price filters and sorting
- **Hotel search** — with rating, price, and location filters
- **Interactive map** — OpenStreetMap + Leaflet, free forever
- **INR budget tracker** — per-day breakdown with over-budget alerts
- **Weather widget** — 7-day forecast at your destination

## Quick Start

```bash
npm install
cp .env.local .env.local.example   # copy env template
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **No API keys needed to explore the UI** — app runs in demo mode automatically.

## Environment Variables

```bash
# .env.local

# Supabase — free at supabase.com
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Groq AI — free at console.groq.com
GROQ_API_KEY=your_groq_key

# Amadeus flights — free at developers.amadeus.com
AMADEUS_CLIENT_ID=your_client_id
AMADEUS_CLIENT_SECRET=your_client_secret
```

## Database Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. SQL Editor → paste `src/lib/supabase/schema.sql` → Run

## Tech Stack

| Layer | Tech | Cost |
|---|---|---|
| Framework | Next.js 15 App Router | Free |
| Styling | Tailwind CSS v4 + shadcn/ui | Free |
| Database + Auth | Supabase | Free tier |
| AI | Groq — Llama 3.3 70B | Free tier |
| Maps | Leaflet.js + OpenStreetMap | Free forever |
| Flights | Amadeus Dev API | Free sandbox |
| Weather | Open-Meteo | Free forever |
| State | Zustand | Free |

**Total monthly cost at MVP scale: ₹0**

## Project Structure

```
src/
├── app/
│   ├── (marketing)/      # Homepage (public)
│   ├── (app)/            # Dashboard + Trip builder (app)
│   └── api/              # All API routes
├── components/
│   ├── ui/               # shadcn/ui base (don't edit)
│   ├── layout/           # Navbar, Footer, MobileNav
│   ├── trip/             # Itinerary builder
│   ├── map/              # Leaflet map
│   ├── budget/           # Budget tracker
│   ├── transport/        # Train/flight/bus search
│   └── hotel/            # Hotel search
├── hooks/                # useTrip, useWeather, useTransport
├── lib/
│   ├── supabase/         # DB client + schema.sql
│   └── utils/            # formatINR, generateDays, etc.
├── store/                # Zustand (tripStore)
└── types/                # Shared TypeScript types
```

## Scripts

```bash
npm run dev      # Dev server — localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

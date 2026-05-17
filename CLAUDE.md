# TripWise — Claude Code Guide

## What This Project Is
India-first all-in-one trip planner. Users create multi-day trips, drag-drop activities, search trains/flights/hotels, track budgets in INR, and generate AI itineraries — all free.

## Tech Stack
- **Next.js 15** App Router + Turbopack
- **Tailwind CSS v4** + **shadcn/ui**
- **Supabase** — PostgreSQL, Auth, RLS
- **Groq API** — Llama 3.3 70B (free tier)
- **Leaflet.js + OpenStreetMap** — maps, free forever
- **Zustand** — client state

## Key Conventions

### Maps always need dynamic import
```tsx
const TripMap = dynamic(() => import('@/components/map/TripMap'), { ssr: false })
```

### Supabase: server vs client
```ts
import { createClient } from '@/lib/supabase/server'  // API routes, Server Components
import { createClient } from '@/lib/supabase/client'  // Client Components only
```

### Currency — always formatINR()
```ts
import { formatINR } from '@/lib/utils/trip'
formatINR(1500) // "₹1,500"
```

### useSearchParams needs Suspense boundary
Any page using useSearchParams() must be wrapped in `<Suspense>`.

### Demo mode fallback
API routes return mock data if Supabase isn't configured. Never crash the UI.

## Folder Map
```
app/(marketing)/     Homepage — public
app/(app)/           Trip builder + dashboard
app/api/             trips CRUD, AI, transport, hotels
components/ui/       shadcn base — do not edit
components/layout/   Navbar, Footer, MobileNav
components/trip/     DayColumn, ActivityCard, AddActivityModal
components/map/      TripMap (Leaflet, client-only)
components/budget/   BudgetTracker
components/transport/ TransportSearch
components/hotel/    HotelSearch
hooks/               useTrip, useWeather, useTransport
lib/supabase/        client.ts, server.ts, schema.sql
lib/utils/trip.ts    formatINR, generateDays, calcBudgetBreakdown
store/tripStore.ts   Zustand store
types/index.ts       All shared TypeScript types
```

## Database
Run `src/lib/supabase/schema.sql` in Supabase SQL editor once.
Tables: trips → itinerary_days → activities (cascade). Also: transports, hotels, expenses.

## Build
```bash
npm run dev     # localhost:3000
npm run build   # must pass before deploying
```

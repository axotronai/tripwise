-- Run this in your Supabase SQL Editor to update RLS policies
-- Safe to run even if you already ran schema.sql

-- Add children column if it doesn't exist yet
alter table public.trips add column if not exists children int not null default 0;

-- Add day_id and extra metadata columns to hotels for per-day tracking
alter table public.hotels add column if not exists day_id text;
alter table public.hotels add column if not exists external_id text;
alter table public.hotels add column if not exists hotel_type text;
alter table public.hotels add column if not exists amenities text;

-- Drop old restrictive policies
drop policy if exists "Users own their trips" on public.trips;
drop policy if exists "Users own their days" on public.itinerary_days;
drop policy if exists "Users own their activities" on public.activities;

-- Drop any duplicate new policies before re-creating
drop policy if exists "Public read trips" on public.trips;
drop policy if exists "Users manage their trips" on public.trips;
drop policy if exists "Public read days" on public.itinerary_days;
drop policy if exists "Users manage their days" on public.itinerary_days;
drop policy if exists "Public read activities" on public.activities;
drop policy if exists "Users manage their activities" on public.activities;

-- Fix RLS for hotels to support guests
drop policy if exists "Users own their hotels" on public.hotels;
drop policy if exists "Public read hotels" on public.hotels;
drop policy if exists "Users manage their hotels" on public.hotels;
create policy "Public read hotels" on public.hotels for select using (true);
create policy "Users manage their hotels" on public.hotels for all using (
  exists (select 1 from public.trips where id = trip_id and (user_id = auth.uid() or user_id = '00000000-0000-0000-0000-000000000000'::uuid))
);

-- Fix RLS for transports to support guests
drop policy if exists "Users own their transports" on public.transports;
drop policy if exists "Public read transports" on public.transports;
drop policy if exists "Users manage their transports" on public.transports;
create policy "Public read transports" on public.transports for select using (true);
create policy "Users manage their transports" on public.transports for all using (
  exists (select 1 from public.trips where id = trip_id and (user_id = auth.uid() or user_id = '00000000-0000-0000-0000-000000000000'::uuid))
);

-- Trips: anyone can read by ID (trip sharing), owner or guest can write
create policy "Public read trips" on public.trips
  for select using (true);

create policy "Users manage their trips" on public.trips
  for all using (
    auth.uid() = user_id
    or user_id = '00000000-0000-0000-0000-000000000000'::uuid
  );

-- Itinerary days: public read, owner/guest write
create policy "Public read days" on public.itinerary_days
  for select using (true);

create policy "Users manage their days" on public.itinerary_days
  for all using (
    exists (
      select 1 from public.trips
      where id = trip_id
        and (user_id = auth.uid() or user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    )
  );

-- Activities: public read, owner/guest write
create policy "Public read activities" on public.activities
  for select using (true);

create policy "Users manage their activities" on public.activities
  for all using (
    exists (
      select 1 from public.itinerary_days d
      join public.trips t on t.id = d.trip_id
      where d.id = day_id
        and (t.user_id = auth.uid() or t.user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    )
  );

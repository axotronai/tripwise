-- Run this in your Supabase SQL editor

create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  destination text not null,
  start_city text not null,
  start_date date not null,
  end_date date not null,
  total_days int not null,
  total_budget numeric not null default 0,
  travel_style text not null default 'comfort',
  group_size int not null default 1,
  children int not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.itinerary_days (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  day_number int not null,
  date date not null,
  city text not null,
  daily_budget numeric default 0,
  notes text
);

create table if not exists public.activities (
  id uuid default gen_random_uuid() primary key,
  day_id uuid references public.itinerary_days(id) on delete cascade not null,
  name text not null,
  description text,
  start_time text not null,
  end_time text not null,
  cost numeric default 0,
  type text not null default 'sightseeing',
  location text,
  lat numeric,
  lng numeric,
  order_index int not null default 0,
  is_free boolean default false
);

create table if not exists public.transports (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  mode text not null,
  from_city text not null,
  to_city text not null,
  departure timestamptz not null,
  arrival timestamptz not null,
  duration text not null,
  cost numeric not null default 0,
  operator text,
  booking_ref text
);

create table if not exists public.hotels (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  name text not null,
  city text not null,
  checkin date not null,
  checkout date not null,
  cost_per_night numeric not null default 0,
  total_cost numeric not null default 0,
  rating numeric,
  lat numeric,
  lng numeric
);

create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  category text not null,
  amount numeric not null,
  note text,
  date date not null default current_date
);

-- Row Level Security
alter table public.trips enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.activities enable row level security;
alter table public.transports enable row level security;
alter table public.hotels enable row level security;
alter table public.expenses enable row level security;

-- Trips: owner-only read + write (demo UUID always accessible for dev mode)
create policy "Users read own trips" on public.trips for select using (
  auth.uid() = user_id or user_id = '00000000-0000-0000-0000-000000000000'::uuid
);
create policy "Users manage their trips" on public.trips for all using (
  auth.uid() = user_id or user_id = '00000000-0000-0000-0000-000000000000'::uuid
);

-- Days: owner-only read + write
create policy "Users read own days" on public.itinerary_days for select using (
  exists (select 1 from public.trips where id = trip_id and (user_id = auth.uid() or user_id = '00000000-0000-0000-0000-000000000000'::uuid))
);
create policy "Users manage their days" on public.itinerary_days for all using (
  exists (select 1 from public.trips where id = trip_id and (user_id = auth.uid() or user_id = '00000000-0000-0000-0000-000000000000'::uuid))
);

-- Activities: owner-only read + write
create policy "Users read own activities" on public.activities for select using (
  exists (select 1 from public.itinerary_days d join public.trips t on t.id = d.trip_id where d.id = day_id and (t.user_id = auth.uid() or t.user_id = '00000000-0000-0000-0000-000000000000'::uuid))
);
create policy "Users manage their activities" on public.activities for all using (
  exists (select 1 from public.itinerary_days d join public.trips t on t.id = d.trip_id where d.id = day_id and (t.user_id = auth.uid() or t.user_id = '00000000-0000-0000-0000-000000000000'::uuid))
);

create policy "Users own their transports" on public.transports for all using (
  exists (select 1 from public.trips where id = trip_id and user_id = auth.uid())
);
create policy "Users own their hotels" on public.hotels for all using (
  exists (select 1 from public.trips where id = trip_id and user_id = auth.uid())
);
create policy "Users own their expenses" on public.expenses for all using (
  exists (select 1 from public.trips where id = trip_id and user_id = auth.uid())
);

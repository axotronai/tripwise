export type TravelStyle = 'budget' | 'comfort' | 'luxury' | 'adventure' | 'family'
export type TransportMode = 'train' | 'flight' | 'bus' | 'cab'
export type ActivityType = 'sightseeing' | 'food' | 'adventure' | 'culture' | 'beach' | 'shopping' | 'rest'

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  travel_style?: TravelStyle
  home_city?: string
}

export interface Trip {
  id: string
  user_id: string
  title: string
  destination: string
  start_city: string
  start_date: string
  end_date: string
  total_days: number
  total_budget: number
  travel_style: TravelStyle
  group_size: number
  created_at: string
  days?: ItineraryDay[]
  budget_breakdown?: BudgetBreakdown
}

export interface ItineraryDay {
  id: string
  trip_id: string
  day_number: number
  date: string
  city: string
  activities: Activity[]
  daily_budget: number
  notes?: string
}

export interface Activity {
  id: string
  day_id: string
  name: string
  description?: string
  start_time: string
  end_time: string
  cost: number
  type: ActivityType
  location?: string
  lat?: number
  lng?: number
  order_index: number
  is_free: boolean
}

export interface Transport {
  id: string
  trip_id: string
  mode: TransportMode
  from_city: string
  to_city: string
  departure: string
  arrival: string
  duration: string
  cost: number
  operator?: string
  booking_ref?: string
}

export interface Hotel {
  id: string
  trip_id: string
  name: string
  city: string
  checkin: string
  checkout: string
  cost_per_night: number
  total_cost: number
  rating?: number
  lat?: number
  lng?: number
}

export interface BudgetBreakdown {
  total: number
  transport: number
  hotels: number
  food: number
  activities: number
  buffer: number
  spent: number
}

export interface Expense {
  id: string
  trip_id: string
  category: 'transport' | 'hotel' | 'food' | 'activity' | 'other'
  amount: number
  note?: string
  date: string
}

export interface PriceFilter {
  min: number
  max: number
  modes?: TransportMode[]
  types?: string[]
  min_rating?: number
}

export interface SearchResult {
  flights: FlightOption[]
  trains: TrainOption[]
  buses: BusOption[]
}

export interface FlightOption {
  id: string
  airline: string
  flight_number: string
  departure: string
  arrival: string
  duration: string
  price: number
  stops: number
}

export interface TrainOption {
  id: string
  train_name: string
  train_number: string
  departure: string
  arrival: string
  duration: string
  price: number
  class: string
  available_seats: number
}

export interface BusOption {
  id: string
  operator: string
  departure: string
  arrival: string
  duration: string
  price: number
  bus_type: string
}

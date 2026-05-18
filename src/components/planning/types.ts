export interface WizardTransport {
  mode: 'train' | 'flight' | 'bus' | 'cab'
  operator: string
  name: string
  number?: string
  departure: string
  arrival: string
  duration: string
  cost_per_person: number
  class?: string
  highlights?: string
  book_at?: string
}

export interface TripLeg {
  id: string
  from: string
  to: string
  nights: number                  // nights spent in `to` city
  transport: WizardTransport | null
  loadingTransport: boolean
}

export interface WizardHotel {
  name: string
  area: string
  rating: number
  cost_per_night: number
  amenities: string[]
  highlights: string
  map_url?: string
}

export interface WizardPlace {
  name: string
  type: string
  area: string
  description: string
  why_visit: string
  entry_fee: number
  is_free: boolean
  duration_hours: number
  best_time: string
  rating: number
  location: string
  is_must_visit?: boolean
}

export interface WizardRestaurant {
  name: string
  area: string
  cuisine: string
  is_veg: boolean
  is_jain_friendly: boolean
  cost_for_two: number
  must_try: string
  description: string
  open_hours: string
  rating: number
}

// One derived "day plan" computed from legs
export interface DayPlan {
  dayNumber: number
  date: string
  city: string
  isArrivalDay: boolean
  isDepartureDay: boolean
  legId?: string                  // which leg's transport applies
}

export type WizardStep = 1 | 2 | 3 | 4

export interface WizardState {
  legs: TripLeg[]
  hotelByCity: Record<string, WizardHotel | null>
  placesByDay: Record<number, WizardPlace[]>        // dayNumber → places
  restaurantsByDay: Record<number, WizardRestaurant[]>
}

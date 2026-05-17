import { addDays, format, differenceInDays } from 'date-fns'
import { ItineraryDay, BudgetBreakdown, TravelStyle } from '@/types'

export function generateDays(startDate: string, endDate: string, destination: string): Omit<ItineraryDay, 'id' | 'trip_id'>[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const totalDays = differenceInDays(end, start) + 1

  return Array.from({ length: totalDays }, (_, i) => ({
    day_number: i + 1,
    date: format(addDays(start, i), 'yyyy-MM-dd'),
    city: destination,
    activities: [],
    daily_budget: 0,
  }))
}

export function calcBudgetBreakdown(totalBudget: number, style: TravelStyle, days: number, groupSize: number): BudgetBreakdown {
  const allocations = {
    budget: { transport: 0.25, hotels: 0.30, food: 0.25, activities: 0.10, buffer: 0.10 },
    comfort: { transport: 0.25, hotels: 0.35, food: 0.20, activities: 0.12, buffer: 0.08 },
    luxury: { transport: 0.20, hotels: 0.45, food: 0.18, activities: 0.12, buffer: 0.05 },
    adventure: { transport: 0.30, hotels: 0.20, food: 0.20, activities: 0.22, buffer: 0.08 },
    family: { transport: 0.25, hotels: 0.38, food: 0.22, activities: 0.10, buffer: 0.05 },
  }
  const alloc = allocations[style]
  return {
    total: totalBudget,
    transport: Math.round(totalBudget * alloc.transport),
    hotels: Math.round(totalBudget * alloc.hotels),
    food: Math.round(totalBudget * alloc.food),
    activities: Math.round(totalBudget * alloc.activities),
    buffer: Math.round(totalBudget * alloc.buffer),
    spent: 0,
  }
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export function getTripDuration(startDate: string, endDate: string): number {
  return differenceInDays(new Date(endDate), new Date(startDate)) + 1
}

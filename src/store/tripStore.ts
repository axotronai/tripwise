import { create }  from 'zustand'
import { persist }  from 'zustand/middleware'
import { Trip, ItineraryDay, Activity, BudgetBreakdown } from '@/types'

interface TripStore {
  currentTrip: Trip | null
  days: ItineraryDay[]
  budgetBreakdown: BudgetBreakdown | null

  setCurrentTrip: (trip: Trip) => void
  setDays: (days: ItineraryDay[]) => void
  addActivity: (dayId: string, activity: Activity) => void
  updateActivity: (dayId: string, activity: Activity) => void
  removeActivity: (dayId: string, activityId: string) => void
  reorderActivities: (dayId: string, activities: Activity[]) => void
  moveActivity: (fromDayId: string, toDayId: string, activity: Activity) => void
  setBudgetBreakdown: (breakdown: BudgetBreakdown) => void
  reset: () => void
}

export const useTripStore = create<TripStore>()(
  persist(
    (set) => ({
      currentTrip:    null,
      days:           [],
      budgetBreakdown: null,

      setCurrentTrip: (trip) => set({ currentTrip: trip }),
      setDays: (days) => set({ days }),

      addActivity: (dayId, activity) =>
        set((state) => ({
          days: state.days.map((day) =>
            day.id === dayId ? { ...day, activities: [...day.activities, activity] } : day
          ),
        })),

      updateActivity: (dayId, activity) =>
        set((state) => ({
          days: state.days.map((day) =>
            day.id === dayId
              ? { ...day, activities: day.activities.map((a) => (a.id === activity.id ? activity : a)) }
              : day
          ),
        })),

      removeActivity: (dayId, activityId) =>
        set((state) => ({
          days: state.days.map((day) =>
            day.id === dayId
              ? { ...day, activities: day.activities.filter((a) => a.id !== activityId) }
              : day
          ),
        })),

      reorderActivities: (dayId, activities) =>
        set((state) => ({
          days: state.days.map((day) => (day.id === dayId ? { ...day, activities } : day)),
        })),

      moveActivity: (fromDayId, toDayId, activity) =>
        set((state) => ({
          days: state.days.map((day) => {
            if (day.id === fromDayId) return { ...day, activities: day.activities.filter((a) => a.id !== activity.id) }
            if (day.id === toDayId) return { ...day, activities: [...day.activities, { ...activity, day_id: toDayId, order_index: day.activities.length }] }
            return day
          }),
        })),

      setBudgetBreakdown: (breakdown) => set({ budgetBreakdown: breakdown }),
      reset: () => set({ currentTrip: null, days: [], budgetBreakdown: null }),
    }),
    {
      name: 'tripwise-store',
      // Only persist the draft days (for drag-drop reordering across refreshes).
      // currentTrip is always re-fetched from the server on page load.
      // budgetBreakdown is derived — no need to persist it.
      partialize: (state) => ({
        days:        state.days,
        currentTrip: state.currentTrip,
      }),
    }
  )
)

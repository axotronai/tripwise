'use client'

import { IndianRupee, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { BudgetBreakdown, ItineraryDay } from '@/types'
import { formatINR } from '@/lib/utils/trip'

interface Props {
  breakdown: BudgetBreakdown
  days: ItineraryDay[]
}

const CATEGORIES = [
  { key: 'transport', label: 'Transport', emoji: '🚆', color: 'bg-blue-500' },
  { key: 'hotels', label: 'Hotels', emoji: '🏨', color: 'bg-purple-500' },
  { key: 'food', label: 'Food', emoji: '🍽️', color: 'bg-orange-500' },
  { key: 'activities', label: 'Activities', emoji: '🎯', color: 'bg-green-500' },
  { key: 'buffer', label: 'Buffer', emoji: '🛡️', color: 'bg-gray-400' },
] as const

export default function BudgetTracker({ breakdown, days }: Props) {
  const activitySpend = days.reduce((sum, day) =>
    sum + day.activities.reduce((s, a) => s + (a.is_free ? 0 : a.cost), 0), 0
  )
  const totalSpent = activitySpend
  const remaining = breakdown.total - totalSpent
  const pctSpent = Math.min(100, (totalSpent / breakdown.total) * 100)
  const isOverBudget = totalSpent > breakdown.total

  const dailyCosts = days.map((day) => ({
    day: day.day_number,
    date: day.date,
    city: day.city,
    cost: day.activities.reduce((s, a) => s + (a.is_free ? 0 : a.cost), 0),
    budget: breakdown.total / days.length,
  }))

  return (
    <div className="space-y-4">
      {/* Overview card */}
      <Card className={`border-2 ${isOverBudget ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">{formatINR(breakdown.total)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Remaining</p>
              <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                {isOverBudget ? '-' : ''}{formatINR(Math.abs(remaining))}
              </p>
            </div>
          </div>
          <Progress value={pctSpent} className="h-3 mb-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Spent: {formatINR(totalSpent)}</span>
            <span>{pctSpent.toFixed(0)}% used</span>
          </div>
          {isOverBudget && (
            <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4" /> Over budget by {formatINR(Math.abs(remaining))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">Budget Allocation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CATEGORIES.map(({ key, label, emoji, color }) => {
            const allocated = breakdown[key]
            const pct = breakdown.total > 0 ? Math.round((allocated / breakdown.total) * 100) : 0
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1.5">
                    <span>{emoji}</span>
                    <span className="text-gray-700">{label}</span>
                  </span>
                  <span className="font-medium">{formatINR(allocated)} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Per-day breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">Daily Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {dailyCosts.map(({ day, city, cost, budget }) => {
            const over = cost > budget
            return (
              <div key={day} className={`flex items-center justify-between p-2.5 rounded-lg ${over ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${over ? 'bg-red-200 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    D{day}
                  </span>
                  <span className="text-xs text-gray-600">{city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${over ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatINR(cost)}
                  </span>
                  {over
                    ? <Badge variant="destructive" className="text-xs py-0">Over</Badge>
                    : cost === 0
                      ? <Badge variant="outline" className="text-xs py-0 text-gray-400">Empty</Badge>
                      : <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  }
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

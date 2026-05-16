'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Calendar, IndianRupee, Users, ArrowRight, ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { TravelStyle } from '@/types'
import { formatINR, getTripDuration } from '@/lib/utils/trip'

const TRAVEL_STYLES: { value: TravelStyle; label: string; emoji: string; desc: string }[] = [
  { value: 'budget', label: 'Budget', emoji: '🎒', desc: 'Hostels, street food, local transport' },
  { value: 'comfort', label: 'Comfort', emoji: '🏨', desc: '3-star hotels, mix of transport' },
  { value: 'luxury', label: 'Luxury', emoji: '✨', desc: '5-star, flights, fine dining' },
  { value: 'adventure', label: 'Adventure', emoji: '🧗', desc: 'Camping, treks, outdoor activities' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧', desc: 'Family-friendly, comfort + safety' },
]

const POPULAR_DESTINATIONS = [
  'Goa', 'Manali', 'Jaipur', 'Kerala', 'Ladakh', 'Andaman',
  'Varanasi', 'Rishikesh', 'Coorg', 'Ooty', 'Shimla', 'Mumbai',
]

const steps = ['Destination', 'Dates & Group', 'Budget & Style']

function NewTripForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    destination: searchParams.get('destination') || '',
    start_city: '',
    start_date: '',
    end_date: '',
    group_size: 1,
    total_budget: 20000,
    travel_style: 'comfort' as TravelStyle,
  })

  const duration = form.start_date && form.end_date ? getTripDuration(form.start_date, form.end_date) : 0

  async function handleSubmit() {
    if (!form.destination || !form.start_date || !form.end_date || !form.start_city) {
      toast.error('Please fill all fields')
      return
    }
    if (duration < 1) {
      toast.error('End date must be after start date')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, total_days: duration }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Trip created!')
      router.push(`/trips/${data.id}`)
    } catch {
      toast.error('Failed to create trip. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  i <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>{i + 1}</div>
                <span className={`text-sm hidden sm:block ${i <= step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{s}</span>
                {i < steps.length - 1 && <div className={`h-0.5 w-16 mx-2 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            {/* Step 1: Destination */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex bg-blue-100 p-3 rounded-2xl mb-4">
                    <MapPin className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Where are you going?</h2>
                  <p className="text-gray-500 mt-1">Choose your destination in India</p>
                </div>
                <div className="space-y-2">
                  <Label>From (Starting City)</Label>
                  <Input placeholder="e.g. Delhi, Mumbai, Bangalore" value={form.start_city} onChange={(e) => setForm({ ...form, start_city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Input placeholder="e.g. Goa, Manali, Kerala" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-3">Popular destinations</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_DESTINATIONS.map((d) => (
                      <Badge
                        key={d}
                        variant={form.destination === d ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => setForm({ ...form, destination: d })}
                      >{d}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Dates & Group */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex bg-blue-100 p-3 rounded-2xl mb-4">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">When & with whom?</h2>
                  <p className="text-gray-500 mt-1">Set your travel dates and group size</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={form.start_date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={form.end_date} min={form.start_date || new Date().toISOString().split('T')[0]} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                  </div>
                </div>
                {duration > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <span className="text-blue-700 font-semibold text-lg">{duration} day{duration > 1 ? 's' : ''} trip</span>
                    <span className="text-blue-500 text-sm ml-2">to {form.destination}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Group Size</Label>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => setForm({ ...form, group_size: Math.max(1, form.group_size - 1) })}>-</Button>
                    <div className="flex items-center gap-2 text-lg font-semibold w-20 justify-center">
                      <Users className="h-5 w-5 text-blue-500" />{form.group_size}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setForm({ ...form, group_size: Math.min(20, form.group_size + 1) })}>+</Button>
                    <span className="text-gray-500 text-sm">{form.group_size === 1 ? 'Solo' : form.group_size === 2 ? 'Couple' : `${form.group_size} people`}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Budget & Style */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex bg-blue-100 p-3 rounded-2xl mb-4">
                    <IndianRupee className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Budget & Travel Style</h2>
                  <p className="text-gray-500 mt-1">We&apos;ll plan within your budget</p>
                </div>
                <div className="space-y-2">
                  <Label>Total Budget (INR) — for {form.group_size} person{form.group_size > 1 ? 's' : ''}</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input type="number" className="pl-9" value={form.total_budget} onChange={(e) => setForm({ ...form, total_budget: parseInt(e.target.value) || 0 })} />
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatINR(Math.round(form.total_budget / Math.max(duration, 1)))} per day ·{' '}
                    {formatINR(Math.round(form.total_budget / form.group_size))} per person
                  </p>
                </div>
                <div className="space-y-3">
                  <Label>Travel Style</Label>
                  {TRAVEL_STYLES.map((style) => (
                    <div
                      key={style.value}
                      onClick={() => setForm({ ...form, travel_style: style.value })}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        form.travel_style === style.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{style.emoji}</span>
                      <div>
                        <div className="font-medium text-gray-900">{style.label}</div>
                        <div className="text-sm text-gray-500">{style.desc}</div>
                      </div>
                      {form.travel_style === style.value && (
                        <div className="ml-auto w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              {step > 0 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : <div />}
              {step < steps.length - 1 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                  disabled={(step === 0 && (!form.destination || !form.start_city)) || (step === 1 && (!form.start_date || !form.end_date || duration < 1))}
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="gap-2 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  <Sparkles className="h-4 w-4" />
                  {loading ? 'Creating...' : 'Create My Trip'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function NewTripPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <NewTripForm />
    </Suspense>
  )
}

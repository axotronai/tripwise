'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity, ActivityType } from '@/types'

interface Props {
  dayId: string
  open: boolean
  onClose: () => void
  onAdd: (activity: Omit<Activity, 'id'>) => void
  existingCount: number
}

const ACTIVITY_TYPES: ActivityType[] = [
  'sightseeing', 'food', 'adventure', 'culture', 'beach',
  'shopping', 'rest', 'nature', 'wellness', 'departure',
]

const BLANK = {
  name: '', description: '', start_time: '09:00', end_time: '11:00',
  cost: 0, type: 'sightseeing' as ActivityType, location: '', is_free: false,
}

export default function AddActivityModal({ dayId, open, onClose, onAdd, existingCount }: Props) {
  const [form, setForm] = useState({ ...BLANK })
  const nameRef = useRef<HTMLInputElement>(null)

  function handleSubmit() {
    if (!form.name.trim()) { nameRef.current?.focus(); return }
    onAdd({ ...form, name: form.name.trim(), day_id: dayId, order_index: existingCount })
    setForm({ ...BLANK })
    onClose()
  }

  function handleClose() { setForm({ ...BLANK }); onClose() }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Activity</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Activity Name *</Label>
            <Input ref={nameRef} placeholder="e.g. Visit Colva Beach"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input placeholder="Short note (optional)"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as ActivityType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input placeholder="e.g. Colva Beach" value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_free}
              onChange={e => setForm({ ...form, is_free: e.target.checked, cost: e.target.checked ? 0 : form.cost })}
              className="rounded" />
            <span className="text-sm text-gray-700">Free activity (no cost)</span>
          </label>

          {!form.is_free && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>₹0</span>
                <span className="font-semibold text-blue-600">₹{form.cost.toLocaleString('en-IN')}</span>
                <span>₹25,000</span>
              </div>
              <input
                type="range" min={0} max={25000} step={100} value={form.cost}
                onChange={e => setForm({ ...form, cost: parseInt(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #2563eb 0%, #2563eb ${form.cost / 250}%, #e5e7eb ${form.cost / 250}%, #e5e7eb 100%)` }}
              />
              <div className="flex gap-1.5 flex-wrap">
                {[100, 500, 1000, 2000, 5000, 10000, 15000].map(p => (
                  <button key={p} type="button" onClick={() => setForm(f => ({ ...f, cost: p }))}
                    className={`px-2 py-0.5 rounded-md text-xs border transition-colors ${
                      form.cost === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                    }`}>
                    ₹{p >= 1000 ? `${p / 1000}k` : p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={handleClose}>Cancel</Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={handleSubmit} disabled={!form.name.trim()}>
              Add Activity
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

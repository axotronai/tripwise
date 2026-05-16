'use client'

import { useState } from 'react'
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

const ACTIVITY_TYPES: ActivityType[] = ['sightseeing', 'food', 'adventure', 'culture', 'beach', 'shopping', 'rest']

export default function AddActivityModal({ dayId, open, onClose, onAdd, existingCount }: Props) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_time: '09:00',
    end_time: '11:00',
    cost: 0,
    type: 'sightseeing' as ActivityType,
    location: '',
    is_free: false,
  })

  function handleSubmit() {
    if (!form.name) return
    onAdd({ ...form, day_id: dayId, order_index: existingCount })
    setForm({ name: '', description: '', start_time: '09:00', end_time: '11:00', cost: 0, type: 'sightseeing', location: '', is_free: false })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Activity</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Activity Name *</Label>
            <Input placeholder="e.g. Visit Colva Beach" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input placeholder="Short note (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ActivityType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input placeholder="e.g. Colva Beach, Goa" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_free"
                checked={form.is_free}
                onChange={(e) => setForm({ ...form, is_free: e.target.checked, cost: e.target.checked ? 0 : form.cost })}
                className="rounded"
              />
              <Label htmlFor="is_free">Free activity</Label>
            </div>
            {!form.is_free && (
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Cost (₹)"
                  value={form.cost || ''}
                  onChange={(e) => setForm({ ...form, cost: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSubmit} disabled={!form.name}>
              Add Activity
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

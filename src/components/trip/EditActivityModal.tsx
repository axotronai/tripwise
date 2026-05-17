'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity, ActivityType } from '@/types'
import { Loader2 } from 'lucide-react'

interface Props {
  activity: Activity
  open: boolean
  onClose: () => void
  onSave: (activity: Activity) => void
}

const ACTIVITY_TYPES: ActivityType[] = ['sightseeing', 'food', 'adventure', 'culture', 'beach', 'shopping', 'rest', 'nature', 'wellness', 'departure']

export default function EditActivityModal({ activity, open, onClose, onSave }: Props) {
  const [form, setForm] = useState<Activity>({ ...activity })
  const [saving, setSaving] = useState(false)

  // Reset form to latest activity data every time the modal opens (intentionally omit activity from deps)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) setForm({ ...activity }) }, [open])

  function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    onSave({ ...form, name: form.name.trim() })
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Activity Name *</Label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Visit Colva Beach"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What makes this worth visiting"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input
                type="time"
                value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as ActivityType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cost (₹)</Label>
              <Input
                type="number"
                min={0}
                value={form.is_free ? 0 : form.cost}
                disabled={form.is_free}
                onChange={e => setForm(f => ({ ...f, cost: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Price slider */}
          {!form.is_free && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>₹0</span>
                <span className="font-semibold text-blue-600">₹{form.cost.toLocaleString('en-IN')}</span>
                <span>₹25,000</span>
              </div>
              <input
                type="range"
                min={0}
                max={25000}
                step={100}
                value={form.cost}
                onChange={e => setForm(f => ({ ...f, cost: parseInt(e.target.value) }))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #2563eb 0%, #2563eb ${form.cost / 250}%, #e5e7eb ${form.cost / 250}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex gap-1.5 flex-wrap">
                {[100, 500, 1000, 2000, 5000, 10000, 15000].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, cost: preset }))}
                    className={`px-2 py-0.5 rounded-md text-xs border transition-colors ${
                      form.cost === preset
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    ₹{preset >= 1000 ? `${preset / 1000}k` : preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input
              value={form.location || ''}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Exact place name"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_free}
              onChange={e => setForm(f => ({ ...f, is_free: e.target.checked, cost: e.target.checked ? 0 : f.cost }))}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Free activity (no cost)</span>
          </label>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type Highlight = { icon: string; title: string; desc: string }
type ThingToDo = { emoji: string; name: string }
type HowToReach = { mode: string; detail: string; icon: string }

type DestinationForm = {
  name: string
  emoji: string
  tagline: string
  type: string
  gradient: string
  rating: number
  reviews: string
  duration: string
  budget: string
  photo: string
  description: string
  highlights: Highlight[]
  thingsToDo: ThingToDo[]
  bestTime: string
  howToReach: HowToReach[]
}

const EMPTY_FORM: DestinationForm = {
  name: '', emoji: '', tagline: '', type: '', gradient: '',
  rating: 4.5, reviews: '', duration: '', budget: '',
  photo: '', description: '',
  highlights: [], thingsToDo: [], bestTime: '', howToReach: [],
}

export default function AdminDestinationEdit() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [form, setForm] = useState<DestinationForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/destinations?slug=${slug}`)
      .then(r => r.json())
      .then((data: DestinationForm | null) => {
        if (data) setForm(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  function setField<K extends keyof DestinationForm>(key: K, value: DestinationForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/destinations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, ...form }),
      })
      if (!res.ok) throw new Error()
      toast.success('Destination saved')
    } catch {
      toast.error('Failed to save — try again')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div className="flex items-center gap-4">
        <Link href="/admin/destinations">
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Edit: {form.name || slug}</h1>
          <p className="text-gray-500 text-sm">/destinations/{slug}</p>
        </div>
      </div>

      {/* Basic Info */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-gray-900 text-base">Basic Info</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Name</Label>
            <Input value={form.name} onChange={e => setField('name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Emoji</Label>
            <Input value={form.emoji} onChange={e => setField('emoji', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Tagline</Label>
            <Input value={form.tagline} onChange={e => setField('tagline', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Type</Label>
            <Input value={form.type} onChange={e => setField('type', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Gradient (Tailwind)</Label>
            <Input placeholder="from-cyan-500 to-blue-600" value={form.gradient} onChange={e => setField('gradient', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Rating</Label>
            <Input type="number" step="0.1" min="0" max="5" value={form.rating}
              onChange={e => setField('rating', parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Reviews (e.g. 12.4k)</Label>
            <Input value={form.reviews} onChange={e => setField('reviews', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Duration</Label>
            <Input placeholder="4–6 days" value={form.duration} onChange={e => setField('duration', e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-gray-600">Budget</Label>
            <Input placeholder="₹8,000–₹25,000" value={form.budget} onChange={e => setField('budget', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Photo */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-gray-900 text-base">Photo</h2>
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Photo URL</Label>
          <Input placeholder="https://images.unsplash.com/..." value={form.photo}
            onChange={e => setField('photo', e.target.value)} />
        </div>
        {form.photo && (
          <img src={form.photo} alt="preview"
            className="w-full max-h-48 object-cover rounded-xl border border-gray-200" />
        )}
      </section>

      {/* Description */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-gray-900 text-base">Description</h2>
        <textarea
          rows={5}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          value={form.description}
          onChange={e => setField('description', e.target.value)}
        />
      </section>

      {/* Highlights */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-base">Highlights</h2>
          <Button size="sm" variant="outline" className="gap-1.5 rounded-xl"
            onClick={() => setField('highlights', [...form.highlights, { icon: '', title: '', desc: '' }])}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
        {form.highlights.map((h, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Highlight {i + 1}</span>
              <button onClick={() => setField('highlights', form.highlights.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Icon (emoji)</Label>
                <Input value={h.icon} onChange={e => {
                  const arr = [...form.highlights]; arr[i] = { ...h, icon: e.target.value }
                  setField('highlights', arr)
                }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Title</Label>
                <Input value={h.title} onChange={e => {
                  const arr = [...form.highlights]; arr[i] = { ...h, title: e.target.value }
                  setField('highlights', arr)
                }} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-gray-600">Description</Label>
                <textarea rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  value={h.desc} onChange={e => {
                    const arr = [...form.highlights]; arr[i] = { ...h, desc: e.target.value }
                    setField('highlights', arr)
                  }} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Things To Do */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-base">Things To Do</h2>
          <Button size="sm" variant="outline" className="gap-1.5 rounded-xl"
            onClick={() => setField('thingsToDo', [...form.thingsToDo, { emoji: '', name: '' }])}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {form.thingsToDo.map((t, i) => (
            <div key={i} className="flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2">
              <Input className="w-14 text-center px-1" placeholder="🤿" value={t.emoji}
                onChange={e => {
                  const arr = [...form.thingsToDo]; arr[i] = { ...t, emoji: e.target.value }
                  setField('thingsToDo', arr)
                }} />
              <Input className="flex-1" placeholder="Activity name" value={t.name}
                onChange={e => {
                  const arr = [...form.thingsToDo]; arr[i] = { ...t, name: e.target.value }
                  setField('thingsToDo', arr)
                }} />
              <button onClick={() => setField('thingsToDo', form.thingsToDo.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Best Time */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-gray-900 text-base">Best Time to Visit</h2>
        <textarea rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          value={form.bestTime}
          onChange={e => setField('bestTime', e.target.value)}
        />
      </section>

      {/* How To Reach */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-base">How To Reach</h2>
          <Button size="sm" variant="outline" className="gap-1.5 rounded-xl"
            onClick={() => setField('howToReach', [...form.howToReach, { mode: '', detail: '', icon: '' }])}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
        {form.howToReach.map((r, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Option {i + 1}</span>
              <button onClick={() => setField('howToReach', form.howToReach.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Mode (e.g. Flight)</Label>
                <Input value={r.mode} onChange={e => {
                  const arr = [...form.howToReach]; arr[i] = { ...r, mode: e.target.value }
                  setField('howToReach', arr)
                }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Icon (emoji)</Label>
                <Input value={r.icon} onChange={e => {
                  const arr = [...form.howToReach]; arr[i] = { ...r, icon: e.target.value }
                  setField('howToReach', arr)
                }} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-gray-600">Detail</Label>
                <textarea rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  value={r.detail} onChange={e => {
                    const arr = [...form.howToReach]; arr[i] = { ...r, detail: e.target.value }
                    setField('howToReach', arr)
                  }} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <Link href="/admin/destinations">
          <Button variant="outline" className="rounded-xl">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 px-6">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Changes
        </Button>
      </div>
    </div>
  )
}

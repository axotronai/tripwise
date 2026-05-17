'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Globe, Plus, Pencil, Trash2, ImageIcon, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type Destination = {
  id: string; name: string; emoji: string; type: string; tagline: string; photo: string
}

type NewDest = { name: string; emoji: string; type: string; tagline: string; photo: string }

const TYPE_OPTIONS = ['Beach','Mountains','Heritage','Nature','Adventure','Spiritual','Wellness','Hill Station','Wildlife','City','Backwaters','Islands','Tea & Views']

export default function AdminDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newDest, setNewDest] = useState<NewDest>({ name: '', emoji: '📍', type: 'City', tagline: '', photo: '' })
  const [adding, setAdding] = useState(false)
  const [loadingFetch, setLoadingFetch] = useState(true)

  useEffect(() => {
    fetch('/api/admin/destinations')
      .then(r => r.json())
      .then((data: Record<string, { name: string; emoji: string; type: string; tagline: string; photo: string }>) => {
        const list: Destination[] = Object.entries(data).map(([id, d]) => ({
          id,
          name: d.name ?? id,
          emoji: d.emoji ?? '📍',
          type: d.type ?? '',
          tagline: d.tagline ?? '',
          photo: d.photo ?? '',
        }))
        setDestinations(list)
        setLoadingFetch(false)
      })
      .catch(() => setLoadingFetch(false))
  }, [])

  async function deleteDestination(id: string, name: string) {
    if (!confirm(`Remove "${name}" from destinations? This cannot be undone.`)) return
    setDestinations(prev => prev.filter(d => d.id !== id))
    try {
      await fetch(`/api/admin/destinations?slug=${encodeURIComponent(id)}`, { method: 'DELETE' })
      toast.success(`${name} removed`)
    } catch {
      toast.error('Failed to delete — please try again')
    }
  }

  async function addDestination() {
    if (!newDest.name.trim()) { toast.error('Enter a destination name'); return }
    setAdding(true)
    const slug = newDest.name.toLowerCase().replace(/\s+/g, '-')
    try {
      const res = await fetch('/api/admin/destinations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name: newDest.name,
          emoji: newDest.emoji,
          type: newDest.type,
          tagline: newDest.tagline,
          photo: newDest.photo,
          highlights: [],
          thingsToDo: [],
          howToReach: [],
          description: '',
          bestTime: '',
          rating: 4.5,
          reviews: '—',
          duration: 'Flexible',
          budget: 'Varies',
          gradient: 'from-blue-500 to-indigo-600',
        }),
      })
      if (!res.ok) throw new Error()
      setDestinations(prev => [...prev, { id: slug, ...newDest }])
      setNewDest({ name: '', emoji: '📍', type: 'City', tagline: '', photo: '' })
      setShowAdd(false)
      toast.success(`${newDest.name} added`)
    } catch {
      toast.error('Failed to add — try again')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-600" /> Destinations
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{destinations.length} destinations · click the pencil to edit</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Add Destination
        </Button>
      </div>

      {showAdd && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900">Add New Destination</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Name</Label>
              <Input placeholder="e.g. Coorg" value={newDest.name}
                onChange={e => setNewDest(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Emoji</Label>
              <Input placeholder="🏕️" value={newDest.emoji}
                onChange={e => setNewDest(p => ({ ...p, emoji: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Type</Label>
              <select className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newDest.type} onChange={e => setNewDest(p => ({ ...p, type: e.target.value }))}>
                {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Tagline</Label>
              <Input placeholder="Short description" value={newDest.tagline}
                onChange={e => setNewDest(p => ({ ...p, tagline: e.target.value }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-gray-600">Photo URL (optional)</Label>
              <Input placeholder="https://images.unsplash.com/..." value={newDest.photo}
                onChange={e => setNewDest(p => ({ ...p, photo: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={addDestination} disabled={adding} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2">
              {adding && <Loader2 className="h-4 w-4 animate-spin" />} Add
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loadingFetch ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Destination</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tagline</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Photo</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {destinations.map((d, i) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {d.photo ? (
                        <img src={d.photo} alt={d.name}
                          className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-lg">
                          {d.emoji}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{d.name}</p>
                        <a href={`/destinations/${d.id}`} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
                          /destinations/{d.id} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">{d.type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{d.tagline || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3">
                    {d.photo ? (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" /> Set
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No photo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/admin/destinations/${d.id}`}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => deleteDestination(d.id, d.name)}
                        className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

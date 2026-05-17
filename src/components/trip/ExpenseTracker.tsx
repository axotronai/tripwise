'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Receipt, TrendingUp, AlertTriangle, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatINR } from '@/lib/utils/trip'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Expense {
  id: string
  trip_id: string
  category: string
  amount: number
  note: string | null
  date: string
}

interface Props {
  tripId: string
  totalBudget: number
}

const CATEGORIES = [
  { value: 'transport',      label: '🚗 Transport',      color: 'bg-blue-100 text-blue-700' },
  { value: 'accommodation',  label: '🏨 Accommodation',  color: 'bg-purple-100 text-purple-700' },
  { value: 'food',           label: '🍽️ Food & Drinks',  color: 'bg-orange-100 text-orange-700' },
  { value: 'activities',     label: '🎫 Activities',      color: 'bg-green-100 text-green-700' },
  { value: 'shopping',       label: '🛍️ Shopping',        color: 'bg-pink-100 text-pink-700' },
  { value: 'medical',        label: '💊 Medical',          color: 'bg-red-100 text-red-700' },
  { value: 'communication',  label: '📱 SIM / Data',       color: 'bg-cyan-100 text-cyan-700' },
  { value: 'miscellaneous',  label: '📦 Misc',             color: 'bg-gray-100 text-gray-700' },
]

const CAT_COLOR: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.value, c.color]))
const CAT_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]))

export default function ExpenseTracker({ tripId, totalBudget }: Props) {
  const [expenses,    setExpenses]    = useState<Expense[]>([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [form,        setForm]        = useState({ category: 'food', amount: '', note: '', date: new Date().toISOString().split('T')[0] })

  const loadExpenses = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`)
      if (res.ok) setExpenses(await res.json())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [tripId])

  useEffect(() => { loadExpenses() }, [loadExpenses])

  async function addExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      setExpenses(prev => [saved, ...prev])
      setForm({ category: 'food', amount: '', note: '', date: new Date().toISOString().split('T')[0] })
      setShowForm(false)
      toast.success('Expense added')
    } catch {
      toast.error('Could not save expense')
    } finally {
      setSaving(false)
    }
  }

  async function deleteExpense(id: string) {
    try {
      await fetch(`/api/trips/${tripId}/expenses?expenseId=${id}`, { method: 'DELETE' })
      setExpenses(prev => prev.filter(e => e.id !== id))
      toast.success('Expense removed')
    } catch {
      toast.error('Could not delete expense')
    }
  }

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const remaining  = totalBudget - totalSpent
  const pct        = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0
  const isOver     = totalSpent > totalBudget

  // Category breakdown
  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0)

  return (
    <div className="space-y-4">

      {/* Summary card */}
      <div className={`rounded-2xl border p-5 space-y-3 ${isOver ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className={`h-5 w-5 ${isOver ? 'text-red-500' : 'text-blue-500'}`} />
            <h3 className="font-semibold text-gray-900">Trip Expenses</h3>
          </div>
          {isOver && (
            <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              Over budget by {formatINR(Math.abs(remaining))}
            </div>
          )}
        </div>

        {/* Budget bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Spent: <span className={`font-bold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>{formatINR(totalSpent)}</span>
            </span>
            <span className="text-gray-500">Budget: {formatINR(totalBudget)}</span>
          </div>
          <Progress
            value={pct}
            className={`h-3 ${isOver ? '[&>div]:bg-red-500' : pct > 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-blue-500'}`}
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{pct}% used</span>
            <span className={remaining >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {remaining >= 0 ? `${formatINR(remaining)} left` : `${formatINR(Math.abs(remaining))} over`}
            </span>
          </div>
        </div>

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {byCategory.map(cat => (
              <div key={cat.value} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                <span className="text-xs">{cat.label}</span>
                <span className="text-xs font-semibold text-gray-800">{formatINR(cat.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add expense button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-10"
        >
          <Plus className="h-4 w-4" /> Log Expense
        </Button>
      )}

      {/* Add expense form */}
      {showForm && (
        <form onSubmit={addExpense} className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 text-sm">Add Expense</h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Category</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                    form.category === cat.value
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-600">Amount (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  type="number"
                  placeholder="500"
                  min="1"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="pl-8 h-10 text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-600">Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-600">Note (optional)</Label>
            <Input
              placeholder="e.g. Dinner at beach shack"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="h-10 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 gap-2">
              {saving ? <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Add Expense'}
            </Button>
          </div>
        </form>
      )}

      {/* Expense list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No expenses logged yet</p>
          <p className="text-xs mt-1">Track your actual spending as you travel</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</p>
          {expenses.map(exp => (
            <div key={exp.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow transition-shadow px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs py-0 px-2 ${CAT_COLOR[exp.category] || 'bg-gray-100 text-gray-700'}`}>
                    {CAT_LABEL[exp.category] || exp.category}
                  </Badge>
                  {exp.note && <span className="text-sm text-gray-700 truncate">{exp.note}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{format(new Date(exp.date), 'd MMM yyyy')}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-gray-900 text-sm">{formatINR(exp.amount)}</span>
                <button
                  onClick={() => deleteExpense(exp.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                  title="Delete expense"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

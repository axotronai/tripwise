'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Sparkles, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trip, ItineraryDay, Transport } from '@/types'
import { SelectedHotel } from '@/components/hotel/HotelSearch'
import { formatINR } from '@/lib/utils/trip'

interface Message { role: 'user' | 'assistant'; content: string }

const QUICK_QUESTIONS = [
  'What should I pack?',
  'Best local food to try?',
  'Is it safe for solo travel?',
  'Money-saving tips?',
  "What's the weather like?",
]

interface Props {
  trip: Trip
  days: ItineraryDay[]
  dayHotels: Record<string, SelectedHotel>
  savedTransports: Transport[]
}

/** Very lightweight markdown → plain-text renderer for the chat bubble.
 *  Converts: **bold** → <strong>, *item* / • item → bullet, \n → <br>
 *  Avoids shipping react-markdown just for this widget. */
function renderMarkdown(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const trimmed = line.trim()
    const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')
    const content  = isBullet ? trimmed.slice(2) : line

    // Bold: **text**
    const parts = content.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
      }
      return part
    })

    if (isBullet) {
      return (
        <div key={i} className="flex gap-1.5 items-start">
          <span className="text-blue-400 shrink-0 mt-0.5">•</span>
          <span>{parts}</span>
        </div>
      )
    }
    if (trimmed === '') return <div key={i} className="h-1.5" />
    return <div key={i}>{parts}</div>
  })
}

export default function AiChatBubble({ trip, days, dayHotels, savedTransports }: Props) {
  const storageKey = `chat-${trip.id}`

  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  const greeting = `Hi! I'm your TripWise AI 🗺️\n\nI know your ${trip.total_days}-day ${trip.destination} trip (${formatINR(trip.total_budget)} budget). Ask me anything — local tips, what to pack, best food, budget advice, or anything about your plan!`

  // Load persisted chat on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed: Message[] = JSON.parse(saved)
        if (parsed.length > 0) { setMessages(parsed); return }
      }
    } catch { /* ignore */ }
    setMessages([{ role: 'assistant', content: greeting }])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id])

  // Persist chat on every change
  useEffect(() => {
    if (messages.length === 0) return
    try { localStorage.setItem(storageKey, JSON.stringify(messages)) } catch { /* storage full */ }
  }, [messages, storageKey])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    const next: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(next)
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          context: { trip, days, dayHotels, savedTransports },
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, try again.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong — please try again.' }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function reset() {
    const fresh = [{ role: 'assistant' as const, content: greeting }]
    setMessages(fresh)
    setInput('')
    try { localStorage.setItem(storageKey, JSON.stringify(fresh)) } catch { /* ignore */ }
  }

  const userMessageCount = messages.filter(m => m.role === 'user').length

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          aria-label="Open AI chat"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <Sparkles className="h-2.5 w-2.5 text-white" />
          </span>
          {userMessageCount > 0 && (
            <span className="absolute -bottom-1 -left-1 w-5 h-5 bg-blue-800 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
              {userMessageCount}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-96 h-[560px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">TripWise AI</p>
                <p className="text-blue-200 text-xs">{trip.destination} · {trip.total_days}d · {formatINR(trip.total_budget)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={reset} title="New chat" className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5 mr-1.5">
                    <Sparkles className="h-3 w-3 text-blue-600" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm whitespace-pre-wrap break-words'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm space-y-0.5'
                }`}>
                  {m.role === 'assistant' ? renderMarkdown(m.content) : m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Sparkles className="h-3 w-3 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions (show only before first user message) */}
          {userMessageCount === 0 && !loading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 hover:bg-blue-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-1 border-t border-gray-100 flex gap-2 shrink-0">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask anything about your trip…"
              className="text-sm h-9 flex-1"
              disabled={loading}
            />
            <Button
              size="sm"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="h-9 w-9 p-0 bg-blue-600 hover:bg-blue-700 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

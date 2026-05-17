'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Mail, Lock, Eye, EyeOff, Sparkles, UserPlus, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const next         = searchParams.get('next') ?? '/dashboard'

  const [tab, setTab]             = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]         = useState('')
  const [password, setPw]         = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [done, setDone]           = useState(false)

  async function signInWithGoogle() {
    if (!isSupabaseConfigured()) {
      toast.error('Google login is not configured yet')
      return
    }
    setGoogleLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        },
      })
      if (error) { toast.error('Google sign-in failed — try again'); setGoogleLoading(false) }
      // On success, Supabase redirects the browser — no need to do anything here
    } catch {
      toast.error('Something went wrong')
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { toast.error('Enter email and password'); return }
    if (tab === 'signup' && password.length < 6) { toast.error('Password must be at least 6 characters'); return }

    setLoading(true)
    try {
      if (tab === 'signin') {
        // 1. Try admin credentials first
        const adminRes = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (adminRes.ok) {
          toast.success('Welcome, Admin!')
          router.push('/admin')
          router.refresh()
          return
        }

        // 2. Try Supabase user auth
        if (!isSupabaseConfigured()) {
          toast.error('Invalid credentials')
          return
        }
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { toast.error('Invalid email or password'); return }
        toast.success('Welcome back!')
        router.push(next)
        router.refresh()

      } else {
        // Sign up — Supabase only
        if (!isSupabaseConfigured()) {
          toast.error('User accounts are not configured yet')
          return
        }
        const supabase = createClient()
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) { toast.error(error.message); return }
        setDone(true)
      }
    } catch {
      toast.error('Something went wrong — try again')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-white/20 p-3 rounded-2xl"><Mail className="h-7 w-7" /></div>
          </div>
          <h1 className="text-2xl font-extrabold">Check your email</h1>
          <p className="text-green-100 text-sm mt-1">We sent a confirmation link to <strong>{email}</strong></p>
        </div>
        <div className="p-8 text-center space-y-4">
          <p className="text-gray-600 text-sm">Click the link in the email to activate your account, then sign in.</p>
          <Button variant="outline" onClick={() => { setDone(false); setTab('signin') }} className="rounded-xl">
            Back to Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center">
        <div className="flex justify-center mb-3">
          <div className="bg-white/20 p-3 rounded-2xl"><MapPin className="h-7 w-7" /></div>
        </div>
        <h1 className="text-2xl font-extrabold">TripWise</h1>
        <p className="text-blue-200 text-sm mt-1">Plan your perfect India trip — for free</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['signin', 'signup'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              tab === t ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'signin'
              ? <><LogIn className="h-4 w-4" /> Sign In</>
              : <><UserPlus className="h-4 w-4" /> Create Account</>}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-8 space-y-5">

        {/* Google OAuth */}
        <Button
          type="button"
          variant="outline"
          disabled={googleLoading}
          onClick={signInWithGoogle}
          className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl gap-3 text-sm"
        >
          {googleLoading ? (
            <span className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input type="email" placeholder="you@email.com" className="pl-10 h-12 border-gray-200 focus-visible:ring-blue-500"
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoFocus />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input type={showPw ? 'text' : 'password'}
              placeholder={tab === 'signup' ? 'Min 6 characters' : '••••••••'}
              className="pl-10 pr-10 h-12 border-gray-200 focus-visible:ring-blue-500"
              value={password} onChange={e => setPw(e.target.value)}
              autoComplete={tab === 'signup' ? 'new-password' : 'current-password'} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 text-base">
          {loading
            ? (tab === 'signin' ? 'Signing in…' : 'Creating account…')
            : tab === 'signin'
              ? <><Sparkles className="h-4 w-4" /> Sign In</>
              : <><UserPlus className="h-4 w-4" /> Create Free Account</>
          }
        </Button>

        <p className="text-center text-sm text-gray-500">
          {tab === 'signin'
            ? <>No account?{' '}<button type="button" onClick={() => setTab('signup')} className="text-blue-600 font-medium hover:underline">Create one free</button></>
            : <>Already have one?{' '}<button type="button" onClick={() => setTab('signin')} className="text-blue-600 font-medium hover:underline">Sign in</button></>
          }
        </p>
      </form>
    </div>
  )
}

function LoginPageInner() {
  return <LoginForm />
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 px-4 py-12">
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px,white 1px,transparent 0)', backgroundSize: '28px 28px' }} />
      <div className="relative w-full max-w-md">
        <Suspense fallback={<div className="bg-white rounded-3xl h-96 animate-pulse" />}>
          <LoginPageInner />
        </Suspense>
      </div>
    </div>
  )
}

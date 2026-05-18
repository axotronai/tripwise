import Link from 'next/link'
import { MapPin, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-black text-indigo-100 mb-2 select-none">404</div>
        <MapPin className="h-12 w-12 text-indigo-400 mx-auto -mt-4 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Looks like you&apos;re lost</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          This page doesn&apos;t exist — but your next adventure does.
          <br />Let&apos;s get you back on track.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            My Trips
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

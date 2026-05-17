import { Settings } from 'lucide-react'

export default function AdminSettings() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" /> Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage credentials and configuration.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Admin Credentials</h2>
        <p className="text-sm text-gray-600">
          Admin login credentials are managed via environment variables in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">.env.local</code>:
        </p>
        <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs text-green-400 space-y-1">
          <p>ADMIN_EMAIL=your@email.com</p>
          <p>ADMIN_PASSWORD=YourSecurePassword</p>
          <p>ADMIN_SESSION_SECRET=your-secret-key</p>
        </div>
        <p className="text-xs text-gray-400">Restart the dev server after changing these values.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-gray-900">External APIs</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span>Groq API (AI itineraries)</span>
            <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 text-xs">GROQ_API_KEY</code>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span>Supabase URL</span>
            <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>
          </div>
          <div className="flex justify-between items-center py-2">
            <span>Supabase Anon Key</span>
            <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Pencil } from 'lucide-react'

export default function AdminEditButton({ slug }: { slug: string }) {
  return (
    <Link
      href={`/admin/destinations/${slug}`}
      className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full px-4 py-2.5 shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-colors text-sm font-semibold"
    >
      <Pencil className="h-4 w-4" />
      Edit Destination
    </Link>
  )
}

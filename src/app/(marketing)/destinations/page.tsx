'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, ArrowRight, ChevronDown } from 'lucide-react'

/* ─── Top curated destinations ─────────────────────────────────────── */

const TOP_DESTINATIONS = [
  { name: 'Goa',        type: 'Beach',       days: '4–6 days',  rating: 4.8, reviews: '12.4k', gradient: 'from-cyan-400 to-blue-500',    emoji: '🏖️' },
  { name: 'Manali',     type: 'Mountains',   days: '5–7 days',  rating: 4.7, reviews: '9.1k',  gradient: 'from-blue-400 to-indigo-600',  emoji: '🏔️' },
  { name: 'Jaipur',     type: 'Heritage',    days: '3–5 days',  rating: 4.6, reviews: '15.2k', gradient: 'from-orange-400 to-pink-500',  emoji: '🏰' },
  { name: 'Kerala',     type: 'Backwaters',  days: '5–7 days',  rating: 4.9, reviews: '18.7k', gradient: 'from-green-400 to-emerald-600',emoji: '🌿' },
  { name: 'Ladakh',     type: 'Adventure',   days: '7–10 days', rating: 4.9, reviews: '7.3k',  gradient: 'from-indigo-400 to-purple-600',emoji: '🎒' },
  { name: 'Andaman',    type: 'Islands',     days: '5–7 days',  rating: 4.7, reviews: '6.8k',  gradient: 'from-teal-400 to-cyan-600',    emoji: '🐠' },
  { name: 'Varanasi',   type: 'Spiritual',   days: '3–4 days',  rating: 4.5, reviews: '11.2k', gradient: 'from-amber-400 to-orange-500', emoji: '🛕' },
  { name: 'Rishikesh',  type: 'Adventure',   days: '3–5 days',  rating: 4.6, reviews: '8.9k',  gradient: 'from-green-500 to-teal-600',   emoji: '🧘' },
  { name: 'Shimla',     type: 'Mountains',   days: '3–5 days',  rating: 4.5, reviews: '10.1k', gradient: 'from-sky-400 to-blue-500',     emoji: '🏔️' },
  { name: 'Udaipur',    type: 'Heritage',    days: '3–4 days',  rating: 4.8, reviews: '13.5k', gradient: 'from-rose-400 to-pink-600',    emoji: '🏯' },
  { name: 'Munnar',     type: 'Hill Station',days: '3–5 days',  rating: 4.7, reviews: '9.8k',  gradient: 'from-green-400 to-lime-500',   emoji: '🌱' },
  { name: 'Darjeeling', type: 'Tea & Views', days: '3–4 days',  rating: 4.6, reviews: '7.2k',  gradient: 'from-emerald-400 to-teal-500', emoji: '🍵' },
]

/* ─── States ────────────────────────────────────────────────────────── */

const STATES = [
  {
    name: 'Rajasthan', emoji: '🏜️', gradient: 'from-orange-400 to-amber-500',
    spots: [
      { name: 'Jaipur',    desc: 'Pink City, Amber Fort, Hawa Mahal',    emoji: '🏰', gradient: 'from-orange-300 to-pink-400' },
      { name: 'Udaipur',   desc: 'City of Lakes, Lake Pichola',           emoji: '🏯', gradient: 'from-rose-300 to-pink-500' },
      { name: 'Jodhpur',   desc: 'Blue City, Mehrangarh Fort',            emoji: '🔵', gradient: 'from-blue-300 to-indigo-400' },
      { name: 'Jaisalmer', desc: 'Golden City, Thar Desert, Sand Dunes',  emoji: '🌅', gradient: 'from-yellow-300 to-amber-400' },
      { name: 'Pushkar',   desc: 'Sacred lake, Brahma Temple, camels',    emoji: '🛕', gradient: 'from-amber-300 to-orange-400' },
    ],
  },
  {
    name: 'Himachal Pradesh', emoji: '🏔️', gradient: 'from-sky-400 to-blue-600',
    spots: [
      { name: 'Manali',       desc: 'Snow peaks, Rohtang Pass, adventure',  emoji: '⛷️', gradient: 'from-blue-300 to-indigo-500' },
      { name: 'Shimla',       desc: 'Colonial hill station, Mall Road',     emoji: '🚃', gradient: 'from-sky-300 to-blue-400' },
      { name: 'Dharamshala',  desc: 'Tibetan culture, Dalai Lama temple',   emoji: '☮️', gradient: 'from-violet-300 to-purple-400' },
      { name: 'Kasol',        desc: 'Backpacker heaven, Parvati Valley',    emoji: '🏕️', gradient: 'from-green-300 to-teal-400' },
      { name: 'Spiti Valley', desc: 'High altitude desert, monasteries',    emoji: '🗻', gradient: 'from-slate-400 to-gray-500' },
    ],
  },
  {
    name: 'Goa', emoji: '🏖️', gradient: 'from-cyan-400 to-blue-500',
    spots: [
      { name: 'North Goa',  desc: 'Baga, Calangute, Anjuna — party beaches', emoji: '🌊', gradient: 'from-cyan-300 to-blue-400' },
      { name: 'South Goa',  desc: 'Palolem, Agonda — serene beaches',        emoji: '🌴', gradient: 'from-teal-300 to-cyan-400' },
      { name: 'Old Goa',    desc: 'Portuguese churches, UNESCO heritage',     emoji: '⛪', gradient: 'from-stone-300 to-amber-400' },
      { name: 'Dudhsagar',  desc: 'Majestic waterfall, jungle train trail',   emoji: '💧', gradient: 'from-emerald-300 to-green-400' },
    ],
  },
  {
    name: 'Kerala', emoji: '🌿', gradient: 'from-green-400 to-emerald-600',
    spots: [
      { name: 'Munnar',    desc: 'Tea gardens, cool misty hills, Eravikulam',emoji: '🍵', gradient: 'from-green-300 to-lime-400' },
      { name: 'Alleppey',  desc: 'Houseboat backwaters, canals, sunsets',     emoji: '🚢', gradient: 'from-teal-300 to-cyan-400' },
      { name: 'Wayanad',   desc: 'Rainforest, tribal culture, waterfalls',    emoji: '🌧️', gradient: 'from-emerald-400 to-green-500' },
      { name: 'Kochi',     desc: 'Fort Kochi, Chinese fishing nets, art',     emoji: '🎣', gradient: 'from-blue-300 to-teal-400' },
      { name: 'Thekkady',  desc: 'Periyar wildlife sanctuary, elephants',     emoji: '🐘', gradient: 'from-amber-300 to-green-400' },
    ],
  },
  {
    name: 'Uttarakhand', emoji: '🧘', gradient: 'from-teal-400 to-green-600',
    spots: [
      { name: 'Rishikesh',         desc: 'Yoga capital, river rafting, Ganga', emoji: '🌊', gradient: 'from-teal-300 to-blue-400' },
      { name: 'Haridwar',          desc: 'Ganga Aarti, Har Ki Pauri ghat',     emoji: '🔱', gradient: 'from-orange-300 to-amber-400' },
      { name: 'Nainital',          desc: 'Lake town, boat rides, Naina Devi',  emoji: '🏞️', gradient: 'from-sky-300 to-blue-400' },
      { name: 'Mussoorie',         desc: 'Queen of Hills, Kempty Falls',        emoji: '💦', gradient: 'from-green-300 to-emerald-400' },
      { name: 'Auli',              desc: 'Skiing, Nanda Devi views, snow',      emoji: '⛷️', gradient: 'from-blue-300 to-indigo-400' },
      { name: 'Valley of Flowers', desc: 'UNESCO, alpine meadow flowers',       emoji: '🌸', gradient: 'from-pink-300 to-rose-400' },
    ],
  },
  {
    name: 'Jammu & Kashmir / Ladakh', emoji: '❄️', gradient: 'from-indigo-400 to-purple-600',
    spots: [
      { name: 'Leh',           desc: 'High altitude desert, Buddhist culture', emoji: '☸️', gradient: 'from-amber-300 to-orange-400' },
      { name: 'Pangong Lake',  desc: 'Electric blue lake at 14,000 ft',        emoji: '💙', gradient: 'from-blue-400 to-indigo-500' },
      { name: 'Nubra Valley',  desc: 'Double-humped camels, sand dunes',       emoji: '🐪', gradient: 'from-amber-300 to-yellow-400' },
      { name: 'Srinagar',      desc: 'Dal Lake, houseboats, Mughal gardens',   emoji: '🌷', gradient: 'from-rose-300 to-pink-400' },
      { name: 'Gulmarg',       desc: 'Skiing, gondola, snow-covered meadows',  emoji: '🎿', gradient: 'from-sky-300 to-blue-400' },
    ],
  },
  {
    name: 'Maharashtra', emoji: '🌆', gradient: 'from-yellow-400 to-orange-500',
    spots: [
      { name: 'Mumbai',         desc: 'Gateway of India, Marine Drive',        emoji: '🌊', gradient: 'from-blue-400 to-indigo-500' },
      { name: 'Lonavala',       desc: 'Weekend escape, Bhushi Dam, forts',     emoji: '🌧️', gradient: 'from-green-300 to-teal-400' },
      { name: 'Aurangabad',     desc: 'Ajanta & Ellora caves, UNESCO',         emoji: '🏛️', gradient: 'from-stone-300 to-amber-400' },
      { name: 'Mahabaleshwar',  desc: 'Strawberries, viewpoints, Venna Lake',  emoji: '🍓', gradient: 'from-rose-300 to-red-400' },
      { name: 'Nashik',         desc: 'Vineyards, Sula wine, Pandavleni',      emoji: '🍇', gradient: 'from-purple-300 to-violet-400' },
    ],
  },
  {
    name: 'Tamil Nadu', emoji: '🛕', gradient: 'from-rose-400 to-red-600',
    spots: [
      { name: 'Ooty',          desc: 'Nilgiri hills, toy train, tea estates',  emoji: '🚂', gradient: 'from-green-300 to-emerald-400' },
      { name: 'Kodaikanal',    desc: 'Princess of Hill Stations, lake',        emoji: '🏞️', gradient: 'from-teal-300 to-green-400' },
      { name: 'Mahabalipuram', desc: 'Shore Temple, UNESCO, rock sculptures',  emoji: '🗿', gradient: 'from-amber-300 to-orange-400' },
      { name: 'Madurai',       desc: 'Meenakshi Temple, ancient city',         emoji: '🏯', gradient: 'from-rose-300 to-pink-400' },
    ],
  },
  {
    name: 'Karnataka', emoji: '🌳', gradient: 'from-lime-400 to-green-600',
    spots: [
      { name: 'Coorg',       desc: 'Coffee estates, misty hills, waterfalls',  emoji: '☕', gradient: 'from-amber-400 to-brown-500' },
      { name: 'Hampi',       desc: 'Vijayanagara ruins, UNESCO site',          emoji: '🏛️', gradient: 'from-orange-300 to-amber-400' },
      { name: 'Mysuru',      desc: 'Mysore Palace, Dasara festival',           emoji: '🏰', gradient: 'from-yellow-300 to-orange-400' },
      { name: 'Chikmagalur', desc: 'Coffee trail, Mullayanagiri peak',         emoji: '⛰️', gradient: 'from-green-300 to-lime-400' },
      { name: 'Gokarna',     desc: 'Temple town, Om Beach, secluded coves',   emoji: '🏖️', gradient: 'from-cyan-300 to-blue-400' },
    ],
  },
  {
    name: 'West Bengal', emoji: '🍵', gradient: 'from-emerald-400 to-teal-600',
    spots: [
      { name: 'Darjeeling', desc: 'Tea gardens, toy train, Himalayan views', emoji: '🚂', gradient: 'from-emerald-300 to-teal-400' },
      { name: 'Kolkata',    desc: 'Victoria Memorial, cultural capital',      emoji: '🏛️', gradient: 'from-amber-300 to-orange-400' },
      { name: 'Sundarbans', desc: 'Royal Bengal tiger, mangrove forests',     emoji: '🐯', gradient: 'from-green-400 to-emerald-500' },
    ],
  },
  {
    name: 'Gujarat', emoji: '🦁', gradient: 'from-amber-400 to-yellow-500',
    spots: [
      { name: 'Rann of Kutch', desc: 'White salt desert, Rann Utsav festival',emoji: '🌕', gradient: 'from-gray-200 to-slate-300' },
      { name: 'Gir Forest',    desc: 'Last home of Asiatic lions',             emoji: '🦁', gradient: 'from-amber-400 to-yellow-500' },
      { name: 'Dwarka',        desc: 'Ancient pilgrimage, Arabian Sea coast',  emoji: '🛕', gradient: 'from-blue-300 to-teal-400' },
      { name: 'Ahmedabad',     desc: 'UNESCO city, Sabarmati Ashram, food',    emoji: '🕌', gradient: 'from-orange-300 to-amber-400' },
    ],
  },
  {
    name: 'Madhya Pradesh', emoji: '🌿', gradient: 'from-green-400 to-teal-500',
    spots: [
      { name: 'Khajuraho', desc: 'UNESCO erotic temples, sculpture art',       emoji: '🏛️', gradient: 'from-stone-300 to-amber-400' },
      { name: 'Pachmarhi', desc: 'Satpura Hill Station, waterfalls, caves',    emoji: '💦', gradient: 'from-teal-300 to-green-400' },
      { name: 'Orchha',    desc: 'Medieval fort & palaces, cenotaphs',         emoji: '🏯', gradient: 'from-amber-300 to-orange-400' },
      { name: 'Kanha',     desc: 'Tiger reserve, Kipling\'s jungle',           emoji: '🐯', gradient: 'from-green-400 to-emerald-500' },
    ],
  },
  {
    name: 'Andaman & Nicobar', emoji: '🐠', gradient: 'from-teal-400 to-cyan-600',
    spots: [
      { name: 'Port Blair',     desc: 'Cellular Jail, Ross Island, history',  emoji: '⛓️', gradient: 'from-slate-400 to-gray-500' },
      { name: 'Havelock Island',desc: 'Radhanagar Beach, snorkelling, scuba', emoji: '🤿', gradient: 'from-cyan-300 to-blue-400' },
      { name: 'Neil Island',    desc: 'Natural Bridge, Sitapur beach, peace', emoji: '🌅', gradient: 'from-teal-300 to-emerald-400' },
    ],
  },
  {
    name: 'Meghalaya', emoji: '🌧️', gradient: 'from-blue-400 to-indigo-500',
    spots: [
      { name: 'Shillong',     desc: 'Scotland of the East, Ward\'s Lake',    emoji: '🏙️', gradient: 'from-blue-300 to-indigo-400' },
      { name: 'Cherrapunji',  desc: 'Wettest place, living root bridges',     emoji: '🌉', gradient: 'from-teal-300 to-green-400' },
      { name: 'Dawki',        desc: 'Crystal clear Umngot river, boats',      emoji: '💎', gradient: 'from-cyan-300 to-blue-400' },
      { name: 'Mawlynnong',   desc: 'Cleanest village in Asia, tree bridges', emoji: '🌸', gradient: 'from-green-300 to-emerald-400' },
    ],
  },
  {
    name: 'Punjab', emoji: '🌾', gradient: 'from-yellow-400 to-orange-500',
    spots: [
      { name: 'Amritsar',   desc: 'Golden Temple, Wagah border ceremony',    emoji: '✨', gradient: 'from-amber-300 to-yellow-400' },
      { name: 'Chandigarh', desc: 'Rock Garden, Sukhna Lake, Le Corbusier',  emoji: '🏙️', gradient: 'from-sky-300 to-blue-400' },
    ],
  },
  {
    name: 'Uttar Pradesh', emoji: '🕌', gradient: 'from-amber-400 to-orange-500',
    spots: [
      { name: 'Agra',     desc: 'Taj Mahal, Agra Fort, Fatehpur Sikri',       emoji: '🕌', gradient: 'from-gray-200 to-stone-300' },
      { name: 'Varanasi', desc: 'Ghats, Ganga Aarti, spiritual capital',       emoji: '🛕', gradient: 'from-amber-300 to-orange-400' },
      { name: 'Lucknow',  desc: 'Nawabi culture, Imambara, kebabs',           emoji: '🍢', gradient: 'from-rose-300 to-pink-400' },
      { name: 'Mathura',  desc: 'Birthplace of Krishna, colorful temples',    emoji: '🪘', gradient: 'from-yellow-300 to-orange-400' },
    ],
  },
  {
    name: 'Assam & Northeast', emoji: '🦏', gradient: 'from-green-500 to-teal-600',
    spots: [
      { name: 'Kaziranga', desc: 'One-horned rhinos, UNESCO, jeep safari',    emoji: '🦏', gradient: 'from-green-400 to-emerald-500' },
      { name: 'Majuli',    desc: 'World\'s largest river island, Assam',      emoji: '🌊', gradient: 'from-teal-300 to-cyan-400' },
      { name: 'Guwahati',  desc: 'Kamakhya Temple, Brahmaputra cruise',       emoji: '🛕', gradient: 'from-orange-300 to-amber-400' },
      { name: 'Tawang',    desc: 'Arunachal monastery, snow, high passes',    emoji: '🏔️', gradient: 'from-indigo-300 to-blue-400' },
    ],
  },
]

/* ─── Top destination card ──────────────────────────────────────────────
   To add a real photo: add  image: '/photos/goa.jpg'  to the data object.
   The card automatically switches from gradient → photo. No other changes.
──────────────────────────────────────────────────────────────────────── */

function DestCard({ name, emoji, type, days, rating, reviews, gradient, image }: {
  name: string; emoji: string; type: string; days: string
  rating: number; reviews: string; gradient: string; image?: string
}) {
  return (
    <Link href={`/destinations/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`}>
      <div className={`relative w-full aspect-square rounded-2xl overflow-hidden group cursor-pointer shadow hover:shadow-xl hover:scale-105 transition-all duration-300 ${image ? '' : `bg-gradient-to-br ${gradient}`}`}>
        {/* Photo (when provided) */}
        {image && (
          <Image src={image} alt={name} fill
            className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" />
        )}
        {/* Emoji placeholder (shown when no photo) */}
        {!image && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{emoji}</span>
          </div>
        )}
        {/* Type badge */}
        <div className="absolute top-2 right-2 bg-white/25 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{type}</div>
        {/* Bottom overlay — always shown */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 pt-8">
          <p className="text-white font-bold text-sm">{name}</p>
          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center gap-1">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span className="text-white/90 text-[10px] font-medium">{rating}</span>
              <span className="text-white/60 text-[10px]">({reviews})</span>
            </div>
            <span className="text-white/70 text-[10px]">{days}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ─── Spot card ─────────────────────────────────────────────────────────
   To add a real photo: add  image: '/photos/jaipur.jpg'  to the spot object.
──────────────────────────────────────────────────────────────────────── */

function SpotCard({ name, desc, emoji, gradient, image }: {
  name: string; desc: string; emoji: string; gradient: string; image?: string
}) {
  return (
    <Link href={`/destinations/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`}>
      <div className={`relative w-full aspect-square rounded-xl overflow-hidden group cursor-pointer shadow hover:shadow-lg hover:scale-105 transition-all duration-300 ${image ? '' : `bg-gradient-to-br ${gradient}`}`}>
        {image && (
          <Image src={image} alt={name} fill
            className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width:640px) 50vw, (max-width:1024px) 25vw, 16vw" />
        )}
        {!image && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl drop-shadow group-hover:scale-110 transition-transform duration-300">{emoji}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-2.5 pt-6">
          <p className="text-white font-bold text-xs">{name}</p>
          <p className="text-white/70 text-[10px] mt-0.5 line-clamp-1">{desc}</p>
        </div>
      </div>
    </Link>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────── */

export default function DestinationsPage() {
  const [openState, setOpenState] = useState<string | null>(null)
  const [photos, setPhotos] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/admin/destinations')
      .then(r => r.json())
      .then((data: Record<string, { photo?: string }>) => {
        const map: Record<string, string> = {}
        for (const [slug, dest] of Object.entries(data)) {
          map[slug] = dest.photo ?? ''
        }
        setPhotos(map)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-600">All Destinations</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Explore India</h1>
          <p className="text-gray-500 mt-2">Browse top picks and every state — click any destination to get a free AI itinerary.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* ── Top destinations ────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-7 bg-blue-600 rounded-full" />
            <h2 className="text-xl font-bold text-gray-900">Top Destinations</h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Most Popular</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {TOP_DESTINATIONS.map(d => {
              const slug = d.name.toLowerCase().replace(/\s+/g, '-')
              return <DestCard key={d.name} {...d} image={photos[slug] || undefined} />
            })}
          </div>
        </section>

        {/* ── Browse by State ─────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-7 bg-indigo-600 rounded-full" />
            <h2 className="text-xl font-bold text-gray-900">Browse by State</h2>
            <span className="text-xs text-gray-400">Click a state to see its top places</span>
          </div>

          {/* State cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {STATES.map(state => {
              const isOpen = openState === state.name
              return (
                <button
                  key={state.name}
                  onClick={() => setOpenState(isOpen ? null : state.name)}
                  className={`relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br ${state.gradient} group cursor-pointer shadow transition-all duration-300 ${isOpen ? 'ring-4 ring-white ring-offset-2 shadow-xl scale-105' : 'hover:shadow-xl hover:scale-105'}`}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{state.emoji}</span>
                    <span className="text-white font-bold text-sm drop-shadow px-2 text-center leading-tight">{state.name}</span>
                    <span className="text-white/70 text-[10px]">{state.spots.length} places</span>
                  </div>
                  <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="h-4 w-4 text-white/80" />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Expanded spots panel */}
          {openState && (() => {
            const state = STATES.find(s => s.name === openState)!
            return (
              <div className="mt-6 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{state.emoji}</span>
                    <h3 className="font-bold text-gray-900 text-lg">{state.name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{state.spots.length} top places</span>
                  </div>
                  <button onClick={() => setOpenState(null)} className="text-xs text-gray-400 hover:text-gray-600">Close ✕</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {state.spots.map(spot => <SpotCard key={spot.name} {...spot} />)}
                </div>
              </div>
            )
          })()}
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-xl font-bold mb-2">Can&apos;t decide where to go?</h2>
          <p className="text-blue-100 text-sm mb-5">Tell our AI your budget, interests, and days — it&apos;ll suggest the perfect destination and build your full itinerary.</p>
          <Link href="/trips/new">
            <button className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm">
              Let AI Pick for Me <ArrowRight className="inline h-4 w-4 ml-1" />
            </button>
          </Link>
        </section>

      </div>
    </div>
  )
}

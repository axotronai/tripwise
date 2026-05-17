import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city      = searchParams.get('city') || ''
  const checkin   = searchParams.get('checkin') || ''
  const checkout  = searchParams.get('checkout') || ''
  const maxPrice  = parseInt(searchParams.get('maxPrice') || '5000')
  const minRating = parseFloat(searchParams.get('minRating') || '0')
  const type      = searchParams.get('type') || 'all'

  const hotels = [
    { id: 'h1', name: 'The Grand Leela',      city, type: 'luxury',   price_per_night: 8500,  rating: 4.9, reviews: 2341, amenities: ['Pool','Spa','WiFi','Restaurant'], lat: 15.4, lng: 74.0, image_gradient: 'from-purple-500 to-pink-600' },
    { id: 'h2', name: 'OYO Premium Rooms',    city, type: 'budget',   price_per_night: 950,   rating: 3.8, reviews: 876,  amenities: ['WiFi','AC'],                      lat: 15.3, lng: 74.1, image_gradient: 'from-blue-400 to-cyan-500' },
    { id: 'h3', name: 'Zostel Hostel',        city, type: 'hostel',   price_per_night: 450,   rating: 4.2, reviews: 1203, amenities: ['WiFi','Lounge','Kitchen'],         lat: 15.5, lng: 74.0, image_gradient: 'from-green-400 to-teal-500' },
    { id: 'h4', name: 'Treebo Trend Vista',   city, type: 'comfort',  price_per_night: 2200,  rating: 4.4, reviews: 654,  amenities: ['WiFi','AC','Breakfast'],           lat: 15.4, lng: 74.2, image_gradient: 'from-orange-400 to-amber-500' },
    { id: 'h5', name: 'Airbnb Beach Villa',   city, type: 'villa',    price_per_night: 4800,  rating: 4.7, reviews: 312,  amenities: ['Pool','Kitchen','Beach Access'],   lat: 15.2, lng: 73.9, image_gradient: 'from-cyan-400 to-blue-500' },
    { id: 'h6', name: 'FabHotel Prime',       city, type: 'comfort',  price_per_night: 1600,  rating: 4.1, reviews: 489,  amenities: ['WiFi','AC','Parking'],            lat: 15.3, lng: 74.1, image_gradient: 'from-indigo-400 to-violet-500' },
  ]
  .filter(h => h.price_per_night <= maxPrice * 1.4)
  .filter(h => h.rating >= minRating)
  .filter(h => type === 'all' || h.type === type)

  return NextResponse.json({ city, checkin, checkout, hotels })
}

/**
 * TripWise Affiliate / Commission Link Builder
 *
 * All affiliate IDs live in env vars (NEXT_PUBLIC_* so they're safe to read on client).
 * Every URL builder falls back to a clean URL if no ID is configured.
 *
 * Estimated commissions per action (India, 2024):
 *  Booking.com hotel    — 25-40% of platform margin (~₹200–₹800/booking)
 *  Agoda hotel          — 4-6% of booking value
 *  MakeMyTrip flight    — ₹50–₹150 per ticket
 *  EaseMyTrip flight    — ₹50–₹200 per ticket
 *  RedBus bus           — ₹10–₹30 per booking
 *  Klook activity       — 3-7% of activity cost
 *  GetYourGuide         — 8% of activity cost
 *  PolicyBazaar travel  — 10-20% of premium (~₹150–₹400/policy)
 *  BankBazaar credit card — ₹500–₹2000 per approved card
 *  Amazon travel gear   — 4-6% product commission
 */

// ─── Affiliate IDs ────────────────────────────────────────────────────────────
export const AFF = {
  bookingCom:   process.env.NEXT_PUBLIC_BOOKING_AFF_ID      || '',
  agoda:        process.env.NEXT_PUBLIC_AGODA_AFF_ID         || '',
  kiwi:         process.env.NEXT_PUBLIC_KIWI_AFF_ID          || '',
  makemytrip:   process.env.NEXT_PUBLIC_MMT_AFF_ID           || '',
  easemytrip:   process.env.NEXT_PUBLIC_EMT_AFF_ID           || '',
  redbus:       process.env.NEXT_PUBLIC_REDBUS_AFF_ID        || '',
  klook:        process.env.NEXT_PUBLIC_KLOOK_AFF_ID         || '',
  getyourguide: process.env.NEXT_PUBLIC_GYG_AFF_ID           || '',
  policybazaar: process.env.NEXT_PUBLIC_PB_AFF_ID            || '',
  bankbazaar:   process.env.NEXT_PUBLIC_BB_AFF_ID            || '',
  amazon:       process.env.NEXT_PUBLIC_AMAZON_TAG           || 'tripwise-21',
}

// ─── UTM tag helper ───────────────────────────────────────────────────────────
function addUtm(p: URLSearchParams, medium = 'affiliate') {
  p.set('utm_source', 'tripwise')
  p.set('utm_medium', medium)
  p.set('utm_campaign', 'tripwise')
}
/** @deprecated — use addUtm(p) instead */
function utm(medium = 'affiliate') {
  return `utm_source=tripwise&utm_medium=${medium}&utm_campaign=tripwise`
}

// ─── Hotels ───────────────────────────────────────────────────────────────────
export function bookingComUrl(city: string, checkin?: string, checkout?: string, guests = 2) {
  const p = new URLSearchParams({ ss: city, lang: 'en-gb', currency: 'INR' })
  if (checkin)  p.set('checkin', checkin)
  if (checkout) p.set('checkout', checkout)
  p.set('group_adults', String(guests))
  if (AFF.bookingCom) p.set('aid', AFF.bookingCom)
  addUtm(p)
  return `https://www.booking.com/searchresults.html?${p}`
}

export function bookingComHotelUrl(hotelName: string, city: string, checkin?: string, checkout?: string) {
  const p = new URLSearchParams({ ss: `${hotelName} ${city}`, lang: 'en-gb', currency: 'INR' })
  if (checkin)  p.set('checkin', checkin)
  if (checkout) p.set('checkout', checkout)
  if (AFF.bookingCom) p.set('aid', AFF.bookingCom)
  return `https://www.booking.com/searchresults.html?${p}`
}

export function agodaUrl(city: string, checkin?: string, checkout?: string, guests = 2) {
  const p = new URLSearchParams({ city, los: checkin && checkout ? String(Math.max(1, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000))) : '1', adults: String(guests), currency_code: 'INR' })
  if (AFF.agoda) p.set('cid', AFF.agoda)
  return `https://www.agoda.com/search?${p}`
}

// ─── Flights ──────────────────────────────────────────────────────────────────
export function makemytripFlightUrl(from: string, to: string, date: string, adults = 1) {
  // MMT format: /flights/domestic-results#FROM-TO-DDMMYYYY-adults-child-infants-E-0-1
  const [y, m, d2] = date.split('-')
  const mmtDate    = `${d2}${m}${y}`
  const base = `https://www.makemytrip.com/flights/domestic-results#${from.toUpperCase()}-${to.toUpperCase()}-${mmtDate}-${adults}-0-0-E-0-1`
  return AFF.makemytrip ? `${base}&affiliateCode=${AFF.makemytrip}` : base
}

export function easemytripFlightUrl(from: string, to: string, date: string, adults = 1) {
  const p = new URLSearchParams({ orig: from.toUpperCase(), dest: to.toUpperCase(), dd: date, pax: String(adults), tt: '1' })
  if (AFF.easemytrip) p.set('aff', AFF.easemytrip)
  return `https://www.easemytrip.com/flights/domestic-flights.aspx?${p}`
}

export function skyscannerFlightUrl(from: string, to: string, date: string, adults = 1) {
  const [y, m, d2] = date.split('-')
  return `https://www.skyscanner.co.in/flights/${from.toLowerCase()}/${to.toLowerCase()}/${y}${m}${d2}/?adults=${adults}&currency=INR&locale=en-IN&market=IN`
}

// Kiwi.com (TravelPayouts affiliate program)
// Affiliate ID goes in the `affilid` query param
export function kiwiFlightUrl(from: string, to: string, date: string, adults = 1, tripType: 'one-way' | 'round' = 'one-way') {
  const fromSlug = from.toLowerCase().replace(/\s+/g, '-') + '-india'
  const toSlug   = to.toLowerCase().replace(/\s+/g, '-')   + '-india'
  const p = new URLSearchParams()
  p.set('adults', String(adults))
  p.set('currency', 'INR')
  if (AFF.kiwi) p.set('affilid', AFF.kiwi)
  const path = tripType === 'round'
    ? `https://www.kiwi.com/en/search/results/${fromSlug}/${toSlug}/${date}/return/${date}`
    : `https://www.kiwi.com/en/search/results/${fromSlug}/${toSlug}/${date}`
  return `${path}?${p}`
}

// ─── Buses ────────────────────────────────────────────────────────────────────
export function redbusUrl(from: string, to: string, date?: string) {
  const f = from.toLowerCase().replace(/\s+/g, '-')
  const t2 = to.toLowerCase().replace(/\s+/g, '-')
  let url = `https://www.redbus.in/bus-tickets/${f}-to-${t2}`
  if (date) {
    const [, m, d2] = date.split('-')
    url += `?doj=${d2}-${m}-${date.slice(0, 4)}`
  }
  return AFF.redbus ? `${url}${date ? '&' : '?'}${utm()}&aff=${AFF.redbus}` : url
}

export function abhiBusUrl(from: string, to: string, date?: string) {
  const p = new URLSearchParams({ src: from, dst: to })
  if (date) p.set('onwardDate', date)
  return `https://www.abhibus.com/bus-tickets?${p}`
}

// ─── Activities ───────────────────────────────────────────────────────────────
export function klookUrl(query: string, city: string) {
  const p = new URLSearchParams({ query: `${query} ${city}`, country_id: 'IN' })
  if (AFF.klook) p.set('aff_id', AFF.klook)
  return `https://www.klook.com/search/?${p}`
}

export function getyourguideUrl(query: string, city: string) {
  const p = new URLSearchParams({ q: `${query} ${city}`, currency: 'INR' })
  if (AFF.getyourguide) p.set('partner_id', AFF.getyourguide)
  return `https://www.getyourguide.com/s/?${p}`
}

// ─── Insurance ────────────────────────────────────────────────────────────────
export function policyBazaarTravelUrl(destination?: string) {
  const p = new URLSearchParams()
  addUtm(p, 'cpa')
  if (AFF.policybazaar) p.set('utm_term', AFF.policybazaar)
  const dest = destination ? `/${destination.toLowerCase().replace(/\s+/g, '-')}` : ''
  return `https://www.policybazaar.com/insurance/travel-insurance${dest}/?${p}`
}

export function coverfoxInsuranceUrl() {
  return `https://www.coverfox.com/travel-insurance/?${utm('cpa')}`
}

// ─── Credit Cards (highest commission!) ──────────────────────────────────────
export function bankBazaarCCUrl(card?: string) {
  const p = new URLSearchParams()
  addUtm(p, 'cpa')
  if (AFF.bankbazaar) p.set('ref', AFF.bankbazaar)
  const slug = card ? `/credit-card/${card}-credit-card.html` : '/credit-card/travel-credit-cards.html'
  return `https://www.bankbazaar.com${slug}?${p}`
}

export function creditMantriCCUrl(card?: string) {
  const p = new URLSearchParams()
  addUtm(p, 'cpa')
  const category = card || 'travel-credit-cards'
  return `https://www.creditmantri.com/credit-card/${category}/?${p}`
}

// ─── Amazon affiliate for travel gear ─────────────────────────────────────────
export function amazonUrl(query: string) {
  const p = new URLSearchParams({ k: query, tag: AFF.amazon, currency: 'INR' })
  return `https://www.amazon.in/s?${p}`
}

// ─── Recommended credit cards data ───────────────────────────────────────────
export interface CreditCard {
  id: string
  name: string
  bank: string
  tagline: string
  benefits: string[]
  annual_fee: string
  welcome_bonus: string
  travel_perk: string
  commission_note: string
  cta_url: string
  badge?: string
  color: string
}

export const TRAVEL_CREDIT_CARDS: CreditCard[] = [
  {
    id: 'hdfc-regalia-gold',
    name: 'Regalia Gold',
    bank: 'HDFC Bank',
    tagline: 'Best overall travel card',
    benefits: ['8x points on travel', 'Airport lounge access India', 'Travel insurance ₹50L', 'Forex markup 2%'],
    annual_fee: '₹2,500 (waived on ₹3L spend)',
    welcome_bonus: '5,000 reward points',
    travel_perk: '12 complimentary domestic lounge visits/year',
    commission_note: '₹1,500/approved card via BankBazaar',
    cta_url: bankBazaarCCUrl('hdfc-regalia-gold'),
    badge: '⭐ Most Popular',
    color: 'from-blue-600 to-blue-800',
  },
  {
    id: 'axis-magnus',
    name: 'Magnus',
    bank: 'Axis Bank',
    tagline: 'Best for rewards on travel spend',
    benefits: ['25x EDGE Rewards on travel', 'Unlimited domestic lounge', 'Golf privileges', 'Concierge 24/7'],
    annual_fee: '₹12,500',
    welcome_bonus: '25,000 EDGE points (worth ₹5,000)',
    travel_perk: 'Unlimited airport lounge (domestic + 8 international)',
    commission_note: '₹2,000/approved card via BankBazaar',
    cta_url: bankBazaarCCUrl('axis-magnus'),
    badge: '🏆 Best Rewards',
    color: 'from-purple-600 to-purple-800',
  },
  {
    id: 'sbi-card-elite',
    name: 'Card ELITE',
    bank: 'SBI Card',
    tagline: 'Great for SBI customers',
    benefits: ['5x points on travel/dining', '2 international lounge visits/qtr', 'Movie tickets ₹6K/yr', '1% fuel surcharge waiver'],
    annual_fee: '₹4,999',
    welcome_bonus: 'e-Gift Voucher worth ₹5,000',
    travel_perk: '6 domestic + 2 international lounge visits/year',
    commission_note: '₹1,200/approved card via BankBazaar',
    cta_url: bankBazaarCCUrl('sbi-card-elite'),
    color: 'from-indigo-600 to-indigo-800',
  },
  {
    id: 'icici-emeralde',
    name: 'Emeralde',
    bank: 'ICICI Bank',
    tagline: 'Premium lifestyle & travel',
    benefits: ['Airport lounge unlimited', 'Travel insurance ₹3Cr', 'Golf privileges', '4x points on international spends'],
    annual_fee: '₹12,000',
    welcome_bonus: '12,500 reward points',
    travel_perk: 'Unlimited domestic + international lounge',
    commission_note: '₹1,800/approved card via BankBazaar',
    cta_url: bankBazaarCCUrl('icici-emeralde'),
    color: 'from-emerald-600 to-emerald-800',
  },
  {
    id: 'amex-platinum-travel',
    name: 'Platinum Travel',
    bank: 'Amex',
    tagline: 'Best for frequent flyers',
    benefits: ['Milestone bonus: ₹10K Flipkart voucher', 'Priority Pass membership', 'Taj hotels benefits', '5,000 bonus miles yearly'],
    annual_fee: '₹5,000',
    welcome_bonus: '10,000 Membership Rewards points',
    travel_perk: '8 domestic lounge + Priority Pass internationally',
    commission_note: '₹1,500/approved card via BankBazaar',
    cta_url: bankBazaarCCUrl('american-express-platinum-travel'),
    badge: '✈️ Flyer Favourite',
    color: 'from-amber-600 to-amber-800',
  },
  {
    id: 'indusind-pinnacle',
    name: 'Pinnacle World',
    bank: 'IndusInd Bank',
    tagline: 'Zero forex markup',
    benefits: ['0% forex markup', 'Unlimited lounge access', '2x points on international spend', 'Global concierge'],
    annual_fee: '₹9,999',
    welcome_bonus: '10,000 reward points',
    travel_perk: 'Unlimited lounge access worldwide',
    commission_note: '₹2,000/approved card via BankBazaar',
    cta_url: bankBazaarCCUrl('indusind-pinnacle-world'),
    color: 'from-rose-600 to-rose-800',
  },
]

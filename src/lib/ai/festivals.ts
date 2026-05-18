// Major Indian festival calendar — surfaces closures, surge pricing, and bucket-list events.
// Approximate dates (lunar festivals shift year-to-year). Used as AI context.

interface Festival {
  name: string
  monthRange: [number, number] // [startMonth, endMonth] 1-12
  dayRange?: [number, number]
  regions: string[] // lowercase keywords (state/city/region) — '*' = pan-India
  note: string
}

const FESTIVALS: Festival[] = [
  { name: 'Diwali',         monthRange: [10, 11], regions: ['*'],
    note: 'Pan-India festival of lights. Hotels surge 50-100%. Book 30+ days out. Many shops closed for 2 days. Air quality worsens in North India.' },
  { name: 'Holi',           monthRange: [3, 3],   regions: ['*'],
    note: 'Festival of colours. Mathura/Vrindavan/Barsana are iconic but very crowded. Wear old clothes. Avoid outdoors with kids/pets.' },
  { name: 'Pushkar Mela',   monthRange: [10, 11], regions: ['rajasthan', 'pushkar', 'ajmer'],
    note: 'Pushkar Camel Fair — once-in-a-lifetime. Book accommodation 60+ days ahead, prices 3x normal.' },
  { name: 'Hornbill',       monthRange: [12, 12], regions: ['nagaland', 'kohima', 'northeast'],
    note: 'Hornbill Festival in Nagaland Dec 1-10 — flagship tribal festival. Permits required for Nagaland (ILP). Hotels in Kohima/Kisama fill up.' },
  { name: 'Onam',           monthRange: [8, 9],   regions: ['kerala'],
    note: 'Kerala harvest festival. Sadhya feasts, snake boat races (Aranmula, Vallamkali). Hotels busy; local feast experiences possible.' },
  { name: 'Pongal',         monthRange: [1, 1],   dayRange: [13, 17], regions: ['tamil', 'chennai', 'madurai'],
    note: 'Tamil harvest festival. Kolam art, jallikattu (bull taming) in some districts. Madurai Meenakshi temple specially decorated.' },
  { name: 'Durga Puja',     monthRange: [9, 10],  regions: ['bengal', 'kolkata', 'siliguri'],
    note: 'Kolkata transforms — pandal hopping at night, food stalls everywhere. Hotels book months ahead. Air/rail to Kolkata expensive.' },
  { name: 'Ganesh Chaturthi', monthRange: [8, 9], regions: ['maharashtra', 'mumbai', 'pune'],
    note: 'Mumbai 10-day festival ending with Visarjan immersion at Girgaum Chowpatty. Roads blocked. Lalbaugcha Raja queue is 12+ hours.' },
  { name: 'Navratri/Garba', monthRange: [9, 10],  regions: ['gujarat', 'ahmedabad', 'vadodara'],
    note: 'Gujarat 9-night dance festival. Garba/Dandiya at every ground. Best in Vadodara. Hotels booked solid.' },
  { name: 'Sunburn',        monthRange: [12, 12], regions: ['goa', 'pune'],
    note: 'Sunburn EDM festival ~Dec 27-29 in Pune (moved from Goa). Goa peak Christmas/NYE: hotels 3x rate, traffic gridlock.' },
  { name: 'Christmas/NYE',  monthRange: [12, 12], dayRange: [22, 31], regions: ['goa', 'kerala', 'pondicherry', 'andaman'],
    note: 'Peak coastal season. 3-4x normal prices. Book 90+ days. Andaman ferries fully booked.' },
  { name: 'Char Dham yatra',monthRange: [4, 11],  regions: ['uttarakhand', 'kedarnath', 'badrinath'],
    note: 'Char Dham (Yamunotri/Gangotri/Kedarnath/Badrinath) only open May-Oct. Registration mandatory (uttarakhandchardhamyatra.com). Helicopter slots sell out in March.' },
  { name: 'Ladakh season',  monthRange: [6, 9],   regions: ['ladakh', 'leh', 'nubra'],
    note: 'Leh-Manali highway typically open mid-May to mid-Oct. Pangong/Nubra permits required, daily quota. Acclimatize 2 days in Leh.' },
  { name: 'Eid (variable)', monthRange: [3, 6],   regions: ['*'],
    note: 'Eid dates shift annually (lunar). Old Delhi (Jama Masjid area) feasts are iconic — Karim\'s, Al Jawahar busy at iftar.' },
  { name: 'Ramadan',        monthRange: [2, 5],   regions: ['*'],
    note: 'Many Muslim-run restaurants open only iftar to suhur. Old Delhi/Hyderabad/Lucknow night food walks at peak quality.' },
  { name: 'Kumbh Mela',     monthRange: [1, 4],   regions: ['prayagraj', 'haridwar', 'ujjain', 'nashik'],
    note: 'Kumbh rotates between 4 cities every 3 years. Multi-million pilgrim gatherings — special darshan timings, extreme crowds, traffic restrictions.' },
  { name: 'Hampi season',   monthRange: [10, 2],  regions: ['hampi'],
    note: 'Hampi best Oct-Feb (cool). Avoid Apr-Jun (45°C+). Hampi Utsav cultural fest typically in Nov.' },
  { name: 'Rann Utsav',     monthRange: [11, 2],  regions: ['kutch', 'rann', 'bhuj'],
    note: 'White Rann of Kutch tent city open Nov-Feb only. Full moon nights are spectacular. Book tents 60+ days ahead.' },
  { name: 'Tulip Festival', monthRange: [3, 4],   regions: ['kashmir', 'srinagar'],
    note: 'Asia\'s largest tulip garden in Srinagar blooms for 3-4 weeks late March-April. Almond blossom + tulips overlap.' },
]

/**
 * Returns 1-3 sentences flagging festivals that overlap the trip date in this region.
 * Empty string if nothing relevant.
 */
export function getFestivalNote(destination: string, startDate: string, totalDays = 1): string {
  const dest = destination.toLowerCase()
  const start = new Date(startDate)
  const startMonth = start.getMonth() + 1
  const startDay = start.getDate()
  const endDate = new Date(start)
  endDate.setDate(start.getDate() + Math.max(0, totalDays - 1))
  const endMonth = endDate.getMonth() + 1

  const hits: string[] = []
  for (const f of FESTIVALS) {
    // Region match
    const regionMatch = f.regions.includes('*') || f.regions.some(r => dest.includes(r))
    if (!regionMatch) continue

    // Month overlap
    const monthOverlap =
      (startMonth >= f.monthRange[0] && startMonth <= f.monthRange[1]) ||
      (endMonth   >= f.monthRange[0] && endMonth   <= f.monthRange[1])
    if (!monthOverlap) continue

    // Day filter if specified
    if (f.dayRange && startMonth === f.monthRange[0] &&
        (startDay < f.dayRange[0] || startDay > f.dayRange[1])) {
      continue
    }

    hits.push(`${f.name}: ${f.note}`)
  }

  if (hits.length === 0) return ''
  return hits.slice(0, 3).join(' ')
}

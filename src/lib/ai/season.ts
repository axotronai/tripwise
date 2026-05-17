export function getSeasonNote(destination: string, startDate: string): string {
  const month = new Date(startDate).getMonth() + 1 // 1–12
  const dest  = destination.toLowerCase()

  // Monsoon: June–September
  if (month >= 6 && month <= 9) {
    if (dest.includes('ladakh') || dest.includes('spiti') || dest.includes('leh'))
      return 'Jul–Sep is PEAK season in Ladakh — clear skies, all roads open, perfect for outdoor adventures.'
    if (dest.includes('kerala') || dest.includes('munnar') || dest.includes('wayanad'))
      return 'Monsoon season — lush green hills, waterfalls in full flow, some treks slippery. Indoor wellness/Ayurveda recommended.'
    if (dest.includes('goa') || dest.includes('andaman'))
      return 'Monsoon season — rough seas, most beach watersports closed, many beach shacks shut. Plan cultural spots, waterfalls, indoor spa days.'
    if (dest.includes('manali') || dest.includes('shimla') || dest.includes('himachal'))
      return 'Monsoon — landslide risk on some roads. Stick to town activities and lower-altitude treks. Carry rain gear.'
    return 'Monsoon season — carry rain gear, prioritise covered attractions and morning outdoor activities before afternoon rains. Avoid waterlogged areas.'
  }

  // Winter: December–February
  if (month === 12 || month <= 2) {
    if (dest.includes('ladakh') || dest.includes('spiti'))
      return 'Winter — extremely cold (−20°C nights), many passes closed. Monastery visits and Chadar trek (Jan) are the draws.'
    if (dest.includes('goa') || dest.includes('kerala') || dest.includes('andaman'))
      return 'Peak tourist season — perfect sunny weather, all beaches and water activities fully open. Book well in advance, prices higher.'
    if (dest.includes('rajasthan') || dest.includes('jaipur') || dest.includes('jodhpur') || dest.includes('udaipur'))
      return 'Best season — pleasant days (20–25°C), cool evenings. Perfect for sightseeing. Carry a light jacket for after sunset.'
    return 'Winter — pleasant in most places. Ideal for daytime sightseeing. Carry a light jacket.'
  }

  // Summer: March–May
  if (month >= 3 && month <= 5) {
    if (dest.includes('manali') || dest.includes('shimla') || dest.includes('darjeeling') || dest.includes('ooty') || dest.includes('munnar'))
      return 'Peak hill station season — cool and refreshing escape from plains heat. Very crowded; book hotels and cabs well in advance.'
    if (dest.includes('rajasthan') || dest.includes('jaipur') || dest.includes('jodhpur'))
      return 'Summer — very hot (40–45°C). Plan major sightseeing only before 10AM or after 5PM. Midday in AC. Stay very hydrated.'
    if (dest.includes('goa'))
      return 'Pre-monsoon — hot and humid, fewer tourists, lower prices. Some beach shacks closing. Good for budget travel.'
    return 'Summer — hot in most plains. Prefer early morning or evening outdoor activities. Stay hydrated, carry sunscreen.'
  }

  // Post-monsoon: October–November
  return 'Post-monsoon (Oct–Nov) — pleasant weather, lush greenery, not too crowded yet. One of the best travel windows.'
}

/** Returns season label suitable for packing list page dropdown */
export function getSeasonLabel(startDate: string): string {
  const month = new Date(startDate).getMonth() + 1
  if (month >= 6 && month <= 9)  return 'Monsoon (Jul-Sep)'
  if (month === 12 || month <= 2) return 'Winter (Oct-Feb)'
  if (month >= 3 && month <= 5)  return 'Summer (Mar-Jun)'
  return 'Winter (Oct-Feb)' // Oct-Nov — closest label in packing list dropdown
}

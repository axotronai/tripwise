// India is multi-climate — a single "monsoon = avoid" rule is wrong.
// Tamil Nadu/Pondicherry: NE monsoon Oct-Dec (OPPOSITE of West coast).
// Ladakh: Jun-Sep is peak (rest of year roads closed).
// Rann of Kutch: only Nov-Feb (tent city closed otherwise).
// Char Dham: May-Oct only.
// This function returns concise, season+region-specific guidance for AI prompts.

type Region =
  | 'goa' | 'kerala' | 'andaman' | 'pondicherry' | 'chennai' | 'tamil' | 'madurai'
  | 'rajasthan' | 'jaipur' | 'jodhpur' | 'udaipur' | 'jaisalmer' | 'pushkar'
  | 'manali' | 'shimla' | 'himachal' | 'kasol' | 'spiti' | 'dharamshala'
  | 'ladakh' | 'leh' | 'nubra' | 'kashmir' | 'srinagar' | 'gulmarg'
  | 'uttarakhand' | 'rishikesh' | 'haridwar' | 'mussoorie' | 'nainital' | 'auli'
  | 'sikkim' | 'gangtok' | 'darjeeling' | 'meghalaya' | 'shillong' | 'cherrapunji'
  | 'assam' | 'kaziranga' | 'nagaland' | 'kohima' | 'arunachal' | 'tawang'
  | 'gujarat' | 'kutch' | 'rann' | 'bhuj' | 'ahmedabad' | 'somnath' | 'dwarka'
  | 'maharashtra' | 'mumbai' | 'pune' | 'lonavala' | 'mahabaleshwar'
  | 'karnataka' | 'bangalore' | 'mysore' | 'coorg' | 'hampi' | 'gokarna'
  | 'munnar' | 'wayanad' | 'alleppey' | 'kovalam'
  | 'varanasi' | 'lucknow' | 'agra' | 'delhi' | 'amritsar'
  | 'bhutan' | 'gangotri' | 'kedarnath' | 'badrinath' | 'yamunotri'

function matchRegion(dest: string): Region[] {
  const d = dest.toLowerCase()
  const matched: Region[] = []
  const all: Region[] = [
    'goa','kerala','andaman','pondicherry','chennai','tamil','madurai',
    'rajasthan','jaipur','jodhpur','udaipur','jaisalmer','pushkar',
    'manali','shimla','himachal','kasol','spiti','dharamshala',
    'ladakh','leh','nubra','kashmir','srinagar','gulmarg',
    'uttarakhand','rishikesh','haridwar','mussoorie','nainital','auli',
    'sikkim','gangtok','darjeeling','meghalaya','shillong','cherrapunji',
    'assam','kaziranga','nagaland','kohima','arunachal','tawang',
    'gujarat','kutch','rann','bhuj','ahmedabad','somnath','dwarka',
    'maharashtra','mumbai','pune','lonavala','mahabaleshwar',
    'karnataka','bangalore','mysore','coorg','hampi','gokarna',
    'munnar','wayanad','alleppey','kovalam',
    'varanasi','lucknow','agra','delhi','amritsar',
    'bhutan','gangotri','kedarnath','badrinath','yamunotri',
  ]
  for (const r of all) if (d.includes(r)) matched.push(r)
  return matched
}

const has = (regions: Region[], ...keys: Region[]) => keys.some(k => regions.includes(k))

export function getSeasonNote(destination: string, startDate: string): string {
  const month = new Date(startDate).getMonth() + 1
  const r = matchRegion(destination)

  // ─── SW MONSOON (West coast / Western Ghats): Jun–Sep ─────────────────
  if (month >= 6 && month <= 9) {
    if (has(r, 'ladakh', 'leh', 'nubra', 'spiti'))
      return 'PEAK season — clear skies, all high passes (Khardung La, Chang La) open, Pangong/Nubra accessible. ILP permits required. Acclimatize 2 days in Leh.'
    if (has(r, 'kashmir', 'srinagar', 'gulmarg'))
      return 'Pleasant 15-25°C, Mughal gardens in full bloom, Dal Lake calm. Amarnath Yatra Jul-Aug brings huge pilgrim crowds.'
    if (has(r, 'meghalaya', 'cherrapunji', 'shillong'))
      return 'Wettest place on earth — waterfalls (Nohkalikai, Seven Sisters) at peak flow. Roads slippery. Carry rain gear & waterproof shoes.'
    if (has(r, 'kerala', 'munnar', 'wayanad', 'alleppey'))
      return 'Monsoon — lush hills, Ayurveda treatments most effective (per tradition), waterfalls peak. Some treks closed. Houseboat rates lower.'
    if (has(r, 'goa', 'gokarna'))
      return 'Off-season — beach shacks closed, watersports stopped, rough seas. Lush green inland (Dudhsagar Falls at peak). Hotels 50% off. Plan indoor/cultural.'
    if (has(r, 'manali','shimla','himachal','kasol','dharamshala','uttarakhand','rishikesh','mussoorie','nainital'))
      return 'Monsoon — LANDSLIDE RISK on hill roads (esp. Manali-Leh, Char Dham). Many treks closed. Stick to lower elevations. Carry rain gear.'
    if (has(r, 'andaman'))
      return 'Off-season — heavy rain, ferries cancelled often. Avoid Jun-Aug. Sep improves but still unstable.'
    if (has(r, 'rajasthan','jaipur','jodhpur','udaipur','jaisalmer'))
      return 'Monsoon-light — pleasant 25-32°C, occasional showers (Jul-Aug). Mehrangarh & Amber forts uncrowded. Teej festival in Jaipur.'
    if (has(r, 'gujarat','kutch','rann','bhuj'))
      return 'Off-season for Rann of Kutch (closed). Saurashtra coast green but muddy. Wait for Nov.'
    if (has(r, 'sikkim','gangtok','darjeeling'))
      return 'Monsoon — landslide risk. Many treks (Goecha La) closed. Aug-Sep improves. Tea estates lush.'
    if (has(r, 'tamil','chennai','pondicherry','madurai'))
      return 'Pre NE monsoon — hot/humid 30-35°C. Inland TN okay; coast (Mahabalipuram) bearable. Real monsoon arrives Oct-Dec.'
    return 'Monsoon — carry rain gear, prioritise covered attractions and morning outdoor activities. Avoid waterlogged areas.'
  }

  // ─── WINTER: Dec–Feb ───────────────────────────────────────────────────
  if (month === 12 || month <= 2) {
    if (has(r, 'ladakh','leh','spiti'))
      return 'EXTREME winter — temps drop to -20°C nights. Most passes closed, Leh airport may suspend ops in storms. Only Chadar Trek (Jan), monastery visits, frozen Pangong.'
    if (has(r, 'kashmir','srinagar','gulmarg'))
      return 'Snow season — Gulmarg world-class skiing (Gondola to Apharwat), Srinagar shikara on freezing Dal. Carry layers + ice grips. Pheran rentals popular.'
    if (has(r, 'goa','andaman','gokarna'))
      return 'PEAK season — perfect 24-30°C, all beaches/watersports open. Book 60+ days ahead, prices 2-3x. Dec 22-Jan 5 is mayhem.'
    if (has(r, 'kerala','munnar','alleppey','kovalam','wayanad'))
      return 'Peak tourist season — clear, dry, perfect for backwaters + tea plantations. Book houseboats early. Sabarimala pilgrimage season Nov-Jan.'
    if (has(r, 'rajasthan','jaipur','jodhpur','udaipur','jaisalmer','pushkar'))
      return 'BEST season — crisp days 20-25°C, cool evenings (5-10°C). Perfect for forts/desert. Jaisalmer desert camps in full swing. Pushkar Mela Nov.'
    if (has(r, 'gujarat','kutch','rann','bhuj'))
      return 'PEAK season — Rann Utsav tent city open (Nov-Feb). Full moon nights spectacular. Bird migration at Little Rann. Book tents 60+ days ahead.'
    if (has(r, 'tamil','chennai','pondicherry','madurai'))
      return 'NE monsoon tail (Dec) + cool season — 18-28°C, occasional rain. Pongal Jan 13-17 huge festival. Best beach weather at Marina/Pondi.'
    if (has(r, 'meghalaya','shillong','cherrapunji'))
      return 'Cool/dry 5-15°C, clearer waterfall views. Wei Sawdong & Krang Suri pools chilly. Living root bridges still accessible.'
    if (has(r, 'sikkim','gangtok','darjeeling','arunachal','tawang'))
      return 'Cold, possible snow at higher altitudes. Tawang/Lachung snowfall, Tsomgo Lake frozen. Carry heavy layers. Some passes (Nathula) close in storms.'
    if (has(r, 'nagaland','kohima'))
      return 'Hornbill Festival Dec 1-10 in Kisama — flagship event. Kohima book 90+ days ahead. ILP required for Nagaland.'
    if (has(r, 'agra','delhi','varanasi','lucknow','amritsar'))
      return 'Cold & foggy — Dec/Jan mornings <5°C, dense fog disrupts flights/trains. Layers essential. Best for sightseeing post-fog (10am-4pm).'
    if (has(r, 'bangalore','mysore','coorg','hampi'))
      return 'Pleasant 15-28°C — best season in South Karnataka. Hampi cool & comfortable for ruins. Coorg coffee blossom Dec.'
    if (has(r, 'uttarakhand','rishikesh','mussoorie','nainital','auli'))
      return 'Cold — Auli ski season opens Jan. Mussoorie/Nainital snowfall possible. Rishikesh rafting still operates (calmer water).'
    return 'Winter — pleasant in most plains. Ideal for daytime sightseeing. Carry a light jacket; heavier in north/hills.'
  }

  // ─── SUMMER: Mar–May ───────────────────────────────────────────────────
  if (month >= 3 && month <= 5) {
    if (has(r, 'manali','shimla','himachal','kasol','dharamshala','mussoorie','nainital','darjeeling','sikkim','coorg','munnar','wayanad'))
      return 'PEAK hill station season — cool escape from plains heat. Very crowded, book 30+ days. Mall Roads packed. Rohtang Pass opens late May.'
    if (has(r, 'ladakh','leh','spiti'))
      return 'Shoulder season — Leh accessible by air. Manali-Leh highway opens late May, Srinagar-Leh opens early Apr. Pangong opens May.'
    if (has(r, 'kashmir','srinagar','gulmarg'))
      return 'BEAUTIFUL — Tulip Festival (late Mar-Apr, Asia\'s largest), almond blossom, comfortable 15-25°C. Houseboat season starts.'
    if (has(r, 'rajasthan','jaipur','jodhpur','jaisalmer'))
      return 'SCORCHING 40-48°C. Sightseeing only 6-10am + after 6pm. Hotels heavily discounted. Indoor museums + AC stepwells. Stay very hydrated.'
    if (has(r, 'goa','gokarna'))
      return 'Pre-monsoon — hot & humid 32-35°C, fewer tourists, prices 40% lower. Some beach shacks closing late May.'
    if (has(r, 'andaman'))
      return 'Excellent — calm seas, peak diving visibility, lower crowds than Dec peak. Heat manageable on islands due to sea breeze.'
    if (has(r, 'kerala','munnar','alleppey','kovalam'))
      return 'Hot in coastal areas (Kochi/Alleppey), pleasant in hills (Munnar 20-28°C). Vishu festival Apr. Houseboat rates fair.'
    if (has(r, 'gujarat','kutch','rann','bhuj'))
      return 'Very hot 40-45°C, Rann tent city closed. Avoid unless heading to Saputara hills.'
    if (has(r, 'tamil','chennai','pondicherry','madurai'))
      return 'HOT 35-40°C + humid. Avoid midday. Yelagiri/Yercaud hills better. Beach trips bearable early morning/late evening.'
    if (has(r, 'sikkim','gangtok'))
      return 'Best season — rhododendron blooms (Yumthang Valley), clear Kanchenjunga views. Book Nathula/Tsomgo permits early.'
    if (has(r, 'uttarakhand','rishikesh','haridwar','gangotri','kedarnath','badrinath','yamunotri'))
      return 'Char Dham opens (May 1 typically). Pre-register at uttarakhandchardhamyatra.com. Helicopter slots sold out in March. Rishikesh rafting peak.'
    if (has(r, 'agra','delhi','varanasi','lucknow'))
      return 'Hot 38-45°C. Taj Mahal best at sunrise. Loo (hot wind) makes outdoor brutal post-noon. Mango season starts (Apr-Jun).'
    if (has(r, 'meghalaya','shillong','cherrapunji','assam','kaziranga'))
      return 'Pre-monsoon — comfortable 18-28°C. Kaziranga safaris run till mid-May (closes for monsoon).'
    if (has(r, 'arunachal','tawang','nagaland'))
      return 'Pleasant 10-22°C. Rhododendron blooms in Tawang. ILP required. Best window before monsoon Jun.'
    return 'Summer — hot in most plains. Prefer early morning or evening outdoor activities. Stay hydrated, carry sunscreen.'
  }

  // ─── POST-MONSOON / NE MONSOON (TN): Oct–Nov ──────────────────────────
  if (has(r, 'tamil','chennai','pondicherry','madurai'))
    return 'NE MONSOON peak (Oct-Dec) — Tamil Nadu/Pondicherry gets heaviest rain now (OPPOSITE of rest of India). Plan indoor temples/heritage. Cyclones possible.'
  if (has(r, 'andaman'))
    return 'Excellent — post-monsoon calm seas resume, diving/snorkelling fully open. Lower prices than Dec peak.'
  if (has(r, 'goa','kerala','gokarna','munnar'))
    return 'Sweet spot — post-monsoon greenery, fewer crowds, prices lower than Dec peak. Beach shacks reopen by mid-Oct.'
  if (has(r, 'rajasthan','pushkar','jaipur'))
    return 'Excellent — pleasant 25-32°C, festival season (Navratri, Dussehra, Pushkar Mela Nov, Diwali). Book early during festivals.'
  if (has(r, 'ladakh','leh','spiti'))
    return 'Closing window — by mid-Oct passes start closing, Leh airport only access. Last chance for Nubra/Pangong before snow.'
  if (has(r, 'gujarat','kutch','rann'))
    return 'Rann Utsav starts Nov 1. Pre-Diwali cooler 20-30°C. Garba/Navratri (Oct) in Ahmedabad/Vadodara.'
  if (has(r, 'meghalaya','shillong','cherrapunji'))
    return 'Post-monsoon waterfalls still strong, weather clearing. Living root bridges ideal trek window.'
  if (has(r, 'sikkim','gangtok','darjeeling','arunachal'))
    return 'PEAK clarity — best Kanchenjunga/Himalayan views, post-monsoon air crystal clear. Goecha La trek opens.'
  if (has(r, 'kashmir','srinagar'))
    return 'Autumn — Chinar trees turn red/orange, comfortable 10-20°C. Saffron harvest in Pampore (Oct-Nov).'
  return 'Post-monsoon (Oct–Nov) — pleasant weather, lush greenery, not too crowded. One of the best travel windows.'
}

/** Returns season label for packing list dropdown. */
export function getSeasonLabel(startDate: string): string {
  const month = new Date(startDate).getMonth() + 1
  if (month >= 6 && month <= 9)  return 'Monsoon (Jul-Sep)'
  if (month === 12 || month <= 2) return 'Winter (Oct-Feb)'
  if (month >= 3 && month <= 5)  return 'Summer (Mar-Jun)'
  return 'Winter (Oct-Feb)'
}

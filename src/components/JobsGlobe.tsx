'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

// ── Massive city → coordinates database ───────────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  // US Major Cities
  'new york': [40.7128, -74.006], 'manhattan': [40.7831, -73.9712],
  'brooklyn': [40.6782, -73.9442], 'san francisco': [37.7749, -122.4194],
  'seattle': [47.6062, -122.3321], 'austin': [30.2672, -97.7431],
  'boston': [42.3601, -71.0589], 'chicago': [41.8781, -87.6298],
  'los angeles': [34.0522, -118.2437], 'denver': [39.7392, -104.9903],
  'atlanta': [33.749, -84.388], 'miami': [25.7617, -80.1918],
  'dallas': [32.7767, -96.797], 'washington': [38.9072, -77.0369],
  'portland': [45.5231, -122.6765], 'san jose': [37.3382, -121.8863],
  'phoenix': [33.4484, -112.074], 'philadelphia': [39.9526, -75.1652],
  'san antonio': [29.4241, -98.4936], 'san diego': [32.7157, -117.1611],
  'houston': [29.7604, -95.3698], 'charlotte': [35.2271, -80.8431],
  'indianapolis': [39.7684, -86.1581], 'jacksonville': [30.3322, -81.6557],
  'columbus': [39.9612, -82.9988], 'nashville': [36.1627, -86.7816],
  'minneapolis': [44.9778, -93.265], 'raleigh': [35.7796, -78.6382],
  'richmond': [37.5407, -77.436], 'pittsburgh': [40.4406, -79.9959],
  'salt lake': [40.7608, -111.891], 'kansas city': [39.0997, -94.5786],
  'st louis': [38.627, -90.1994], 'orlando': [28.5383, -81.3792],
  'tampa': [27.9506, -82.4572], 'las vegas': [36.1699, -115.1398],
  'sacramento': [38.5816, -121.4944], 'memphis': [35.1495, -90.0490],
  'louisville': [38.2527, -85.7585], 'baltimore': [39.2904, -76.6122],
  'cincinnati': [39.1031, -84.512], 'detroit': [42.3314, -83.0458],
  'milwaukee': [43.0389, -87.9065], 'albuquerque': [35.0844, -106.6504],
  'tucson': [32.2226, -110.9747], 'fresno': [36.7378, -119.7871],
  'mesa': [33.4152, -111.8315], 'omaha': [41.2565, -95.9345],
  'colorado springs': [38.8339, -104.8214], 'reno': [39.5296, -119.8138],
  'virginia beach': [36.8529, -75.978], 'long beach': [33.7701, -118.1937],
  'oakland': [37.8044, -122.2712],
  'tulsa': [36.154, -95.9928], 'arlington': [32.7357, -97.1081],
  'new orleans': [29.9511, -90.0715], 'wichita': [37.6872, -97.3301],
  'bakersfield': [35.3733, -119.0187],
  'aurora': [39.7294, -104.8319], 'anaheim': [33.8366, -117.9143],
  'santa ana': [33.7455, -117.8677], 'corpus christi': [27.8006, -97.3964],
  'riverside': [33.9806, -117.3755], 'lexington': [38.0406, -84.5037],
  'stockton': [37.9577, -121.2908], 'henderson': [36.0395, -114.9817],
  'saint paul': [44.9537, -93.09], 'st. paul': [44.9537, -93.09],
  'fort worth': [32.7555, -97.3308], 'norfolk': [36.8508, -76.2859],
  'jersey city': [40.7178, -74.0431], 'plano': [33.0198, -96.6989],
  'madison': [43.0731, -89.4012], 'durham': [35.994, -78.8986],
  'lubbock': [33.5779, -101.8552], 'chandler': [33.3062, -111.8413],
  'gilbert': [33.3528, -111.789], 'glendale': [33.5387, -112.1859],
  'scottsdale': [33.4942, -111.9261], 'boise': [43.615, -116.2023],
  'spokane': [47.6587, -117.426], 'tacoma': [47.2529, -122.4443],
  'highland park': [40.1978, -74.9271],
  'palo alto': [37.4419, -122.143], 'mountain view': [37.3861, -122.0839],
  'sunnyvale': [37.3688, -122.0363], 'santa clara': [37.3541, -121.9552],
  'redwood city': [37.4852, -122.2364], 'menlo park': [37.4529, -122.182],
  'cupertino': [37.323, -122.0322], 'fremont': [37.5485, -121.9886],
  // Additional US cities for Adzuna coverage
  'schiller park': [41.9645, -87.8712], 'dayton': [39.7589, -84.1916],
  'suitland': [38.8487, -76.9239], 'irvine': [33.6846, -117.8265],
  'tempe': [33.4255, -111.9400], 'pasadena': [34.1478, -118.1445],
  'santa monica': [34.0195, -118.4912], 'redmond': [47.6740, -122.1215],
  'bellevue': [47.6101, -122.2015], 'cambridge': [42.3736, -71.1097],
  'hoboken': [40.7440, -74.0324], 'stamford': [41.0534, -73.5387],
  'bethesda': [38.9847, -77.0947], 'tysons': [38.9187, -77.2311],
  'mclean': [38.9339, -77.1773], 'herndon': [38.9696, -77.3861],
  'reston': [38.9586, -77.3570], 'ashburn': [39.0438, -77.4874],
  'sterling': [39.0062, -77.4286], 'leesburg': [39.1157, -77.5636],
  'manassas': [38.7509, -77.4753], 'woodbridge': [38.6582, -77.2497],
  'fairfax': [38.8462, -77.3064], 'alexandria': [38.8048, -77.0469],
  'falls church': [38.8823, -77.1711], 'rockville': [39.0840, -77.1528],
  'silver spring': [38.9907, -77.0261], 'columbia': [39.2037, -76.8610],
  'annapolis': [38.9784, -76.4922], 'wilmington': [39.7391, -75.5398],
  'trenton': [40.2206, -74.7695], 'newark': [40.7357, -74.1724],
  'white plains': [41.0340, -73.7629], 'yonkers': [40.9312, -73.8988],
  'new haven': [41.3083, -72.9279], 'hartford': [41.7658, -72.6734],
  'providence': [41.8240, -71.4128], 'worcester': [42.2626, -71.8023],
  'springfield': [42.1015, -72.5898], 'burlington': [44.4759, -73.2121],
  'rochester': [43.1566, -77.6088], 'buffalo': [42.8864, -78.8784],
  'syracuse': [43.0481, -76.1474], 'albany': [42.6526, -73.7562],
  'cranbury': [40.3154, -74.5135], 'parsippany': [40.8579, -74.4260],
  'iselin': [40.5754, -74.3223], 'edison': [40.5187, -74.4121],
  'princeton': [40.3573, -74.6672], 'morristown': [40.7968, -74.4815],
  'mount laurel': [39.9340, -74.8910], 'cherry hill': [39.9318, -75.0307],
  'king of prussia': [40.0887, -75.3963], 'conshohocken': [40.0793, -75.3016],
  'malvern': [40.0362, -75.5138], 'blue bell': [40.1523, -75.2663],
  'wayne': [40.0440, -75.3877], 'exton': [40.0290, -75.6210],
  'fort lauderdale': [26.1224, -80.1373], 'west palm beach': [26.7153, -80.0534],
  'boca raton': [26.3683, -80.1289], 'hollywood': [26.0112, -80.1495],
  'clearwater': [27.9659, -82.8001], 'st petersburg': [27.7676, -82.6403],
  'sarasota': [27.3364, -82.5307], 'naples': [26.1420, -81.7948],
  'chattanooga': [35.0456, -85.3097], 'knoxville': [35.9606, -83.9207],
  'huntsville': [34.7304, -86.5861], 'birmingham': [33.5186, -86.8104],
  'greenville': [34.8526, -82.3940], 'charleston': [32.7765, -79.9311],
  'savannah': [32.0809, -81.0912], 'des moines': [41.5868, -93.6250],
  'little rock': [34.7465, -92.2896], 'jackson': [32.2988, -90.1848],
  'montgomery': [32.3792, -86.3077], 'baton rouge': [30.4515, -91.1871],
  'shreveport': [32.5252, -93.7502], 'el paso': [31.7619, -106.4850],
  'laredo': [27.5036, -99.5076], 'mcallen': [26.2034, -98.2300],
  'brownsville': [25.9017, -97.4975], 'amarillo': [35.2220, -101.8313],
  'midland': [31.9973, -102.0779], 'abilene': [32.4487, -99.7331],
  'beaumont': [30.0802, -94.1266], 'tyler': [32.3513, -95.3011],
  'round rock': [30.5083, -97.6789], 'frisco': [33.1507, -96.8236],
  'mckinney': [33.1972, -96.6397], 'irving': [32.8140, -96.9489],
  'garland': [32.9126, -96.6389], 'grand prairie': [32.7459, -96.9978],
  'carrollton': [32.9537, -96.8903], 'denton': [33.2148, -97.1331],
  'richardson': [32.9483, -96.7299], 'lewisville': [33.0462, -96.9942],
  'allen': [33.1032, -96.6706], 'san marcos': [29.8833, -97.9414],
  'college station': [30.6280, -96.3344], 'waco': [31.5493, -97.1467],
  'killeen': [31.1171, -97.7278], 'temple': [31.0982, -97.3428],
  'bryan': [30.6744, -96.3698],
  // US States (fallback for "Remote, CA" type locations)
  ', al': [32.8067, -86.7911], ', ak': [64.2008, -153.4937],
  ', az': [34.0489, -111.0937], ', ar': [34.9697, -92.3731],
  ', ca': [36.7783, -119.4179], ', co': [39.5501, -105.7821],
  ', ct': [41.6032, -73.0877], ', de': [38.9108, -75.5277],
  ', fl': [27.6648, -81.5158], ', ga': [32.1656, -82.9001],
  ', hi': [19.8968, -155.5828], ', id': [44.0682, -114.742],
  ', il': [40.6331, -89.3985], ', in': [40.2672, -86.1349],
  ', ia': [41.878, -93.0977], ', ks': [39.0119, -98.4842],
  ', ky': [37.8393, -84.2700], ', la': [31.2448, -92.1450],
  ', me': [44.6939, -69.3819], ', md': [39.0458, -76.6413],
  ', ma': [42.4072, -71.3824], ', mi': [44.3148, -85.6024],
  ', mn': [46.7296, -94.6859], ', ms': [32.3547, -89.3985],
  ', mo': [37.9643, -91.8318], ', mt': [46.8797, -110.3626],
  ', ne': [41.4925, -99.9018], ', nv': [38.8026, -116.4194],
  ', nh': [43.1939, -71.5724], ', nj': [40.0583, -74.4057],
  ', nm': [34.5199, -105.8701], ', ny': [42.1657, -74.9481],
  ', nc': [35.7596, -79.0193], ', nd': [47.5515, -101.002],
  ', oh': [40.4173, -82.9071], ', ok': [35.4676, -97.5164],
  ', or': [43.8041, -120.5542], ', pa': [41.2033, -77.1945],
  ', ri': [41.6809, -71.5118], ', sc': [33.8361, -81.1637],
  ', sd': [43.9695, -99.9018], ', tn': [35.5175, -86.5804],
  ', tx': [31.9686, -99.9018], ', ut': [39.3210, -111.0937],
  ', vt': [44.5588, -72.5778], ', va': [37.4316, -78.6569],
  ', wa': [47.7511, -120.7401], ', wv': [38.5976, -80.4549],
  ', wi': [43.7844, -88.7879], ', wy': [43.0760, -107.2903],
  'united states': [39.8283, -98.5795],
  // India
  'bangalore': [12.9716, 77.5946], 'bengaluru': [12.9716, 77.5946],
  'mumbai': [19.076, 72.8777], 'delhi': [28.6139, 77.209],
  'hyderabad': [17.385, 78.4867], 'pune': [18.5204, 73.8567],
  'chennai': [13.0827, 80.2707], 'kolkata': [22.5726, 88.3639],
  'noida': [28.5355, 77.3910], 'gurgaon': [28.4595, 77.0266],
  'gurugram': [28.4595, 77.0266], 'ahmedabad': [23.0225, 72.5714],
  'jaipur': [26.9124, 75.7873], 'lucknow': [26.8467, 80.9462],
  'chandigarh': [30.7333, 76.7794], 'indore': [22.7196, 75.8577],
  'bhopal': [23.2599, 77.4126], 'thiruvananthapuram': [8.5241, 76.9366],
  'kochi': [9.9312, 76.2673], 'coimbatore': [11.0168, 76.9558],
  'mysore': [12.2958, 76.6394], 'mangalore': [12.9141, 74.8560],
  'nagpur': [21.1458, 79.0882], 'visakhapatnam': [17.6868, 83.2185],
  'india': [20.5937, 78.9629],
  // UK
  'london': [51.5074, -0.1278], 'manchester': [53.4808, -2.2426],
  'edinburgh': [55.9533, -3.1883],
  'bristol': [51.4545, -2.5879], 'leeds': [53.8008, -1.5491],
  'glasgow': [55.8642, -4.2518], 'cambridge uk': [52.2053, 0.1218],
  'oxford': [51.7520, -1.2577], 'liverpool': [53.4084, -2.9916],
  'united kingdom': [55.3781, -3.436],
  // Canada
  'toronto': [43.6532, -79.3832], 'vancouver': [49.2827, -123.1207],
  'montreal': [45.5017, -73.5673], 'calgary': [51.0447, -114.0719],
  'ottawa': [45.4215, -75.6972], 'edmonton': [53.5461, -113.4938],
  'winnipeg': [49.8951, -97.1384], 'quebec': [46.8139, -71.2080],
  'victoria': [48.4284, -123.3656], 'halifax': [44.6488, -63.5752],
  'canada': [56.1304, -106.3468],
  // Australia
  'sydney': [-33.8688, 151.2093], 'melbourne': [-37.8136, 144.9631],
  'brisbane': [-27.4698, 153.0251], 'perth': [-31.9505, 115.8605],
  'adelaide': [-34.9285, 138.6007], 'canberra': [-35.2809, 149.1300],
  'australia': [-25.2744, 133.7751],
  // Germany
  'berlin': [52.52, 13.405], 'munich': [48.1351, 11.582],
  'hamburg': [53.5753, 10.0153], 'frankfurt': [50.1109, 8.6821],
  'germany': [51.1657, 10.4515],
  // Others
  'singapore': [1.3521, 103.8198], 'dubai': [25.2048, 55.2708],
  'abu dhabi': [24.4539, 54.3773], 'amsterdam': [52.3676, 4.9041],
  'paris': [48.8566, 2.3522], 'tokyo': [35.6762, 139.6503],
  'seoul': [37.5665, 126.978], 'beijing': [39.9042, 116.4074],
  'shanghai': [31.2304, 121.4737], 'hong kong': [22.3193, 114.1694],
  'tel aviv': [32.0853, 34.7818], 'stockholm': [59.3293, 18.0686],
  'dublin': [53.3498, -6.2603], 'zurich': [47.3769, 8.5417],
  'lisbon': [38.7223, -9.1393], 'madrid': [40.4168, -3.7038],
  'barcelona': [41.3851, 2.1734], 'rome': [41.9028, 12.4964],
  'milan': [45.4642, 9.1900], 'vienna': [48.2082, 16.3738],
  'prague': [50.0755, 14.4378], 'warsaw': [52.2297, 21.0122],
  'bangalore rural': [12.9716, 77.5946],
}

// ── County → coordinates (for Adzuna "City, County" format) ──────────────
const COUNTY_COORDS: Record<string, [number, number]> = {
  'cook county': [41.8781, -87.6298],        // Chicago area
  'los angeles county': [34.0522, -118.2437],
  'harris county': [29.7604, -95.3698],       // Houston area
  'maricopa county': [33.4484, -112.074],     // Phoenix area
  'san diego county': [32.7157, -117.1611],
  'orange county': [33.7175, -117.8311],      // Irvine/Anaheim area
  'kings county': [40.6782, -73.9442],        // Brooklyn
  'dallas county': [32.7767, -96.797],
  'king county': [47.6062, -122.3321],        // Seattle area
  'clark county': [36.1699, -115.1398],       // Las Vegas area
  'tarrant county': [32.7555, -97.3308],      // Fort Worth area
  'bexar county': [29.4241, -98.4936],        // San Antonio area
  'montgomery county': [39.7589, -84.1916],   // Dayton area (Ohio)
  "prince george's county": [38.8487, -76.9239], // Suitland area (MD)
  'prince georges county': [38.8487, -76.9239],
  'fairfax county': [38.8462, -77.3064],
  'santa clara county': [37.3541, -121.9552],
  'san mateo county': [37.5630, -122.3255],
  'alameda county': [37.7652, -122.2416],
  'hennepin county': [44.9778, -93.265],      // Minneapolis area
  'fulton county': [33.749, -84.388],         // Atlanta area
  'franklin county': [39.9612, -82.9988],     // Columbus area
  'suffolk county': [40.7128, -74.006],       // NYC area
  'middlesex county': [42.3736, -71.1097],    // Cambridge area (MA)
  'denver county': [39.7392, -104.9903],
  'travis county': [30.2672, -97.7431],       // Austin area
  'wake county': [35.7796, -78.6382],         // Raleigh area
  'mecklenburg county': [35.2271, -80.8431],  // Charlotte area
  'duval county': [30.3322, -81.6557],        // Jacksonville area
  'marion county': [39.7684, -86.1581],       // Indianapolis area
  'davidson county': [36.1627, -86.7816],     // Nashville area
  'hillsborough county': [27.9506, -82.4572], // Tampa area
  'multnomah county': [45.5231, -122.6765],   // Portland area
  'salt lake county': [40.7608, -111.891],
  'shelby county': [35.1495, -90.0490],       // Memphis area
  'cuyahoga county': [41.4993, -81.6944],     // Cleveland area
  'allegheny county': [40.4406, -79.9959],    // Pittsburgh area
  'wayne county': [42.3314, -83.0458],        // Detroit area
  'erie county': [42.8864, -78.8784],         // Buffalo area
  'bergen county': [40.9176, -74.0722],
  'hudson county': [40.7440, -74.0324],       // Hoboken/JC area
  'essex county': [40.7357, -74.1724],        // Newark area
  'collin county': [33.1507, -96.8236],       // Plano/Frisco area
  'denton county': [33.2148, -97.1331],
}

// ── Improved geocode: handles "City, County", "City, State", "City, Country" ──
function geocodeLocation(location: string): [number, number] | null {
  if (!location) return null
  const loc = location.toLowerCase().trim()

  // Skip pure remote
  if (loc === 'remote' || loc === 'work from home' || loc === 'anywhere') return null

  // Direct full-string match first
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (loc === key) return coords
  }

  // Check if location includes a known city
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (key.length >= 4 && loc.includes(key)) return coords
  }

  // Parse comma-separated parts
  const parts = loc.split(',').map(p => p.trim())
  if (parts.length > 1) {
    const city = parts[0].trim()
    const secondPart = parts[1].trim()

    // Check if second part is/contains "county" -> Adzuna format
    if (secondPart.includes('county')) {
      // Try full county name lookup
      for (const [key, coords] of Object.entries(COUNTY_COORDS)) {
        if (secondPart.includes(key) || key.includes(secondPart)) return coords
      }
    }

    // Try matching city name directly
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (city === key) return coords
    }

    // Partial city match
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (key.length >= 4 && (city.includes(key) || key.includes(city))) return coords
    }

    // Try state abbreviation ", XX"
    const statePart = ', ' + parts[parts.length - 1].trim()
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (key.startsWith(',') && statePart.startsWith(key)) return coords
    }
  }

  // Last resort: try first word alone (for cases like "Schiller Park")
  const firstWord = parts[0].trim()
  if (firstWord.length >= 4) {
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (key.length >= 4 && key.includes(firstWord)) return coords
    }
  }

  return null
}

interface Job {
  id: string; title: string; company: string; location: string
  remote_type: string | null; salary_min: number | null; salary_max: number | null
  source: string; url: string; posted_at?: string; salary_currency?: string
}

interface GlobePoint {
  lat: number; lng: number; job: Job; color: string; size: number
}

interface ArcDatum {
  startLat: number; startLng: number; endLat: number; endLng: number
  startColor: string; endColor: string
}

interface RingDatum {
  lat: number; lng: number; color: string
}

interface FlagDatum {
  lat: number; lng: number; altitude: number; job: Job; color: string
}

interface JobsGlobeProps {
  jobs: Job[]; onSave: (job: Job) => void; onApply: (job: Job) => void
  savedJobs: Set<string>; appliedJobs: Set<string>
}

function formatSalary(min: number | null, max: number | null, currency = 'USD') {
  const isINR = currency === 'INR'
  const sym = isINR ? '₹' : currency === 'GBP' ? '£' : '$'
  const fmt = (n: number) => {
    if (isINR) {
      if (n >= 100000) return `${Math.round(n / 100000)}L`
      if (n >= 1000) return `${Math.round(n / 1000)}K`
      return String(n)
    }
    return n >= 1000 ? `${Math.round(n / 1000)}K` : String(n)
  }
  if (min && max) return `${sym}${fmt(min)} – ${sym}${fmt(max)}`
  if (min) return `${sym}${fmt(min)}+`
  if (max) return `Up to ${sym}${fmt(max)}`
  return 'Salary TBD'
}

function salaryColor(min: number | null, currency = 'USD') {
  const v = currency === 'INR' ? (min || 0) / 83 : (min || 0)
  if (v >= 150000) return '#ffd700'
  if (v >= 100000) return '#fd79a8'
  if (v >= 60000) return '#a29bfe'
  if (v >= 30000) return '#74b9ff'
  return '#55efc4'
}

// Lazy-load Globe — no SSR
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-14 h-14 rounded-full border-2 border-t-[#a29bfe] border-r-[#fd79a8] border-b-[#74b9ff] border-l-transparent" />
        <p className="text-[#5a5a7a] text-sm font-medium tracking-wide">Initializing Globe...</p>
      </div>
    </div>
  ),
})

// ── Stars background (static — never re-created) ─────────────────────────
const STARS = Array.from({ length: 220 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.0 + 0.3,
  duration: 2 + Math.random() * 5,
  delay: Math.random() * 4,
  base: Math.random() * 0.35 + 0.08,
}))

// ── Job Detail Card ────────────────────────────────────────────────────────
function JobCard({ job, onClose, onSave, onApply, isSaved, isApplied }: {
  job: Job; onClose: () => void; onSave: () => void; onApply: () => void
  isSaved: boolean; isApplied: boolean
}) {
  const color = salaryColor(job.salary_min, job.salary_currency)
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="absolute top-6 right-6 z-30 w-[340px]"
    >
      <div className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(12,12,30,0.98), rgba(6,6,18,0.99))',
          border: `1px solid ${color}30`,
          backdropFilter: 'blur(40px)',
          boxShadow: `0 0 80px ${color}15, 0 40px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}>
        {/* Animated top border shimmer */}
        <motion.div className="absolute top-0 left-0 right-0 h-[2px]"
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundImage: `linear-gradient(90deg, transparent, ${color}, #fd79a8, #74b9ff, transparent)`,
            backgroundSize: '200% 100%',
          }}
        />
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 opacity-20 blur-2xl"
          style={{ background: color }} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}88)`,
                boxShadow: `0 4px 20px ${color}40`,
              }}>
              {job.company[0]?.toUpperCase()}
            </div>
            <button onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-[#4a4a6a] hover:text-white transition-all duration-200 group">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="group-hover:rotate-90 transition-transform duration-200">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Title & Company */}
          <h3 className="font-bold text-white text-[15px] leading-snug mb-1.5 line-clamp-2">{job.title}</h3>
          <p className="text-[13px] font-semibold mb-4" style={{ color }}>{job.company}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium"
              style={{ background: 'rgba(116,185,255,0.08)', color: '#74b9ff', border: '1px solid rgba(116,185,255,0.12)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              {job.location || 'Remote'}
            </span>
            {job.remote_type && (
              <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium"
                style={{ background: 'rgba(85,239,196,0.08)', color: '#55efc4', border: '1px solid rgba(85,239,196,0.12)' }}>
                {job.remote_type}
              </span>
            )}
            <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
              style={{ background: `${color}12`, color, border: `1px solid ${color}20` }}>
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
            </span>
          </div>

          {/* Source & Date */}
          <div className="flex items-center gap-3 mb-5 text-[10px] text-[#4a4a6a]">
            <span className="px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.04]">{job.source}</span>
            {job.posted_at && (
              <span>{new Date(job.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onSave}
              className="flex-1 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200"
              style={isSaved
                ? { background: `${color}18`, color, border: `1px solid ${color}30` }
                : { background: 'rgba(255,255,255,0.03)', color: '#6a6a8a', border: '1px solid rgba(255,255,255,0.06)' }}>
              {isSaved ? '✓ Saved' : '+ Save'}
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onApply}
              className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-white transition-all duration-200"
              style={isApplied
                ? { background: 'rgba(85,239,196,0.12)', border: '1px solid rgba(85,239,196,0.25)', color: '#55efc4' }
                : { background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 24px ${color}35` }}>
              {isApplied ? '✓ Applied' : 'Apply Now'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function JobsGlobe({ jobs, onSave, onApply, savedJobs, appliedJobs }: JobsGlobeProps) {
  const globeEl = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<GlobePoint | null>(null)
  const [dimensions, setDimensions] = useState({ w: 900, h: 600 })
  const [globeReady, setGlobeReady] = useState(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Map jobs → globe points with golden-angle jitter for clusters
  const points: GlobePoint[] = useMemo(() => {
    const clusterCount: Record<string, number> = {}
    return jobs
      .map(job => {
        const coords = geocodeLocation(job.location)
        if (!coords) return null
        const key = `${Math.round(coords[0] * 10)},${Math.round(coords[1] * 10)}`
        clusterCount[key] = (clusterCount[key] || 0) + 1
        const n = clusterCount[key]
        const angle = (n * 137.5) * Math.PI / 180
        const r = n === 1 ? 0 : Math.sqrt(n) * 0.4
        return {
          lat: coords[0] + Math.cos(angle) * r,
          lng: coords[1] + Math.sin(angle) * r,
          job,
          color: salaryColor(job.salary_min, job.salary_currency),
          size: 0.45,
        } as GlobePoint
      })
      .filter(Boolean) as GlobePoint[]
  }, [jobs])

  // Rings data
  const ringsData: RingDatum[] = useMemo(() =>
    points.slice(0, 35).map(p => ({ lat: p.lat, lng: p.lng, color: p.color })),
    [points]
  )

  // Arcs data: connect sequential job pairs sorted by longitude
  const arcsData: ArcDatum[] = useMemo(() => {
    if (points.length < 2) return []
    const sorted = [...points].sort((a, b) => a.lng - b.lng)
    const arcs: ArcDatum[] = []
    const maxArcs = Math.min(12, Math.floor(sorted.length / 2))
    const step = Math.max(1, Math.floor(sorted.length / maxArcs))
    for (let i = 0; i < sorted.length - 1 && arcs.length < maxArcs; i += step) {
      const j = Math.min(i + step, sorted.length - 1)
      if (i === j) continue
      arcs.push({
        startLat: sorted[i].lat, startLng: sorted[i].lng,
        endLat: sorted[j].lat, endLng: sorted[j].lng,
        startColor: sorted[i].color, endColor: sorted[j].color,
      })
    }
    return arcs
  }, [points])

  // Flag markers: top 15 jobs by salary, with html elements
  const flagsData: FlagDatum[] = useMemo(() => {
    return [...points]
      .sort((a, b) => (b.job.salary_min || 0) - (a.job.salary_min || 0))
      .slice(0, 15)
      .map(p => ({
        lat: p.lat,
        lng: p.lng,
        altitude: 0.06,
        job: p.job,
        color: p.color,
      }))
  }, [points])

  // Create HTML element for a flag marker
  const createFlagElement = useCallback((d: object) => {
    const data = d as FlagDatum
    const { job, color } = data
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency)
    const title = job.title.length > 24 ? job.title.slice(0, 22) + '...' : job.title
    const company = job.company.length > 18 ? job.company.slice(0, 16) + '...' : job.company

    const wrapper = document.createElement('div')
    wrapper.style.cssText = `
      display: flex; flex-direction: column; align-items: center; cursor: pointer;
      pointer-events: auto; transition: transform 0.2s ease, opacity 0.3s ease;
      opacity: 0.92; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));
    `
    wrapper.addEventListener('mouseenter', () => {
      wrapper.style.transform = 'scale(1.12)'
      wrapper.style.opacity = '1'
      wrapper.style.zIndex = '100'
    })
    wrapper.addEventListener('mouseleave', () => {
      wrapper.style.transform = 'scale(1)'
      wrapper.style.opacity = '0.92'
      wrapper.style.zIndex = '1'
    })

    // Floating card
    const card = document.createElement('div')
    card.style.cssText = `
      background: rgba(10,10,25,0.95);
      border: 1px solid ${color}50;
      border-radius: 8px;
      padding: 6px 10px;
      backdrop-filter: blur(12px);
      box-shadow: 0 0 16px ${color}25, 0 4px 12px rgba(0,0,0,0.5);
      white-space: nowrap;
      min-width: 90px;
      text-align: center;
    `

    const titleEl = document.createElement('div')
    titleEl.style.cssText = `font-size: 11px; font-weight: 700; color: #fff; line-height: 1.3; letter-spacing: -0.01em;`
    titleEl.textContent = title

    const infoEl = document.createElement('div')
    infoEl.style.cssText = `font-size: 9px; color: ${color}; font-weight: 600; margin-top: 2px; opacity: 0.9;`
    infoEl.textContent = `${company} · ${salary}`

    card.appendChild(titleEl)
    card.appendChild(infoEl)

    // Vertical pole
    const pole = document.createElement('div')
    pole.style.cssText = `
      width: 1.5px; height: 40px;
      background: linear-gradient(to bottom, ${color}90, ${color}10);
      box-shadow: 0 0 4px ${color}40;
    `

    // Base dot
    const dot = document.createElement('div')
    dot.style.cssText = `
      width: 5px; height: 5px; border-radius: 50%;
      background: ${color}; box-shadow: 0 0 8px ${color}80;
    `

    wrapper.appendChild(card)
    wrapper.appendChild(pole)
    wrapper.appendChild(dot)

    return wrapper
  }, [])

  // Responsive sizing
  useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setDimensions({ w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight })
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Globe setup after ready
  useEffect(() => {
    if (!globeEl.current || !globeReady) return
    try {
      const ctrl = globeEl.current.controls()
      if (ctrl) {
        ctrl.autoRotate = true
        ctrl.autoRotateSpeed = 0.4
        ctrl.enableDamping = true
        ctrl.dampingFactor = 0.06
        ctrl.minDistance = 140
        ctrl.maxDistance = 600
        ctrl.rotateSpeed = 0.6
        ctrl.zoomSpeed = 0.8
      }
      if (globeEl.current.pointOfView) {
        globeEl.current.pointOfView({ lat: 35, lng: -96, altitude: 2.0 }, 1500)
      }
    } catch (err) {
      console.error('Globe initialization error:', err)
    }
  }, [globeReady])

  // Resume auto-rotation after idle
  const scheduleResume = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      if (globeEl.current && !selectedJob) {
        try { globeEl.current.controls().autoRotate = true } catch {}
      }
    }, 4000)
  }, [selectedJob])

  const handleInteractionStart = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    try { if (globeEl.current) globeEl.current.controls().autoRotate = false } catch {}
  }, [])

  const handleInteractionEnd = useCallback(() => {
    scheduleResume()
  }, [scheduleResume])

  // Fly to selected job
  const flyTo = useCallback((pt: GlobePoint) => {
    if (!globeEl.current) return
    try { globeEl.current.controls().autoRotate = false } catch {}
    globeEl.current.pointOfView({ lat: pt.lat, lng: pt.lng - 15, altitude: 1.3 }, 1000)
  }, [])

  // Stats
  const avgSalary = useMemo(() => {
    const w = jobs.filter(j => j.salary_min)
    return w.length ? Math.round(w.reduce((s, j) => s + (j.salary_min || 0), 0) / w.length) : null
  }, [jobs])

  const topCity = useMemo(() => {
    const counts: Record<string, number> = {}
    points.forEach(p => {
      const c = p.job.location?.split(',')[0]?.trim() || 'Unknown'
      counts[c] = (counts[c] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  }, [points])

  const avgSalaryFormatted = useMemo(() => {
    if (!avgSalary) return 'N/A'
    // Check if majority of jobs are INR
    const inrCount = jobs.filter(j => j.salary_currency === 'INR').length
    if (inrCount > jobs.length / 2) {
      return avgSalary >= 100000 ? `₹${Math.round(avgSalary / 100000)}L` : `₹${Math.round(avgSalary / 1000)}K`
    }
    return `$${Math.round(avgSalary / 1000)}K`
  }, [avgSalary, jobs])

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none"
      style={{ background: 'radial-gradient(ellipse at 50% 55%, #0d0d2b 0%, #060614 50%, #020208 100%)' }}>

      {/* ── Vignette overlay ── */}
      <div className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }} />

      {/* ── Ambient glow ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(100,140,255,0.04) 0%, transparent 60%)',
        }} />

      {/* ── Stars ── */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map(s => (
          <motion.div key={s.id} className="absolute rounded-full"
            style={{
              width: s.size,
              height: s.size,
              left: `${s.x}%`,
              top: `${s.y}%`,
              opacity: s.base,
              background: s.size > 1.5 ? 'radial-gradient(circle, #fff, rgba(160,180,255,0.3))' : '#fff',
            }}
            animate={{ opacity: [s.base, s.base + 0.4, s.base] }}
            transition={{ duration: s.duration, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* ── Globe ── */}
      <div className="absolute inset-0 z-[1]"
        onMouseDown={handleInteractionStart}
        onMouseUp={handleInteractionEnd}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        onWheel={handleInteractionStart}
      >
        <Globe
          ref={globeEl}
          width={dimensions.w}
          height={dimensions.h}
          onGlobeReady={() => setGlobeReady(true)}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          atmosphereColor="#4db8ff"
          atmosphereAltitude={0.22}
          backgroundColor="rgba(0,0,0,0)"

          // ── Points (salary-colored glowing dots) ──
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor={(p: any) => p.color}
          pointAltitude={0.012}
          pointRadius={(p: any) => hoveredPoint?.job?.id === p.job?.id ? 0.9 : 0.5}
          pointResolution={20}
          onPointClick={(pt: any) => { setSelectedJob(pt.job); flyTo(pt) }}
          onPointHover={(pt: any) => setHoveredPoint(pt || null)}

          // ── Pulsing Rings ──
          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringColor={(p: any) => (t: number) => {
            const c = p.color || '#74b9ff'
            const alpha = Math.max(0, 0.6 - t * 0.6)
            const hex = Math.round(alpha * 255).toString(16).padStart(2, '0')
            return `${c}${hex}`
          }}
          ringMaxRadius={3.5}
          ringPropagationSpeed={1.8}
          ringRepeatPeriod={1400}

          // ── Animated Arcs ──
          arcsData={arcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={(d: any) => [`${d.startColor}88`, `${d.endColor}88`]}
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={1500}
          arcStroke={0.5}
          arcAltitudeAutoScale={0.3}

          // ── Flag Markers (HTML elements) ──
          htmlElementsData={flagsData}
          htmlLat="lat"
          htmlLng="lng"
          htmlAltitude="altitude"
          htmlElement={createFlagElement}
        />
      </div>

      {/* ── Hover tooltip ── */}
      <AnimatePresence>
        {hoveredPoint && !selectedJob && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-5 py-3 rounded-xl"
            style={{
              background: 'rgba(6,6,18,0.96)',
              border: `1px solid ${hoveredPoint.color}35`,
              backdropFilter: 'blur(24px)',
              boxShadow: `0 0 40px ${hoveredPoint.color}15, 0 8px 32px rgba(0,0,0,0.5)`,
            }}>
            <p className="text-[13px] font-bold text-white whitespace-nowrap">{hoveredPoint.job.title}</p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: hoveredPoint.color }}>{hoveredPoint.job.company}</p>
            <p className="text-[11px] text-[#5a5a7a] mt-1">
              {formatSalary(hoveredPoint.job.salary_min, hoveredPoint.job.salary_max, hoveredPoint.job.salary_currency)} · {hoveredPoint.job.location}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats Bar (top center, glassmorphism) ── */}
      {globeReady && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
          className="absolute top-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-5 px-6 py-3 rounded-2xl"
          style={{
            background: 'rgba(8,8,22,0.85)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(30px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}>
          {[
            { label: 'Pinned', value: points.length, color: '#a29bfe' },
            { label: 'Total', value: jobs.length, color: '#74b9ff' },
            { label: 'Top City', value: topCity, color: '#fd79a8' },
            { label: 'Avg Salary', value: avgSalaryFormatted, color: '#ffd700' },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-5">
              {i > 0 && <div className="w-px h-5 bg-white/[0.06]" />}
              <div className="text-center">
                <div className="text-[15px] font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[9px] text-[#4a4a6a] font-semibold uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Salary Legend (bottom left) ── */}
      {globeReady && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="absolute bottom-7 left-6 z-20 rounded-xl p-4"
          style={{
            background: 'rgba(8,8,22,0.88)',
            border: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
          <p className="text-[8px] font-bold tracking-[0.2em] uppercase text-[#3a3a5a] mb-3">Salary Range</p>
          {[
            { color: '#ffd700', label: '$150K+' },
            { color: '#fd79a8', label: '$100K – $150K' },
            { color: '#a29bfe', label: '$60K – $100K' },
            { color: '#74b9ff', label: '$30K – $60K' },
            { color: '#55efc4', label: 'Below $30K' },
          ].map((t, i) => (
            <div key={t.label} className="flex items-center gap-2.5 mb-2 last:mb-0">
              <motion.div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: t.color, boxShadow: `0 0 8px ${t.color}70` }}
                animate={{ scale: [1, 1.25, 1], boxShadow: [`0 0 8px ${t.color}70`, `0 0 14px ${t.color}90`, `0 0 8px ${t.color}70`] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
              />
              <span className="text-[10px] text-white/50 font-medium">{t.label}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Geocoding diagnostic ── */}
      {globeReady && points.length === 0 && jobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-7 right-6 z-20 text-right pointer-events-none">
          <p className="text-[11px] text-[#3a3a5a]">{jobs.length} jobs found — locations could not be mapped</p>
        </motion.div>
      )}

      {globeReady && jobs.length === 0 && (
        <div className="absolute inset-0 flex items-end justify-center pb-12 pointer-events-none z-20">
          <p className="text-[#3a3a5a] text-sm font-medium tracking-wide">Search for jobs to see them on the globe</p>
        </div>
      )}

      {/* ── Hint ── */}
      {globeReady && !selectedJob && points.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-7 right-6 z-20 text-right pointer-events-none">
          <p className="text-[10px] text-[#2a2a4a] font-medium">Click a pin · Drag to rotate · Scroll to zoom</p>
        </motion.div>
      )}

      {/* ── Job Detail Card ── */}
      <AnimatePresence>
        {selectedJob && (
          <JobCard
            job={selectedJob}
            onClose={() => {
              setSelectedJob(null)
              scheduleResume()
            }}
            onSave={() => onSave(selectedJob)}
            onApply={() => onApply(selectedJob)}
            isSaved={savedJobs.has(selectedJob.id)}
            isApplied={appliedJobs.has(selectedJob.id)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

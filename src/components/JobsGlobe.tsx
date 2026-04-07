'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
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
  'india': [20.5937, 78.9629],
  // UK
  'london': [51.5074, -0.1278], 'manchester': [53.4808, -2.2426],
  'birmingham': [52.4862, -1.8904], 'edinburgh': [55.9533, -3.1883],
  'bristol': [51.4545, -2.5879], 'leeds': [53.8008, -1.5491],
  'glasgow': [55.8642, -4.2518], 'united kingdom': [55.3781, -3.436],
  // Canada
  'toronto': [43.6532, -79.3832], 'vancouver': [49.2827, -123.1207],
  'montreal': [45.5017, -73.5673], 'calgary': [51.0447, -114.0719],
  'ottawa': [45.4215, -75.6972], 'edmonton': [53.5461, -113.4938],
  'canada': [56.1304, -106.3468],
  // Australia
  'sydney': [-33.8688, 151.2093], 'melbourne': [-37.8136, 144.9631],
  'brisbane': [-27.4698, 153.0251], 'perth': [-31.9505, 115.8605],
  'adelaide': [-34.9285, 138.6007], 'australia': [-25.2744, 133.7751],
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
}

// ── Improved geocode: handles "City, State", "City, Country", etc. ─────────
function geocodeLocation(location: string): [number, number] | null {
  if (!location) return null
  const loc = location.toLowerCase().trim()

  // Skip pure "remote" with no location
  if (loc === 'remote' || loc === 'work from home' || loc === 'anywhere') return null

  // Direct match first
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (loc.includes(key)) return coords
  }

  // Try first part before comma (city name)
  const parts = loc.split(',')
  if (parts.length > 1) {
    const city = parts[0].trim()
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (city.includes(key) || key.includes(city)) return coords
    }
    // Try state abbreviation ", XX"
    const statePart = ',' + parts[parts.length - 1].trim()
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (statePart.startsWith(key)) return coords
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

interface JobsGlobeProps {
  jobs: Job[]; onSave: (job: Job) => void; onApply: (job: Job) => void
  savedJobs: Set<string>; appliedJobs: Set<string>
}

function formatSalary(min: number | null, max: number | null, currency = 'USD') {
  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}K` : String(n)
  const sym = currency === 'INR' ? '₹' : currency === 'GBP' ? '£' : '$'
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
          className="w-12 h-12 rounded-full border-2 border-t-[#a29bfe] border-r-[#fd79a8] border-b-[#74b9ff] border-l-transparent" />
        <p className="text-[#5a5a7a] text-sm">Loading 3D Globe...</p>
      </div>
    </div>
  ),
})

// ── Job Detail Card ────────────────────────────────────────────────────────
function JobCard({ job, onClose, onSave, onApply, isSaved, isApplied }: {
  job: Job; onClose: () => void; onSave: () => void; onApply: () => void
  isSaved: boolean; isApplied: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.94 }} animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="absolute top-4 right-4 z-30 w-[320px]">
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: 'rgba(10,10,22,0.97)', border: '1px solid rgba(162,155,254,0.25)', backdropFilter: 'blur(30px)', boxShadow: '0 0 60px rgba(162,155,254,0.1), 0 30px 60px rgba(0,0,0,0.6)' }}>
        <motion.div className="absolute top-0 left-0 right-0 h-[1px]"
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{ backgroundImage: 'linear-gradient(90deg, transparent, #a29bfe, #fd79a8, #74b9ff, transparent)', backgroundSize: '200% 100%' }} />
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #fd79a8, #a29bfe)' }}>
              {job.company[0]?.toUpperCase()}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-[#4a4a6a] hover:text-white transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <h3 className="font-bold text-white text-[14px] leading-snug mb-1 line-clamp-2">{job.title}</h3>
          <p className="text-[12px] text-[#a29bfe] font-medium mb-3">{job.company}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium"
              style={{ background: 'rgba(116,185,255,0.1)', color: '#74b9ff', border: '1px solid rgba(116,185,255,0.15)' }}>
              📍 {job.location || 'Remote'}
            </span>
            {job.remote_type && (
              <span className="px-2 py-1 rounded-lg text-[10px] font-medium"
                style={{ background: 'rgba(85,239,196,0.1)', color: '#55efc4', border: '1px solid rgba(85,239,196,0.15)' }}>
                {job.remote_type}
              </span>
            )}
            <span className="px-2 py-1 rounded-lg text-[10px] font-bold"
              style={{ background: 'rgba(253,203,94,0.1)', color: '#fdcb6e', border: '1px solid rgba(253,203,94,0.15)' }}>
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
            </span>
          </div>
          {job.posted_at && (
            <p className="text-[10px] text-[#4a4a6a] mb-4">
              {new Date(job.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
          <div className="flex gap-2">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onSave}
              className="flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all"
              style={isSaved
                ? { background: 'rgba(162,155,254,0.15)', color: '#a29bfe', border: '1px solid rgba(162,155,254,0.3)' }
                : { background: 'rgba(255,255,255,0.04)', color: '#7a7a9a', border: '1px solid rgba(255,255,255,0.07)' }}>
              {isSaved ? '✓ Saved' : 'Save'}
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onApply}
              className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white"
              style={isApplied
                ? { background: 'rgba(85,239,196,0.15)', border: '1px solid rgba(85,239,196,0.3)', color: '#55efc4' }
                : { background: 'linear-gradient(135deg, #fd79a8, #e84393)', boxShadow: '0 0 20px rgba(253,121,168,0.3)' }}>
              {isApplied ? '✓ Applied' : 'Apply Now →'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Stars background ───────────────────────────────────────────────────────
const STARS = Array.from({ length: 180 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 1.8 + 0.4, duration: 2 + Math.random() * 4,
  delay: Math.random() * 3, base: Math.random() * 0.4 + 0.1,
}))

export default function JobsGlobe({ jobs, onSave, onApply, savedJobs, appliedJobs }: JobsGlobeProps) {
  const globeEl = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<GlobePoint | null>(null)
  const [dimensions, setDimensions] = useState({ w: 900, h: 600 })
  const [globeReady, setGlobeReady] = useState(false)
  const rotateRef = useRef(true)

  // Map jobs → globe points with jitter for clusters
  const points: GlobePoint[] = useMemo(() => {
    const clusterCount: Record<string, number> = {}
    return jobs
      .map(job => {
        const coords = geocodeLocation(job.location)
        if (!coords) return null
        const key = `${Math.round(coords[0])},${Math.round(coords[1])}`
        clusterCount[key] = (clusterCount[key] || 0) + 1
        const n = clusterCount[key]
        const angle = (n * 137.5) * Math.PI / 180 // golden angle spread
        const r = n === 1 ? 0 : Math.sqrt(n) * 0.5
        return {
          lat: coords[0] + Math.cos(angle) * r,
          lng: coords[1] + Math.sin(angle) * r,
          job, color: salaryColor(job.salary_min, job.salary_currency), size: 0.5,
        } as GlobePoint
      })
      .filter(Boolean) as GlobePoint[]
  }, [jobs])

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

  // Globe setup after ready (with timeout protection)
  useEffect(() => {
    if (!globeEl.current || !globeReady) return
    try {
      const ctrl = globeEl.current.controls()
      if (ctrl) {
        ctrl.autoRotate = true
        ctrl.autoRotateSpeed = 0.5
        ctrl.enableDamping = true
        ctrl.dampingFactor = 0.08
        ctrl.minDistance = 150
        ctrl.maxDistance = 600
      }
      // Start pointing at USA
      if (globeEl.current.pointOfView) {
        globeEl.current.pointOfView({ lat: 38, lng: -96, altitude: 2.2 }, 1200)
      }
    } catch (err) {
      console.error('Globe initialization error:', err)
    }
  }, [globeReady])

  // Fly to selected job
  const flyTo = (pt: GlobePoint) => {
    if (!globeEl.current) return
    globeEl.current.controls().autoRotate = false
    rotateRef.current = false
    globeEl.current.pointOfView({ lat: pt.lat, lng: pt.lng, altitude: 1.1 }, 900)
  }

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

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 60%, #0c0c28 0%, #050510 55%, #020208 100%)' }}>

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map(s => (
          <motion.div key={s.id} className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%`, opacity: s.base }}
            animate={{ opacity: [s.base, s.base * 3, s.base] }}
            transition={{ duration: s.duration, repeat: Infinity, delay: s.delay }} />
        ))}
      </div>

      {/* Globe */}
      <div className="absolute inset-0"
        onMouseDown={() => { if (globeEl.current) globeEl.current.controls().autoRotate = false }}
        onMouseUp={() => { if (!selectedJob && globeEl.current) globeEl.current.controls().autoRotate = true }}>
        <Globe
          ref={globeEl}
          width={dimensions.w}
          height={dimensions.h}
          onGlobeReady={() => setGlobeReady(true)}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          atmosphereColor="rgba(120,160,255,0.3)"
          atmosphereAltitude={0.2}
          backgroundColor="rgba(0,0,0,0)"
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor={(p: any) => p.color}
          pointAltitude={0.015}
          pointRadius={(p: any) => hoveredPoint?.job?.id === p.job?.id ? 0.85 : 0.55}
          pointResolution={16}
          onPointClick={(pt: any) => { setSelectedJob(pt.job); flyTo(pt) }}
          onPointHover={(pt: any) => setHoveredPoint(pt || null)}
          ringsData={points.slice(0, 30)}
          ringLat="lat"
          ringLng="lng"
          ringColor={(p: any) => (t: number) => {
            const c = p.color || '#fd79a8'
            const alpha = Math.max(0, 1 - t)
            return `${c}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
          }}
          ringMaxRadius={4}
          ringPropagationSpeed={2}
          ringRepeatPeriod={1000}
        />
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredPoint && !selectedJob && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(8,8,20,0.96)', border: `1px solid ${hoveredPoint.color}40`, backdropFilter: 'blur(20px)', boxShadow: `0 0 30px ${hoveredPoint.color}20` }}>
            <p className="text-[13px] font-bold text-white">{hoveredPoint.job.title}</p>
            <p className="text-[11px] font-medium" style={{ color: hoveredPoint.color }}>{hoveredPoint.job.company}</p>
            <p className="text-[11px] text-[#6a6a8a] mt-0.5">
              {formatSalary(hoveredPoint.job.salary_min, hoveredPoint.job.salary_max, hoveredPoint.job.salary_currency)} · {hoveredPoint.job.location}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      {globeReady && (
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-5 py-2.5 rounded-2xl whitespace-nowrap"
          style={{ background: 'rgba(8,8,20,0.88)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          {[
            { label: 'Pinned', value: points.length },
            { label: 'Total', value: jobs.length },
            { label: 'Top City', value: topCity },
            { label: 'Avg Salary', value: avgSalary ? `$${Math.round(avgSalary / 1000)}K` : 'N/A' },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-4">
              {i > 0 && <div className="w-px h-3.5 bg-white/10" />}
              <div className="text-center">
                <div className="text-[14px] font-bold text-white">{s.value}</div>
                <div className="text-[9px] text-[#4a4a6a] font-medium uppercase tracking-wide">{s.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Salary Legend */}
      {globeReady && (
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
          className="absolute bottom-6 left-5 z-20 rounded-xl p-3.5"
          style={{ background: 'rgba(8,8,20,0.88)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#4a4a6a] mb-2.5">Salary</p>
          {[
            { color: '#ffd700', label: '$150K+' }, { color: '#fd79a8', label: '$100K–150K' },
            { color: '#a29bfe', label: '$60K–100K' }, { color: '#74b9ff', label: '$30K–60K' },
            { color: '#55efc4', label: 'Below $30K' },
          ].map(t => (
            <div key={t.label} className="flex items-center gap-2 mb-1.5 last:mb-0">
              <motion.div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: t.color, boxShadow: `0 0 6px ${t.color}80` }}
                animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: Math.random() }} />
              <span className="text-[10px] text-white/60">{t.label}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* No pins message */}
      {globeReady && points.length === 0 && jobs.length > 0 && (
        <div className="absolute bottom-6 right-6 z-20 text-right pointer-events-none">
          <p className="text-[11px] text-[#4a4a6a]">{jobs.length} jobs found but locations couldn't be mapped</p>
        </div>
      )}

      {globeReady && jobs.length === 0 && (
        <div className="absolute inset-0 flex items-end justify-center pb-10 pointer-events-none">
          <p className="text-[#3a3a5a] text-sm">Search for jobs to see them pinned on the globe</p>
        </div>
      )}

      {/* Hint */}
      {globeReady && !selectedJob && points.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          className="absolute bottom-6 right-5 z-20 text-right pointer-events-none">
          <p className="text-[10px] text-[#3a3a5a]">Click a pin · Drag to rotate · Scroll to zoom</p>
        </motion.div>
      )}

      {/* Job card */}
      <AnimatePresence>
        {selectedJob && (
          <JobCard
            job={selectedJob}
            onClose={() => { setSelectedJob(null); if (globeEl.current) globeEl.current.controls().autoRotate = true }}
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

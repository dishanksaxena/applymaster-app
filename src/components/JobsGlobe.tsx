'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

// ─── City coordinates ───
const CITY_COORDS: Record<string, [number, number]> = {
  'new york': [40.7128, -74.006], 'san francisco': [37.7749, -122.4194],
  'seattle': [47.6062, -122.3321], 'austin': [30.2672, -97.7431],
  'boston': [42.3601, -71.0589], 'chicago': [41.8781, -87.6298],
  'los angeles': [34.0522, -118.2437], 'denver': [39.7392, -104.9903],
  'atlanta': [33.749, -84.388], 'miami': [25.7617, -80.1918],
  'dallas': [32.7767, -96.797], 'washington': [38.9072, -77.0369],
  'portland': [45.5231, -122.6765], 'san jose': [37.3382, -121.8863],
  'phoenix': [33.4484, -112.074], 'philadelphia': [39.9526, -75.1652],
  'houston': [29.7604, -95.3698], 'charlotte': [35.2271, -80.8431],
  'minneapolis': [44.9778, -93.265], 'nashville': [36.1627, -86.7816],
  'kansas city': [39.0997, -94.5786], 'st louis': [38.627, -90.1994],
  'orlando': [28.5383, -81.3792], 'tampa': [27.9506, -82.4572],
  'las vegas': [36.1699, -115.1398], 'indianapolis': [39.7684, -86.1581],
  'columbus': [39.9612, -82.9988], 'pittsburgh': [40.4406, -79.9959],
  'highland park': [40.1978, -74.9271], 'sacramento': [38.5816, -121.4944],
  'memphis': [35.1495, -90.0490], 'baltimore': [39.2904, -76.6122],
  'detroit': [42.3314, -83.0458], 'birmingham': [33.5186, -86.8104],
  'charleston': [32.7765, -79.9311], 'raleigh': [35.7796, -78.6382],
  'jacksonville': [30.3322, -81.6557], 'louisville': [38.2527, -85.7585],
  ', al': [32.8067, -86.7911], ', ca': [36.7783, -119.4179],
  ', tx': [31.9686, -99.9018], ', fl': [27.6648, -81.5158],
  ', ny': [42.1657, -74.9481], ', pa': [41.2033, -77.1945],
  ', il': [40.6331, -89.3985], ', ga': [32.1656, -82.9001],
  ', nc': [35.7596, -79.0193], ', oh': [40.4173, -82.9071],
  ', mi': [44.3148, -85.6024], ', co': [39.5501, -105.7821],
  ', wa': [47.7511, -120.7401], ', va': [37.4316, -78.6569],
  ', az': [34.0489, -111.0937], ', or': [43.8041, -120.5542],
  ', ma': [42.4072, -71.3824], ', nj': [40.0583, -74.4057],
  ', md': [39.0458, -76.6413], ', tn': [35.5175, -86.5804],
  ', in': [40.2672, -86.1349], ', mo': [37.9643, -91.8318],
  ', wi': [43.7844, -88.7879], ', mn': [46.7296, -94.6859],
  ', ct': [41.6032, -73.0877], ', la': [31.2448, -92.1450],
  ', ky': [37.8393, -84.2700], ', ok': [35.4676, -97.5164],
  ', ut': [39.3210, -111.0937], ', nm': [34.5199, -105.8701],
  ', ar': [34.9697, -92.3731], ', ia': [41.878, -93.0977],
  ', ks': [39.0119, -98.4842], ', ne': [41.4925, -99.9018],
  ', ms': [32.3547, -89.3985], ', nv': [38.8026, -116.4194],
  ', me': [44.6939, -69.3819], ', nh': [43.1939, -71.5724],
  ', ri': [41.6809, -71.5118], ', vt': [44.5588, -72.5778],
  ', de': [38.9108, -75.5277], ', sc': [33.8361, -81.1637],
  ', wv': [38.5976, -80.4549], ', mt': [46.8797, -110.3626],
  ', nd': [47.5515, -101.002], ', sd': [43.9695, -99.9018],
  ', ak': [64.2008, -153.4937], ', hi': [19.8968, -155.5828],
  'bangalore': [12.9716, 77.5946], 'mumbai': [19.076, 72.8777],
  'delhi': [28.6139, 77.209], 'london': [51.5074, -0.1278],
  'toronto': [43.6532, -79.3832], 'sydney': [-33.8688, 151.2093],
}

function geocodeLocation(location: string): [number, number] | null {
  if (!location) return null
  const loc = location.toLowerCase().trim()
  if (loc === 'remote' || loc === 'work from home' || loc === 'anywhere') return null
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (loc.includes(key)) return coords
  }
  const parts = loc.split(',')
  if (parts.length > 1) {
    const city = parts[0].trim()
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (city.includes(key) || key.includes(city)) return coords
    }
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
interface JobsGlobeProps {
  jobs: Job[]; onSave: (job: Job) => void; onApply: (job: Job) => void
  savedJobs: Set<string>; appliedJobs: Set<string>
}

function salaryColor(min: number | null, currency = 'USD'): string {
  const v = currency === 'INR' ? (min || 0) / 83 : (min || 0)
  if (v >= 150000) return '#ffd700'
  if (v >= 100000) return '#ff6eb4'
  if (v >= 60000) return '#a78bfa'
  if (v >= 30000) return '#60a5fa'
  return '#34d399'
}

function formatSalary(min: number | null, max: number | null, currency = 'USD') {
  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}K` : String(n)
  const sym = currency === 'INR' ? '₹' : currency === 'GBP' ? '£' : '$'
  if (min && max) return `${sym}${fmt(min)} – ${sym}${fmt(max)}`
  if (min) return `${sym}${fmt(min)}+`
  if (max) return `Up to ${sym}${fmt(max)}`
  return 'Salary TBD'
}

function latLngToVector3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  )
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]
}

// ── Marker canvas texture — bright glowing dot ──
function makeMarkerTexture(color: string): THREE.CanvasTexture {
  const S = 128
  const canvas = document.createElement('canvas')
  canvas.width = S; canvas.height = S
  const ctx = canvas.getContext('2d')!
  const [r, g, b] = hexToRgb(color)
  const cx = S / 2

  // Outer soft halo
  const g1 = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx)
  g1.addColorStop(0,   `rgba(${r},${g},${b},0.8)`)
  g1.addColorStop(0.3, `rgba(${r},${g},${b},0.4)`)
  g1.addColorStop(0.6, `rgba(${r},${g},${b},0.1)`)
  g1.addColorStop(1,   `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, S, S)

  // Bright white core
  const g2 = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.18)
  g2.addColorStop(0, 'rgba(255,255,255,1)')
  g2.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, S, S)

  return new THREE.CanvasTexture(canvas)
}

// ── Pulse ring texture ──
function makePulseTexture(color: string): THREE.CanvasTexture {
  const S = 256
  const canvas = document.createElement('canvas')
  canvas.width = S; canvas.height = S
  const ctx = canvas.getContext('2d')!
  const [r, g, b] = hexToRgb(color)
  const cx = S / 2

  ctx.beginPath()
  ctx.arc(cx, cx, cx * 0.9, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(${r},${g},${b},0.7)`
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cx, cx * 0.65, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`
  ctx.lineWidth = 2
  ctx.stroke()

  return new THREE.CanvasTexture(canvas)
}

// ── Grid lines on globe surface ──
function makeGrid(radius: number): THREE.LineSegments {
  const pos: number[] = []

  for (let lat = -80; lat <= 80; lat += 20) {
    const phi = (90 - lat) * (Math.PI / 180)
    for (let lng = -180; lng < 180; lng += 3) {
      const t1 = (lng + 180) * (Math.PI / 180)
      const t2 = (lng + 3 + 180) * (Math.PI / 180)
      pos.push(
        -(radius * Math.sin(phi) * Math.cos(t1)), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(t1),
        -(radius * Math.sin(phi) * Math.cos(t2)), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(t2)
      )
    }
  }
  for (let lng = -180; lng < 180; lng += 30) {
    const theta = (lng + 180) * (Math.PI / 180)
    for (let lat = -88; lat < 88; lat += 3) {
      const p1 = (90 - lat) * (Math.PI / 180)
      const p2 = (90 - lat - 3) * (Math.PI / 180)
      pos.push(
        -(radius * Math.sin(p1) * Math.cos(theta)), radius * Math.cos(p1), radius * Math.sin(p1) * Math.sin(theta),
        -(radius * Math.sin(p2) * Math.cos(theta)), radius * Math.cos(p2), radius * Math.sin(p2) * Math.sin(theta)
      )
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
    color: 0x1e4080, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending
  }))
}

// ── Arc between two globe points ──
function makeArc(a: THREE.Vector3, b: THREE.Vector3, globeR: number, color: number): THREE.Line {
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
  const dist = a.distanceTo(b)
  mid.normalize().multiplyScalar(globeR + dist * 0.35)
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
  const pts = curve.getPoints(64)
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  return new THREE.Line(geo, new THREE.LineBasicMaterial({
    color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending
  }))
}

// ─── Job detail card ───
function JobCard({ job, onClose, onSave, onApply, isSaved, isApplied }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="absolute top-4 right-4 z-30 w-[320px]"
    >
      <div className="relative rounded-2xl overflow-hidden" style={{
        background: 'rgba(8,8,20,0.98)',
        border: '1px solid rgba(162,155,254,0.3)',
        backdropFilter: 'blur(30px)',
        boxShadow: '0 0 40px rgba(162,155,254,0.15), 0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #fd79a8, #a29bfe)' }}>
              {job.company[0]?.toUpperCase()}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <h3 className="font-bold text-white text-[14px] mb-1 leading-tight">{job.title}</h3>
          <p className="text-[12px] text-[#a29bfe] font-medium mb-3">{job.company}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="px-2 py-1 rounded-lg text-[10px] font-medium" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
              📍 {job.location || 'Remote'}
            </span>
            {job.remote_type && (
              <span className="px-2 py-1 rounded-lg text-[10px]" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
                {job.remote_type}
              </span>
            )}
            <span className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(253,203,94,0.12)', color: '#fdcb6e' }}>
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={onSave} className="flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all"
              style={isSaved
                ? { background: 'rgba(162,155,254,0.2)', color: '#a29bfe', border: '1px solid rgba(162,155,254,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', color: '#6a6a8a', border: '1px solid rgba(255,255,255,0.08)' }}>
              {isSaved ? '✓ Saved' : 'Save'}
            </button>
            <button onClick={onApply} className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white transition-all"
              style={isApplied
                ? { background: 'rgba(52,211,153,0.2)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }
                : { background: 'linear-gradient(135deg, #fd79a8, #e84393)', boxShadow: '0 4px 20px rgba(232,67,147,0.4)' }}>
              {isApplied ? '✓ Applied' : 'Apply Now →'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const STARS = Array.from({ length: 180 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 1.8 + 0.3, opacity: Math.random() * 0.6 + 0.2,
}))

// ════════════════════════════════════════════════════════
//   MAIN GLOBE COMPONENT
// ════════════════════════════════════════════════════════
export default function JobsGlobe({ jobs, onSave, onApply, savedJobs, appliedJobs }: JobsGlobeProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const markersRef    = useRef<THREE.Sprite[]>([])
  const pulseRingsRef = useRef<THREE.Sprite[]>([])
  const arcsRef       = useRef<THREE.Line[]>([])
  const mouseRef      = useRef({ x: 0, y: 0 })
  const dragRef       = useRef({ active: false, x: 0, y: 0, vx: 0, vy: 0 })
  const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null)

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const points = useMemo(() => jobs
    .map(job => {
      const c = geocodeLocation(job.location)
      if (!c) return null
      return { lat: c[0], lng: c[1], job, color: salaryColor(job.salary_min, job.salary_currency) }
    })
    .filter(Boolean) as Array<{ lat: number; lng: number; job: Job; color: string }>,
  [jobs])

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

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const W = container.offsetWidth
    const H = container.offsetHeight
    const R = 100 // globe radius

    // ── Scene ──
    const scene = new THREE.Scene()

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 5000)
    camera.position.set(0, 30, 275)
    cameraRef.current = camera

    // ── Renderer — NO alpha, solid background so globe looks opaque & 3D ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000008, 1)      // deep space background
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.appendChild(renderer.domElement)

    // ── Earth group ──
    const globe = new THREE.Group()
    scene.add(globe)

    // ── LIGHTING — key secret for 3D depth ──
    // Very low ambient — don't wash out shadows
    scene.add(new THREE.AmbientLight(0x0d1a33, 1.2))

    // Strong sun from upper-right — creates dramatic day/night
    const sun = new THREE.DirectionalLight(0xfff5e0, 4.5)
    sun.position.set(250, 120, 180)
    scene.add(sun)

    // Subtle blue fill from opposite side (deep space scatter)
    const fill = new THREE.DirectionalLight(0x1a3a6e, 0.6)
    fill.position.set(-200, -80, -150)
    scene.add(fill)

    // Rim light — gives the atmosphere its glow edge
    const rim = new THREE.PointLight(0x3366ff, 2.5, 800)
    rim.position.set(-180, 60, -200)
    scene.add(rim)

    // ── Textures ──
    const loader = new THREE.TextureLoader()
    const earthTex = loader.load('//unpkg.com/three-globe/example/img/earth-night.jpg')
    const bumpTex  = loader.load('//unpkg.com/three-globe/example/img/earth-topology.png')

    // ── Earth mesh ──
    const earthGeo  = new THREE.SphereGeometry(R, 128, 128)
    const earthMat  = new THREE.MeshPhongMaterial({
      map:       earthTex,
      bumpMap:   bumpTex,
      bumpScale: 4,
      specular:  new THREE.Color(0x1a2a4a),
      shininess: 25,
    })
    globe.add(new THREE.Mesh(earthGeo, earthMat))

    // ── Grid overlay ──
    globe.add(makeGrid(R + 0.4))

    // ── Atmosphere — thin blue rim only ──
    // Inner glow (front side, edge falloff)
    const atmosInnerGeo = new THREE.SphereGeometry(R + 0.5, 64, 64)
    const atmosInnerMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNorm;
        void main() {
          vNorm = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }`,
      fragmentShader: `
        varying vec3 vNorm;
        void main() {
          float f = dot(vNorm, vec3(0,0,1));
          float i = pow(clamp(1.0 - abs(f)*1.6, 0.0, 1.0), 4.0);
          gl_FragColor = vec4(0.2, 0.55, 1.0, i * 0.45);
        }`,
      blending: THREE.AdditiveBlending, side: THREE.FrontSide,
      transparent: true, depthWrite: false,
    })
    globe.add(new THREE.Mesh(atmosInnerGeo, atmosInnerMat))

    // Outer glow (back side — the blue halo ring)
    const atmosOuterGeo = new THREE.SphereGeometry(R, 64, 64)
    const atmosOuterMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNorm;
        void main() {
          vNorm = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }`,
      fragmentShader: `
        varying vec3 vNorm;
        void main() {
          float f = dot(vNorm, vec3(0,0,1));
          float i = pow(clamp(1.0 - abs(f)*1.3, 0.0, 1.0), 3.5);
          gl_FragColor = vec4(0.15, 0.45, 1.0, i * 1.1);
        }`,
      blending: THREE.AdditiveBlending, side: THREE.BackSide,
      transparent: true, depthWrite: false,
    })
    const outerAtmos = new THREE.Mesh(atmosOuterGeo, atmosOuterMat)
    outerAtmos.scale.set(1.07, 1.07, 1.07)
    globe.add(outerAtmos)

    // ── Markers + pulse rings ──
    markersRef.current = []
    pulseRingsRef.current = []

    points.forEach(p => {
      const pos = latLngToVector3(p.lat, p.lng, R + 1.5)

      // Main glow dot
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeMarkerTexture(p.color),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }))
      sprite.position.copy(pos)
      sprite.scale.set(12, 12, 1)
      sprite.userData = { job: p.job, jobId: p.job.id }
      globe.add(sprite)
      markersRef.current.push(sprite)

      // Pulse ring 1
      const r1 = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makePulseTexture(p.color),
        blending: THREE.AdditiveBlending,
        depthWrite: false, opacity: 0.7,
      }))
      r1.position.copy(pos)
      r1.scale.set(6, 6, 1)
      r1.userData = { phase: Math.random() * Math.PI * 2, speed: 0.9 + Math.random() * 0.5 }
      globe.add(r1)
      pulseRingsRef.current.push(r1)

      // Pulse ring 2 (offset)
      const r2 = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makePulseTexture(p.color),
        blending: THREE.AdditiveBlending,
        depthWrite: false, opacity: 0.35,
      }))
      r2.position.copy(pos)
      r2.scale.set(6, 6, 1)
      r2.userData = { phase: Math.random() * Math.PI * 2 + Math.PI, speed: 0.6 + Math.random() * 0.4 }
      globe.add(r2)
      pulseRingsRef.current.push(r2)
    })

    // ── Arcs between job locations ──
    arcsRef.current = []
    const ARC_COLORS = [0x3b82f6, 0x60a5fa, 0x818cf8, 0x38bdf8, 0x2563eb]
    if (points.length > 1) {
      const used = new Set<string>()
      const maxArcs = Math.min(points.length * 2, 35)
      let count = 0
      for (let i = 0; i < points.length && count < maxArcs; i++) {
        for (let c = 0; c < 3 && count < maxArcs; c++) {
          const j = (i + 1 + Math.floor(Math.random() * (points.length - 1))) % points.length
          if (i === j) continue
          const key = [Math.min(i,j), Math.max(i,j)].join('-')
          if (used.has(key)) continue
          used.add(key)
          const arc = makeArc(
            latLngToVector3(points[i].lat, points[i].lng, R + 1),
            latLngToVector3(points[j].lat, points[j].lng, R + 1),
            R,
            ARC_COLORS[Math.floor(Math.random() * ARC_COLORS.length)]
          )
          arc.userData = { phase: Math.random() * Math.PI * 2, base: 0.55 }
          globe.add(arc)
          arcsRef.current.push(arc)
          count++
        }
      }
    }

    // ── Mouse handlers ──
    const onDown = (e: MouseEvent) => {
      dragRef.current = { active: true, x: e.clientX, y: e.clientY, vx: 0, vy: 0 }
      renderer.domElement.style.cursor = 'grabbing'
    }
    const onMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current = {
        x:  ((e.clientX - rect.left) / rect.width)  * 2 - 1,
        y: -((e.clientY - rect.top)  / rect.height) * 2 + 1,
      }
      if (dragRef.current.active) {
        dragRef.current.vx = (e.clientX - dragRef.current.x) * 0.005
        dragRef.current.vy = (e.clientY - dragRef.current.y) * 0.005
        dragRef.current.x  = e.clientX
        dragRef.current.y  = e.clientY
      }
    }
    const onUp = () => {
      dragRef.current.active = false
      renderer.domElement.style.cursor = 'grab'
    }
    const onClick = (e: MouseEvent) => {
      // Don't register click if user was dragging
      if (Math.abs(dragRef.current.vx) > 0.002 || Math.abs(dragRef.current.vy) > 0.002) return
      const rect = renderer.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width)  * 2 - 1,
       -((e.clientY - rect.top)  / rect.height) * 2 + 1
      )
      const ray = new THREE.Raycaster()
      ray.setFromCamera(mouse, camera)
      const hits = ray.intersectObjects(markersRef.current)
      if (hits.length > 0) {
        const job = (hits[0].object as any).userData?.job
        if (job) setSelectedJob(job)
      }
    }

    renderer.domElement.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    renderer.domElement.addEventListener('click', onClick)
    renderer.domElement.style.cursor = 'grab'

    // Touch
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        dragRef.current = { active: true, x: e.touches[0].clientX, y: e.touches[0].clientY, vx: 0, vy: 0 }
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !dragRef.current.active) return
      e.preventDefault()
      dragRef.current.vx = (e.touches[0].clientX - dragRef.current.x) * 0.005
      dragRef.current.vy = (e.touches[0].clientY - dragRef.current.y) * 0.005
      dragRef.current.x  = e.touches[0].clientX
      dragRef.current.y  = e.touches[0].clientY
    }
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true })
    renderer.domElement.addEventListener('touchmove',  onTouchMove,  { passive: false })
    renderer.domElement.addEventListener('touchend',   onUp as any)

    // Zoom
    renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault()
      camera.position.z = Math.max(160, Math.min(500, camera.position.z + e.deltaY * 0.1))
    }, { passive: false } as any)

    // ── Animation loop ──
    const clock = new THREE.Clock()
    let animId: number

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      // Inertia rotation — NO auto-rotate
      if (dragRef.current.active) {
        globe.rotation.y += dragRef.current.vx
        globe.rotation.x += dragRef.current.vy
      } else {
        globe.rotation.y += dragRef.current.vx
        globe.rotation.x += dragRef.current.vy
        dragRef.current.vx *= 0.90
        dragRef.current.vy *= 0.90
      }
      // Clamp tilt
      globe.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, globe.rotation.x))

      // Pulse rings animation
      pulseRingsRef.current.forEach(ring => {
        const { phase, speed } = ring.userData
        const p = (t * speed + phase) % (Math.PI * 2)
        const s = 6 + Math.sin(p) * 8
        ring.scale.set(s, s, 1)
        ;(ring.material as any).opacity = 0.55 * Math.max(0, Math.cos(p * 0.5))
      })

      // Arc breathing
      arcsRef.current.forEach(arc => {
        const { phase, base } = arc.userData
        ;(arc.material as any).opacity = base * (0.65 + Math.sin(t * 0.7 + phase) * 0.35)
      })

      // Hover cursor
      const ray = new THREE.Raycaster()
      ray.setFromCamera(mouseRef.current as any, camera)
      const hits = ray.intersectObjects(markersRef.current)
      if (!dragRef.current.active) {
        renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab'
      }

      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const onResize = () => {
      const w = container.offsetWidth
      const h = container.offsetHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      renderer.dispose()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      window.removeEventListener('resize',    onResize)
      renderer.domElement.removeEventListener('mousedown', onDown)
      renderer.domElement.removeEventListener('click',     onClick)
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [points])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #0b0d1f 0%, #050610 55%, #000005 100%)' }}
    >
      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map(s => (
          <motion.div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%`, opacity: s.opacity }}
            animate={{ opacity: [s.opacity, s.opacity * 2.2, s.opacity] }}
            transition={{ duration: 2.5 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6 px-6 py-3 rounded-2xl"
        style={{
          background: 'rgba(5,5,18,0.92)',
          border: '1px solid rgba(59,130,246,0.2)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
        }}
      >
        {[
          { label: 'Pinned', value: points.length, color: '#60a5fa' },
          { label: 'Total',  value: jobs.length,   color: '#a78bfa' },
          { label: 'Top City', value: topCity,     color: '#f472b6' },
          { label: 'Avg Salary', value: avgSalary ? `$${Math.round(avgSalary/1000)}K` : 'N/A', color: '#fbbf24' },
        ].map((s, i) => (
          <div key={s.label} className="flex items-center gap-6">
            {i > 0 && <div className="w-px h-4" style={{ background: 'rgba(59,130,246,0.2)' }} />}
            <div className="text-center">
              <div className="text-[15px] font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-[#2a3a5a] font-semibold uppercase tracking-widest">{s.label}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Salary legend */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 left-5 z-20 rounded-xl p-4"
        style={{
          background: 'rgba(5,5,18,0.92)',
          border: '1px solid rgba(59,130,246,0.15)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <p className="text-[9px] font-bold tracking-widest uppercase text-[#2a3a5a] mb-3">Salary Range</p>
        {[
          { color: '#ffd700', label: '$150K+' },
          { color: '#ff6eb4', label: '$100K–150K' },
          { color: '#a78bfa', label: '$60K–100K' },
          { color: '#60a5fa', label: '$30K–60K' },
          { color: '#34d399', label: 'Below $30K' },
        ].map(t => (
          <div key={t.label} className="flex items-center gap-2.5 mb-2">
            <motion.div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: Math.random() }}
            />
            <span className="text-[10px] text-white/50">{t.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Hint */}
      {!selectedJob && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-6 right-5 z-20 pointer-events-none text-right"
        >
          <p className="text-[10px] text-[#1e2a4a]">Drag to rotate · Scroll to zoom · Click pin</p>
        </motion.div>
      )}

      {/* Job card */}
      <AnimatePresence>
        {selectedJob && (
          <JobCard
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
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

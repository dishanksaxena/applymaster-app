'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

// ─── City coordinate database ───
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
  ', al': [32.8067, -86.7911], ', ca': [36.7783, -119.4179], ', tx': [31.9686, -99.9018], ', fl': [27.6648, -81.5158],
  ', ny': [42.1657, -74.9481], ', pa': [41.2033, -77.1945], ', il': [40.6331, -89.3985], ', ga': [32.1656, -82.9001],
  ', nc': [35.7596, -79.0193], ', oh': [40.4173, -82.9071], ', mi': [44.3148, -85.6024], ', co': [39.5501, -105.7821],
  ', wa': [47.7511, -120.7401], ', va': [37.4316, -78.6569], ', az': [34.0489, -111.0937], ', or': [43.8041, -120.5542],
  ', ma': [42.4072, -71.3824], ', nj': [40.0583, -74.4057], ', md': [39.0458, -76.6413], ', tn': [35.5175, -86.5804],
  ', in': [40.2672, -86.1349], ', mo': [37.9643, -91.8318], ', wi': [43.7844, -88.7879], ', mn': [46.7296, -94.6859],
  ', ct': [41.6032, -73.0877], ', la': [31.2448, -92.1450], ', ky': [37.8393, -84.2700], ', ok': [35.4676, -97.5164],
  ', ut': [39.3210, -111.0937], ', nm': [34.5199, -105.8701], ', ar': [34.9697, -92.3731], ', ia': [41.878, -93.0977],
  ', ks': [39.0119, -98.4842], ', ne': [41.4925, -99.9018], ', ms': [32.3547, -89.3985], ', nv': [38.8026, -116.4194],
  ', me': [44.6939, -69.3819], ', nh': [43.1939, -71.5724], ', ri': [41.6809, -71.5118], ', vt': [44.5588, -72.5778],
  ', de': [38.9108, -75.5277], ', sc': [33.8361, -81.1637], ', wv': [38.5976, -80.4549], ', mt': [46.8797, -110.3626],
  ', nd': [47.5515, -101.002], ', sd': [43.9695, -99.9018], ', ak': [64.2008, -153.4937], ', hi': [19.8968, -155.5828],
  'bangalore': [12.9716, 77.5946], 'mumbai': [19.076, 72.8777], 'delhi': [28.6139, 77.209], 'london': [51.5074, -0.1278],
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
  if (v >= 100000) return '#fd79a8'
  if (v >= 60000) return '#a29bfe'
  if (v >= 30000) return '#74b9ff'
  return '#55efc4'
}

function formatSalary(min: number | null, max: number | null, currency = 'USD') {
  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}K` : String(n)
  const sym = currency === 'INR' ? '₹' : currency === 'GBP' ? '£' : '$'
  if (min && max) return `${sym}${fmt(min)} – ${sym}${fmt(max)}`
  if (min) return `${sym}${fmt(min)}+`
  if (max) return `Up to ${sym}${fmt(max)}`
  return 'Salary TBD'
}

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  return new THREE.Vector3(x, y, z)
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]
}

// ─── Job detail card ───
function JobCard({ job, onClose, onSave, onApply, isSaved, isApplied }: any) {
  return (
    <motion.div initial={{ opacity: 0, x: 30, scale: 0.94 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 30, scale: 0.94 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }} className="absolute top-4 right-4 z-30 w-[320px]">
      <div className="relative rounded-2xl overflow-hidden" style={{ background: 'rgba(10,10,22,0.97)', border: '1px solid rgba(162,155,254,0.25)', backdropFilter: 'blur(30px)', boxShadow: '0 0 60px rgba(162,155,254,0.1)' }}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #fd79a8, #a29bfe)' }}>{job.company[0]?.toUpperCase()}</div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
          </div>
          <h3 className="font-bold text-white text-[14px] mb-1">{job.title}</h3>
          <p className="text-[12px] text-[#a29bfe] font-medium mb-3">{job.company}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="px-2 py-1 rounded-lg text-[10px] font-medium" style={{ background: 'rgba(116,185,255,0.1)', color: '#74b9ff' }}>📍 {job.location || 'Remote'}</span>
            {job.remote_type && <span className="px-2 py-1 rounded-lg text-[10px]" style={{ background: 'rgba(85,239,196,0.1)', color: '#55efc4' }}>{job.remote_type}</span>}
            <span className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(253,203,94,0.1)', color: '#fdcb6e' }}>{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onSave} className="flex-1 py-2 rounded-xl text-[11px] font-semibold" style={isSaved ? { background: 'rgba(162,155,254,0.15)', color: '#a29bfe' } : { background: 'rgba(255,255,255,0.04)', color: '#7a7a9a' }}>{isSaved ? '✓ Saved' : 'Save'}</button>
            <button onClick={onApply} className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white" style={isApplied ? { background: 'rgba(85,239,196,0.15)', color: '#55efc4' } : { background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}>{isApplied ? '✓ Applied' : 'Apply Now →'}</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Create marker glow texture ───
function createMarkerTexture(color: string, size = 128): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const [r, g, b] = hexToRgb(color)
  const cx = size / 2

  // Wide soft glow (outer)
  const outerGlow = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx)
  outerGlow.addColorStop(0, `rgba(${r},${g},${b},0.9)`)
  outerGlow.addColorStop(0.25, `rgba(${r},${g},${b},0.5)`)
  outerGlow.addColorStop(0.55, `rgba(${r},${g},${b},0.15)`)
  outerGlow.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = outerGlow
  ctx.fillRect(0, 0, size, size)

  // Bright white center dot
  const innerGlow = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.2)
  innerGlow.addColorStop(0, `rgba(255,255,255,1)`)
  innerGlow.addColorStop(0.5, `rgba(255,255,255,0.9)`)
  innerGlow.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = innerGlow
  ctx.fillRect(0, 0, size, size)

  return new THREE.CanvasTexture(canvas)
}

// ─── Create pulse ring texture ───
function createPulseRingTexture(color: string): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const [r, g, b] = hexToRgb(color)
  const cx = size / 2

  ctx.beginPath()
  ctx.arc(cx, cx, cx * 0.85, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(${r},${g},${b},0.6)`
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cx, cx * 0.6, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`
  ctx.lineWidth = 1.5
  ctx.stroke()

  return new THREE.CanvasTexture(canvas)
}

// ─── Create globe grid lines (lat/lng) ───
function createGlobeGrid(radius: number): THREE.LineSegments {
  const positions: number[] = []

  // Latitude lines
  for (let lat = -80; lat <= 80; lat += 20) {
    const phi = (90 - lat) * (Math.PI / 180)
    for (let lng = -180; lng < 180; lng += 2) {
      const theta1 = (lng + 180) * (Math.PI / 180)
      const theta2 = (lng + 2 + 180) * (Math.PI / 180)

      positions.push(
        -(radius * Math.sin(phi) * Math.cos(theta1)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta1),
        -(radius * Math.sin(phi) * Math.cos(theta2)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta2)
      )
    }
  }

  // Longitude lines
  for (let lng = -180; lng < 180; lng += 30) {
    const theta = (lng + 180) * (Math.PI / 180)
    for (let lat = -90; lat < 90; lat += 2) {
      const phi1 = (90 - lat) * (Math.PI / 180)
      const phi2 = (90 - lat - 2) * (Math.PI / 180)

      positions.push(
        -(radius * Math.sin(phi1) * Math.cos(theta)),
        radius * Math.cos(phi1),
        radius * Math.sin(phi1) * Math.sin(theta),
        -(radius * Math.sin(phi2) * Math.cos(theta)),
        radius * Math.cos(phi2),
        radius * Math.sin(phi2) * Math.sin(theta)
      )
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  const material = new THREE.LineBasicMaterial({
    color: 0x1a3a5c,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
  })

  return new THREE.LineSegments(geometry, material)
}

// ─── Create arc between two points ───
function createArc(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  color: number,
  opacity: number
): THREE.Line {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
  const dist = start.clone().sub(end).length()
  const arcHeight = radius + dist * 0.25

  mid.normalize().multiplyScalar(arcHeight)

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  const curvePoints = curve.getPoints(48)
  const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints)

  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    linewidth: 1,
  })

  return new THREE.Line(geometry, material)
}

// ─── Stars background ───
const STARS = Array.from({ length: 200 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.5 + 0.3,
}))


// ═══════════════════════════════════════════════════════════════════
// ─── MAIN GLOBE COMPONENT ───
// ═══════════════════════════════════════════════════════════════════
export default function JobsGlobe({ jobs, onSave, onApply, savedJobs, appliedJobs }: JobsGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const earthGroupRef = useRef<THREE.Group | null>(null)
  const markersRef = useRef<THREE.Sprite[]>([])
  const pulseRingsRef = useRef<THREE.Sprite[]>([])
  const arcsRef = useRef<THREE.Line[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const dragRef = useRef({ active: false, x: 0, y: 0, vx: 0, vy: 0 })
  const clockRef = useRef<THREE.Clock | null>(null)

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [, setHoveredJobId] = useState<string | null>(null)

  const points = useMemo(() => {
    return jobs
      .map(job => {
        const coords = geocodeLocation(job.location)
        if (!coords) return null
        return { lat: coords[0], lng: coords[1], job, color: salaryColor(job.salary_min, job.salary_currency) }
      })
      .filter((p: any) => p !== null) as Array<{ lat: number; lng: number; job: Job; color: string }>
  }, [jobs])

  const avgSalary = useMemo(() => {
    const w = jobs.filter(j => j.salary_min)
    return w.length ? Math.round(w.reduce((s, j) => s + (j.salary_min || 0), 0) / w.length) : null
  }, [jobs])

  const topCity = useMemo(() => {
    const counts: Record<string, number> = {}
    points.forEach((p: any) => {
      if (!p) return
      const c = p.job.location?.split(',')[0]?.trim() || 'Unknown'
      counts[c] = (counts[c] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  }, [points])

  useEffect(() => {
    if (!containerRef.current) return

    const width = containerRef.current.offsetWidth
    const height = containerRef.current.offsetHeight
    const GLOBE_RADIUS = 100

    // ─── Clock for animations ───
    const clock = new THREE.Clock()
    clockRef.current = clock

    // ─── Scene ───
    const scene = new THREE.Scene()

    // ─── Camera ───
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000)
    camera.position.set(0, 20, 280)

    // ─── Renderer ───
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ─── Earth group ───
    const earthGroup = new THREE.Group()
    earthGroupRef.current = earthGroup
    scene.add(earthGroup)

    // ─── Lighting — balanced for night earth visibility ───
    // Enough ambient to see continents, directional for depth
    const ambientLight = new THREE.AmbientLight(0x223355, 2.5)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0x6699ff, 0.8)
    keyLight.position.set(200, 80, 100)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x334488, 0.4)
    fillLight.position.set(-150, -60, -80)
    scene.add(fillLight)

    // ─── Load textures ───
    const textureLoader = new THREE.TextureLoader()
    const nightTexture = textureLoader.load('//unpkg.com/three-globe/example/img/earth-night.jpg')
    const bumpTexture = textureLoader.load('//unpkg.com/three-globe/example/img/earth-topology.png')

    // ─── Earth sphere — city lights clearly visible ───
    const earthGeom = new THREE.SphereGeometry(GLOBE_RADIUS, 128, 128)
    const earthMat = new THREE.MeshPhongMaterial({
      map: nightTexture,
      bumpMap: bumpTexture,
      bumpScale: 2,
      specular: new THREE.Color(0x0a0a1a),
      shininess: 5,
    })
    const earth = new THREE.Mesh(earthGeom, earthMat)
    earthGroup.add(earth)

    // ─── Grid overlay on globe surface ───
    const grid = createGlobeGrid(GLOBE_RADIUS + 0.3)
    earthGroup.add(grid)

    // ─── Atmosphere — thin edge glow only, not a bloated ring ───
    const atmosGeom = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64)
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          // Sharp edge falloff — only glows at the limb, not the whole sphere
          float edge = dot(vNormal, vec3(0.0, 0.0, 1.0));
          float intensity = pow(max(0.0, 1.0 - abs(edge) * 1.4), 3.5);
          vec3 color = vec3(0.2, 0.5, 1.0);
          gl_FragColor = vec4(color, intensity * 0.9);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    })
    const atmosphere = new THREE.Mesh(atmosGeom, atmosMat)
    // Only 8% larger — thin rim, not a massive ring
    atmosphere.scale.set(1.08, 1.08, 1.08)
    earthGroup.add(atmosphere)

    // ─── Add markers with pulse rings ───
    markersRef.current = []
    pulseRingsRef.current = []

    points.forEach(p => {
      const pos = latLngToVector3(p.lat, p.lng, GLOBE_RADIUS + 1.5)

      // Main marker sprite
      const markerTex = createMarkerTexture(p.color)
      const spriteMat = new THREE.SpriteMaterial({
        map: markerTex,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const sprite = new THREE.Sprite(spriteMat)
      sprite.position.copy(pos)
      sprite.scale.set(10, 10, 1)
      sprite.userData = { job: p.job, jobId: p.job.id }
      earthGroup.add(sprite)
      markersRef.current.push(sprite)

      // Pulse ring 1
      const ringTex = createPulseRingTexture(p.color)
      const ringMat = new THREE.SpriteMaterial({
        map: ringTex,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.6,
      })
      const ring = new THREE.Sprite(ringMat)
      ring.position.copy(pos)
      ring.scale.set(5, 5, 1)
      ring.userData = { phase: Math.random() * Math.PI * 2, speed: 0.8 + Math.random() * 0.4 }
      earthGroup.add(ring)
      pulseRingsRef.current.push(ring)

      // Pulse ring 2 (offset phase)
      const ring2Mat = new THREE.SpriteMaterial({
        map: ringTex,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.3,
      })
      const ring2 = new THREE.Sprite(ring2Mat)
      ring2.position.copy(pos)
      ring2.scale.set(5, 5, 1)
      ring2.userData = { phase: Math.random() * Math.PI * 2 + Math.PI, speed: 0.6 + Math.random() * 0.3 }
      earthGroup.add(ring2)
      pulseRingsRef.current.push(ring2)
    })

    // ─── Network arcs between job locations ───
    arcsRef.current = []
    const arcColors = [0x3399ff, 0x55aaff, 0x4488ee, 0x66bbff, 0x2277dd]

    if (points.length > 1) {
      const usedPairs = new Set<string>()
      const maxArcs = Math.min(points.length * 2, 40)
      let arcCount = 0

      for (let i = 0; i < points.length && arcCount < maxArcs; i++) {
        const connections = Math.min(3, points.length - 1)
        for (let c = 0; c < connections && arcCount < maxArcs; c++) {
          const j = (i + 1 + Math.floor(Math.random() * (points.length - 1))) % points.length
          if (i === j) continue

          const pairKey = [Math.min(i, j), Math.max(i, j)].join('-')
          if (usedPairs.has(pairKey)) continue
          usedPairs.add(pairKey)

          const startPos = latLngToVector3(points[i].lat, points[i].lng, GLOBE_RADIUS + 1)
          const endPos = latLngToVector3(points[j].lat, points[j].lng, GLOBE_RADIUS + 1)

          const arcColor = arcColors[Math.floor(Math.random() * arcColors.length)]
          // Higher base opacity so arcs are actually visible
          const opacity = 0.45 + Math.random() * 0.3

          const arc = createArc(startPos, endPos, GLOBE_RADIUS, arcColor, opacity)
          arc.userData = { phase: Math.random() * Math.PI * 2, baseOpacity: opacity }
          earthGroup.add(arc)
          arcsRef.current.push(arc)
          arcCount++
        }
      }
    }

    // ─── Floating particles around globe ───
    const particleCount = 300
    const particlePositions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const r = GLOBE_RADIUS + 5 + Math.random() * 40
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      particlePositions[i * 3 + 1] = r * Math.cos(phi)
      particlePositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    const particleGeom = new THREE.BufferGeometry()
    particleGeom.setAttribute('position', new THREE.Float32BufferAttribute(Array.from(particlePositions), 3))

    const particleCanvas = document.createElement('canvas')
    particleCanvas.width = 32
    particleCanvas.height = 32
    const pctx = particleCanvas.getContext('2d')!
    const pgrd = pctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    pgrd.addColorStop(0, 'rgba(100,150,255,0.8)')
    pgrd.addColorStop(0.5, 'rgba(100,150,255,0.2)')
    pgrd.addColorStop(1, 'rgba(100,150,255,0)')
    pctx.fillStyle = pgrd
    pctx.fillRect(0, 0, 32, 32)

    const particleTex = new THREE.CanvasTexture(particleCanvas)
    const particleMat = new THREE.PointsMaterial({
      size: 1.2,
      map: particleTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.5,
    })
    const particles = new THREE.Points(particleGeom, particleMat)
    earthGroup.add(particles)

    // ─── Mouse event handlers ───
    const onMouseDown = (e: MouseEvent) => {
      dragRef.current.active = true
      dragRef.current.x = e.clientX
      dragRef.current.y = e.clientY
      dragRef.current.vx = 0
      dragRef.current.vy = 0
      renderer.domElement.style.cursor = 'grabbing'
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      if (dragRef.current.active) {
        dragRef.current.vx = (e.clientX - dragRef.current.x) * 0.004
        dragRef.current.vy = (e.clientY - dragRef.current.y) * 0.004
        dragRef.current.x = e.clientX
        dragRef.current.y = e.clientY
      }
    }

    const onMouseUp = () => {
      dragRef.current.active = false
      renderer.domElement.style.cursor = 'grab'
    }

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(markersRef.current)
      if (intersects.length > 0) {
        const job = (intersects[0].object as any).userData?.job
        if (job) setSelectedJob(job)
      }
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('mouseleave', onMouseUp)
    renderer.domElement.addEventListener('click', onClick)
    renderer.domElement.style.cursor = 'grab'

    // Touch events for mobile
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        dragRef.current.active = true
        dragRef.current.x = e.touches[0].clientX
        dragRef.current.y = e.touches[0].clientY
        dragRef.current.vx = 0
        dragRef.current.vy = 0
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && dragRef.current.active) {
        e.preventDefault()
        dragRef.current.vx = (e.touches[0].clientX - dragRef.current.x) * 0.004
        dragRef.current.vy = (e.touches[0].clientY - dragRef.current.y) * 0.004
        dragRef.current.x = e.touches[0].clientX
        dragRef.current.y = e.touches[0].clientY
      }
    }
    const onTouchEnd = () => { dragRef.current.active = false }

    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true })
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false })
    renderer.domElement.addEventListener('touchend', onTouchEnd)

    // Zoom
    renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault()
      camera.position.z += e.deltaY * 0.12
      camera.position.z = Math.max(160, Math.min(500, camera.position.z))
    }, { passive: false } as any)


    // ═══════════════════════════════════════════
    // ─── Animation loop ───
    // ═══════════════════════════════════════════
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      // ── Drag rotation with inertia ──
      if (dragRef.current.active) {
        earthGroup.rotation.y += dragRef.current.vx
        earthGroup.rotation.x += dragRef.current.vy
        // Clamp vertical rotation
        earthGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, earthGroup.rotation.x))
      } else {
        earthGroup.rotation.y += dragRef.current.vx * 0.94
        earthGroup.rotation.x += dragRef.current.vy * 0.94
        earthGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, earthGroup.rotation.x))
        dragRef.current.vx *= 0.94
        dragRef.current.vy *= 0.94
      }

      // Auto-rotate when idle
      if (!dragRef.current.active && Math.abs(dragRef.current.vx) < 0.0001 && Math.abs(dragRef.current.vy) < 0.0001) {
        earthGroup.rotation.y += 0.0008
      }

      // ── Animate pulse rings ──
      pulseRingsRef.current.forEach(ring => {
        const data = ring.userData
        const t = (elapsed * data.speed + data.phase) % (Math.PI * 2)
        const pulseScale = 5 + Math.sin(t) * 6
        const pulseOpacity = 0.5 * (1 - Math.abs(Math.sin(t)))
        ring.scale.set(pulseScale, pulseScale, 1)
        ;(ring.material as any).opacity = pulseOpacity
      })

      // ── Animate arc opacity (gentle breathing, stays visible) ──
      arcsRef.current.forEach(arc => {
        const phase = arc.userData.phase || 0
        const base = arc.userData.baseOpacity || 0.5
        const breath = base * (0.7 + Math.abs(Math.sin(elapsed * 0.6 + phase)) * 0.3)
        ;(arc.material as any).opacity = breath
      })

      // ── Animate particles (slow orbit) ──
      particles.rotation.y += 0.0003
      particles.rotation.x += 0.0001

      // ── Hover detection (throttled) ──
      if (Math.floor(elapsed * 10) % 2 === 0) {
        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(mouseRef.current as any, camera)
        const intersects = raycaster.intersectObjects(markersRef.current)
        if (intersects.length > 0) {
          const jobId = (intersects[0].object as any).userData?.jobId
          setHoveredJobId(jobId || null)
          renderer.domElement.style.cursor = dragRef.current.active ? 'grabbing' : 'pointer'
        } else {
          setHoveredJobId(null)
          if (!dragRef.current.active) renderer.domElement.style.cursor = 'grab'
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    // ─── Resize handler ───
    const handleResize = () => {
      const w = containerRef.current?.offsetWidth || width
      const h = containerRef.current?.offsetHeight || height
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // ─── Cleanup ───
    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('mouseleave', onMouseUp)
      renderer.domElement.removeEventListener('click', onClick)
      renderer.domElement.removeEventListener('touchstart', onTouchStart)
      renderer.domElement.removeEventListener('touchmove', onTouchMove)
      renderer.domElement.removeEventListener('touchend', onTouchEnd)
      cancelAnimationFrame(animId)
      renderer.dispose()
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [points])

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{
      background: 'radial-gradient(ellipse at 50% 50%, #080820 0%, #040410 50%, #000005 100%)',
    }}>
      {/* Star field */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map(s => (
          <motion.div key={s.id} className="absolute rounded-full bg-white" style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%`, opacity: s.opacity }} animate={{ opacity: [s.opacity, s.opacity * 1.8, s.opacity] }} transition={{ duration: 3 + Math.random() * 2, repeat: Infinity }} />
        ))}
      </div>

      {/* Top stats bar */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6 px-6 py-3 rounded-2xl" style={{ background: 'rgba(5,5,18,0.95)', border: '1px solid rgba(60,80,180,0.25)', backdropFilter: 'blur(20px)', boxShadow: '0 4px 30px rgba(30,60,180,0.08)' }}>
        {[
          { label: 'Pinned', value: points.length, color: '#74b9ff' },
          { label: 'Total', value: jobs.length, color: '#a29bfe' },
          { label: 'Top City', value: topCity, color: '#fd79a8' },
          { label: 'Avg Salary', value: avgSalary ? `$${Math.round(avgSalary / 1000)}K` : 'N/A', color: '#ffd700' },
        ].map((s, i) => (
          <div key={s.label} className="flex items-center gap-6">
            {i > 0 && <div className="w-px h-4" style={{ background: 'rgba(60,80,180,0.2)' }} />}
            <div className="text-center">
              <div className="text-[15px] font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-[#3a4a7a] font-medium uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Salary legend */}
      <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="absolute bottom-6 left-5 z-20 rounded-xl p-4" style={{ background: 'rgba(5,5,18,0.95)', border: '1px solid rgba(60,80,180,0.2)', backdropFilter: 'blur(20px)', boxShadow: '0 4px 30px rgba(30,60,180,0.06)' }}>
        <p className="text-[9px] font-bold tracking-widest uppercase text-[#3a4a7a] mb-3">Salary Range</p>
        {[
          { color: '#ffd700', label: '$150K+' },
          { color: '#fd79a8', label: '$100K–150K' },
          { color: '#a29bfe', label: '$60K–100K' },
          { color: '#74b9ff', label: '$30K–60K' },
          { color: '#55efc4', label: 'Below $30K' },
        ].map(t => (
          <div key={t.label} className="flex items-center gap-2.5 mb-2">
            <motion.div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: t.color, boxShadow: `0 0 10px ${t.color}80, 0 0 20px ${t.color}40` }}
              animate={{ scale: [1, 1.3, 1], boxShadow: [`0 0 10px ${t.color}80`, `0 0 16px ${t.color}AA`, `0 0 10px ${t.color}80`] }}
              transition={{ duration: 2, repeat: Infinity, delay: Math.random() }}
            />
            <span className="text-[10px] text-white/60">{t.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Network label */}
      {points.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute top-4 right-5 z-20 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(5,5,18,0.95)', border: '1px solid rgba(60,80,180,0.2)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4488ff', boxShadow: '0 0 8px #4488ff' }} />
            <span className="text-[10px] text-[#6688cc] font-medium">{arcsRef.current.length || '—'} Network Links</span>
          </div>
        </motion.div>
      )}

      {/* Help text */}
      {points.length > 0 && !selectedJob && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} className="absolute bottom-6 right-5 z-20 text-right pointer-events-none">
          <p className="text-[10px] text-[#2a3a5a]">Drag to rotate · Scroll to zoom · Click marker for details</p>
        </motion.div>
      )}

      {/* Selected job card */}
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

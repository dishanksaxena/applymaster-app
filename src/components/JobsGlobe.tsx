'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

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

const STARS = Array.from({ length: 200 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.5 + 0.3,
}))

export default function JobsGlobe({ jobs, onSave, onApply, savedJobs, appliedJobs }: JobsGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const earthGroupRef = useRef<THREE.Group | null>(null)
  const markersRef = useRef<THREE.Sprite[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const dragRef = useRef({ active: false, x: 0, y: 0, vx: 0, vy: 0 })

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null)

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

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000)
    camera.position.set(0, 0, 260)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const earthGroup = new THREE.Group()
    earthGroupRef.current = earthGroup
    scene.add(earthGroup)

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.4))
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2)
    sunLight.position.set(100, 100, 100)
    scene.add(sunLight)

    // Load textures
    const textureLoader = new THREE.TextureLoader()
    const nightTexture = textureLoader.load('//unpkg.com/three-globe/example/img/earth-night.jpg')
    const bumpTexture = textureLoader.load('//unpkg.com/three-globe/example/img/earth-topology.png')

    // Earth - OPAQUE, VISIBLE
    const earthGeom = new THREE.SphereGeometry(100, 128, 128)
    const earthMat = new THREE.MeshPhongMaterial({
      map: nightTexture,
      bumpMap: bumpTexture,
      bumpScale: 3,
      specular: new THREE.Color(0x222222),
      shininess: 10,
    })
    const earth = new THREE.Mesh(earthGeom, earthMat)
    earthGroup.add(earth)

    // Atmosphere glow
    const atmosGeom = new THREE.SphereGeometry(100, 64, 64)
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vNormal; void main() { float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0); gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity; }`,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    })
    const atmosphere = new THREE.Mesh(atmosGeom, atmosMat)
    atmosphere.scale.set(1.15, 1.15, 1.15)
    earthGroup.add(atmosphere)

    // Add markers
    const updateMarkers = () => {
      markersRef.current.forEach(m => earthGroup.remove(m))
      markersRef.current = []

      points.forEach(p => {
        const pos = latLngToVector3(p.lat, p.lng, 102)

        // Create glowing marker
        const canvas = document.createElement('canvas')
        canvas.width = 48
        canvas.height = 48
        const ctx = canvas.getContext('2d')!

        const hex = p.color.replace('#', '')
        const r = parseInt(hex.substr(0, 2), 16)
        const g = parseInt(hex.substr(2, 2), 16)
        const b = parseInt(hex.substr(4, 2), 16)

        const gradient = ctx.createRadialGradient(24, 24, 0, 24, 24, 24)
        gradient.addColorStop(0, `rgba(255,255,255,1)`)
        gradient.addColorStop(0.4, `rgba(${r},${g},${b},0.8)`)
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 48, 48)

        const texture = new THREE.CanvasTexture(canvas)
        const spriteMat = new THREE.SpriteMaterial({ map: texture, blending: THREE.AdditiveBlending, depthWrite: false })
        const sprite = new THREE.Sprite(spriteMat)
        sprite.position.copy(pos)
        sprite.scale.set(4, 4, 1)
        sprite.userData = { job: p.job, jobId: p.job.id }

        earthGroup.add(sprite)
        markersRef.current.push(sprite)
      })
    }

    updateMarkers()

    // Mouse events
    const onMouseDown = (e: MouseEvent) => {
      dragRef.current.active = true
      dragRef.current.x = e.clientX
      dragRef.current.y = e.clientY
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      if (dragRef.current.active) {
        dragRef.current.vx = (e.clientX - dragRef.current.x) * 0.003
        dragRef.current.vy = (e.clientY - dragRef.current.y) * 0.003
        dragRef.current.x = e.clientX
        dragRef.current.y = e.clientY
      }
    }

    const onMouseUp = () => {
      dragRef.current.active = false
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
    renderer.domElement.addEventListener('click', onClick)

    renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault()
      camera.position.z += e.deltaY * 0.15
      camera.position.z = Math.max(150, Math.min(500, camera.position.z))
    }, { passive: false } as any)

    // Animation loop
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)

      // Apply drag rotation
      if (dragRef.current.active) {
        earthGroup.rotation.y += dragRef.current.vx
        earthGroup.rotation.x += dragRef.current.vy
      } else {
        earthGroup.rotation.y += dragRef.current.vx * 0.92
        earthGroup.rotation.x += dragRef.current.vy * 0.92
        dragRef.current.vx *= 0.92
        dragRef.current.vy *= 0.92
      }

      // Auto rotate when not dragging
      if (!dragRef.current.active && Math.abs(dragRef.current.vx) < 0.0001 && Math.abs(dragRef.current.vy) < 0.0001) {
        earthGroup.rotation.y += 0.0002
      }

      // Hover detection
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouseRef.current, camera)
      const intersects = raycaster.intersectObjects(markersRef.current)

      if (intersects.length > 0) {
        const jobId = (intersects[0].object as any).userData?.jobId
        setHoveredJobId(jobId || null)
      } else {
        setHoveredJobId(null)
      }

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      const w = containerRef.current?.offsetWidth || width
      const h = containerRef.current?.offsetHeight || height
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('click', onClick)
      cancelAnimationFrame(animId)
      renderer.dispose()
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [points])

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 50%, #0c0c28 0%, #050510 70%, #000000 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map(s => (
          <motion.div key={s.id} className="absolute rounded-full bg-white" style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%`, opacity: s.opacity }} animate={{ opacity: [s.opacity, s.opacity * 2, s.opacity] }} transition={{ duration: 3 + Math.random() * 2, repeat: Infinity }} />
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6 px-6 py-3 rounded-2xl" style={{ background: 'rgba(8,8,20,0.92)', border: '1px solid rgba(162,155,254,0.2)', backdropFilter: 'blur(20px)' }}>
        {[{ label: 'Pinned', value: points.length }, { label: 'Total', value: jobs.length }, { label: 'Top City', value: topCity }, { label: 'Avg Salary', value: avgSalary ? `$${Math.round(avgSalary / 1000)}K` : 'N/A' }].map((s, i) => (
          <div key={s.label} className="flex items-center gap-6">{i > 0 && <div className="w-px h-4 bg-white/10" />}<div className="text-center"><div className="text-[15px] font-bold text-white">{s.value}</div><div className="text-[9px] text-[#4a4a6a] font-medium uppercase tracking-wider">{s.label}</div></div></div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="absolute bottom-6 left-5 z-20 rounded-xl p-4" style={{ background: 'rgba(8,8,20,0.92)', border: '1px solid rgba(162,155,254,0.2)', backdropFilter: 'blur(20px)' }}>
        <p className="text-[9px] font-bold tracking-widest uppercase text-[#4a4a6a] mb-3">Salary</p>
        {[{ color: '#ffd700', label: '$150K+' }, { color: '#fd79a8', label: '$100K–150K' }, { color: '#a29bfe', label: '$60K–100K' }, { color: '#74b9ff', label: '$30K–60K' }, { color: '#55efc4', label: 'Below $30K' }].map(t => (
          <div key={t.label} className="flex items-center gap-2 mb-2"><motion.div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: Math.random() }} /><span className="text-[10px] text-white/70">{t.label}</span></div>
        ))}
      </motion.div>

      {points.length > 0 && !selectedJob && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="absolute bottom-6 right-5 z-20 text-right pointer-events-none"><p className="text-[10px] text-[#3a3a5a]">Drag to rotate · Scroll to zoom · Click pin for details</p></motion.div>
      )}

      <AnimatePresence>{selectedJob && <JobCard job={selectedJob} onClose={() => setSelectedJob(null)} onSave={() => onSave(selectedJob)} onApply={() => onApply(selectedJob)} isSaved={savedJobs.has(selectedJob.id)} isApplied={appliedJobs.has(selectedJob.id)} />}</AnimatePresence>
    </div>
  )
}

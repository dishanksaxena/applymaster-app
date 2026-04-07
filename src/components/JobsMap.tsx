'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Mapbox access token (using free tile service as fallback)
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

const CITY_COORDS: Record<string, [number, number]> = {
  'new york': [-74.006, 40.7128], 'san francisco': [-122.4194, 37.7749],
  'seattle': [-122.3321, 47.6062], 'austin': [-97.7431, 30.2672],
  'boston': [-71.0589, 42.3601], 'chicago': [-87.6298, 41.8781],
  'los angeles': [-118.2437, 34.0522], 'denver': [-104.9903, 39.7392],
  'atlanta': [-84.388, 33.749], 'miami': [-80.1918, 25.7617],
  'dallas': [-96.797, 32.7767], 'washington': [-77.0369, 38.9072],
  'portland': [-122.6765, 45.5231], 'san jose': [-121.8863, 37.3382],
  'phoenix': [-112.074, 33.4484], 'philadelphia': [-75.1652, 39.9526],
  'highland park': [-74.9271, 40.1978],
  ', al': [-86.7911, 32.8067], ', ak': [-153.4937, 64.2008],
  ', az': [-111.0937, 34.0489], ', ar': [-92.3731, 34.9697],
  ', ca': [-119.4179, 36.7783], ', co': [-105.7821, 39.5501],
  ', ct': [-73.0877, 41.6032], ', de': [-75.5277, 38.9108],
  ', fl': [-81.5158, 27.6648], ', ga': [-82.9001, 32.1656],
  ', hi': [-155.5828, 19.8968], ', id': [-114.742, 44.0682],
  ', il': [-89.3985, 40.6331], ', in': [-86.1349, 40.2672],
  ', ia': [-93.0977, 41.878], ', ks': [-98.4842, 39.0119],
  ', ky': [-84.2700, 37.8393], ', la': [-92.1450, 31.2448],
  ', me': [-69.3819, 44.6939], ', md': [-76.6413, 39.0458],
  ', ma': [-71.3824, 42.4072], ', mi': [-85.6024, 44.3148],
  ', mn': [-94.6859, 46.7296], ', ms': [-89.3985, 32.3547],
  ', mo': [-91.8318, 37.9643], ', mt': [-110.3626, 46.8797],
  ', ne': [-99.9018, 41.4925], ', nv': [-116.4194, 38.8026],
  ', nh': [-71.5724, 43.1939], ', nj': [-74.4057, 40.0583],
  ', nm': [-105.8701, 34.5199], ', ny': [-74.9481, 42.1657],
  ', nc': [-79.0193, 35.7596], ', nd': [-101.002, 47.5515],
  ', oh': [-82.9071, 40.4173], ', ok': [-97.5164, 35.4676],
  ', or': [-120.5542, 43.8041], ', pa': [-77.1945, 41.2033],
  ', ri': [-71.5118, 41.6809], ', sc': [-81.1637, 33.8361],
  ', sd': [-99.9018, 43.9695], ', tn': [-86.5804, 35.5175],
  ', tx': [-99.9018, 31.9686], ', ut': [-111.0937, 39.3210],
  ', vt': [-72.5778, 44.5588], ', va': [-78.6569, 37.4316],
  ', wa': [-120.7401, 47.7511], ', wv': [-80.4549, 38.5976],
  ', wi': [-88.7879, 43.7844], ', wy': [-107.2903, 43.0760],
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

interface MapPoint {
  coords: [number, number]; job: Job; color: string; salary: string
}

function salaryColor(min: number | null, currency = 'USD') {
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

export default function JobsMap({ jobs, onSave, onApply, savedJobs, appliedJobs }: {
  jobs: Job[]; onSave: (job: Job) => void; onApply: (job: Job) => void
  savedJobs: Set<string>; appliedJobs: Set<string>
}) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const points: MapPoint[] = useMemo(() => {
    return jobs
      .map(job => {
        const coords = geocodeLocation(job.location)
        if (!coords) return null
        return {
          coords,
          job,
          color: salaryColor(job.salary_min, job.salary_currency),
          salary: formatSalary(job.salary_min, job.salary_max, job.salary_currency),
        }
      })
      .filter(Boolean) as MapPoint[]
  }, [jobs])

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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    // Create map with OSM fallback (no Mapbox token needed)
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // CartoDB Positron
      center: [-96, 38], // USA center
      zoom: 4,
      pitch: 0,
      bearing: 0,
    })

    map.current.on('load', () => {
      // Add source for connecting lines (will be updated with points)
    })

    return () => {
      map.current?.remove()
    }
  }, [])

  // Update markers when points change
  useEffect(() => {
    if (!map.current) return

    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Clear lines layer
    if (map.current.getLayer('job-lines')) {
      map.current.removeLayer('job-lines')
    }
    if (map.current.getSource('job-lines')) {
      map.current.removeSource('job-lines')
    }

    if (points.length === 0) return

    // Create GeoJSON for lines
    const lineFeatures = points.map(p => ({
      type: 'Feature' as const,
      geometry: { type: 'LineString' as const, coordinates: [[-96, 38], p.coords] },
      properties: { jobId: p.job.id },
    }))

    // Add source and layer for lines
    try {
      map.current.addSource('job-lines', {
        type: 'geojson',
        data: { type: 'FeatureCollection' as const, features: lineFeatures },
      })

      map.current.addLayer({
        id: 'job-lines',
        type: 'line',
        source: 'job-lines',
        paint: {
          'line-color': ['case',
            ['boolean', ['feature-state', 'hover'], false], '#fd79a8', '#a29bfe'
          ],
          'line-width': ['case',
            ['boolean', ['feature-state', 'hover'], false], 2, 0.8
          ],
          'line-opacity': ['case',
            ['boolean', ['feature-state', 'hover'], false], 0.8, 0.3
          ],
        },
      })
    } catch (e) {
      // Layer might already exist
    }

    // Add markers for each point
    points.forEach(p => {
      const el = document.createElement('div')
      const isHovered = p.job.id === hoveredJobId
      const size = isHovered ? 48 : 36

      el.className = 'cursor-pointer transition-all'
      el.innerHTML = `
        <div style="
          width: ${size}px; height: ${size}px;
          background: ${p.color};
          border: 2px solid rgba(255,255,255,0.9);
          border-radius: 50%;
          box-shadow: 0 0 ${isHovered ? '20' : '10'}px ${p.color}80;
          display: flex; align-items: center; justify-center;
          font-weight: bold; color: rgba(255,255,255,0.9); font-size: 12px;
          transition: all 0.2s ease;
        ">
          💼
        </div>
      `

      el.addEventListener('click', () => setSelectedJob(p.job))
      el.addEventListener('mouseenter', () => {
        setHoveredJobId(p.job.id)
        if (map.current?.getSource('job-lines')) {
          points.forEach(pt => {
            try {
              map.current?.setFeatureState(
                { source: 'job-lines', id: points.indexOf(pt) },
                { hover: pt.job.id === p.job.id }
              )
            } catch (e) {}
          })
        }
      })
      el.addEventListener('mouseleave', () => {
        setHoveredJobId(null)
        if (map.current?.getSource('job-lines')) {
          points.forEach((pt, i) => {
            try {
              map.current?.setFeatureState(
                { source: 'job-lines', id: i },
                { hover: false }
              )
            } catch (e) {}
          })
        }
      })

      const marker = new mapboxgl.Marker(el)
        .setLngLat(p.coords)
        .addTo(map.current!)

      markersRef.current.push(marker)
    })
  }, [points, hoveredJobId])

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl">
      {/* Mapbox container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Stats bar */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
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

      {/* Salary Legend */}
      <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
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

      {/* No pins message */}
      {points.length === 0 && jobs.length > 0 && (
        <div className="absolute bottom-6 right-6 z-20 text-right pointer-events-none">
          <p className="text-[11px] text-[#4a4a6a]">{jobs.length} jobs found but locations couldn't be mapped</p>
        </div>
      )}

      {jobs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-[#3a3a5a] text-sm">Search for jobs to see them on the map</p>
        </div>
      )}

      {/* Hint */}
      {points.length > 0 && !selectedJob && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-6 right-5 z-20 text-right pointer-events-none">
          <p className="text-[10px] text-[#3a3a5a]">Click a pin · Drag to pan · Scroll to zoom</p>
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

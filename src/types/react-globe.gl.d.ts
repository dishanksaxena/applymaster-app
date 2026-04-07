declare module 'react-globe.gl' {
  import { ComponentType, MutableRefObject } from 'react'

  interface GlobeProps {
    ref?: MutableRefObject<any>
    width?: number
    height?: number
    backgroundColor?: string
    globeImageUrl?: string
    atmosphereColor?: string
    atmosphereAltitude?: number
    pointsData?: any[]
    pointLat?: string | ((d: any) => number)
    pointLng?: string | ((d: any) => number)
    pointColor?: string | ((d: any) => string)
    pointAltitude?: string | number | ((d: any) => number)
    pointRadius?: string | number | ((d: any) => number)
    pointResolution?: number
    onPointClick?: (point: any, event: MouseEvent) => void
    onPointHover?: (point: any, prevPoint: any) => void
    ringsData?: any[]
    ringLat?: string | ((d: any) => number)
    ringLng?: string | ((d: any) => number)
    ringColor?: string | ((d: any) => (t: number) => string)
    ringMaxRadius?: number
    ringPropagationSpeed?: number
    ringRepeatPeriod?: number
    onGlobeReady?: () => void
    [key: string]: any
  }

  const Globe: ComponentType<GlobeProps>
  export default Globe
}

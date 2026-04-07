declare module 'mapbox-gl' {
  export interface IControl {
    onAdd(map: Map): HTMLElement
    onRemove(map: Map): void
    getDefaultPosition?(): string
  }

  export interface MapboxGeoJSONFeature {
    type: string
    geometry: GeoJSON.Geometry
    properties: any
    id?: string | number
    source: string
    sourceLayer?: string
    state: any
  }

  export interface GeoJSONSource {
    type: 'geojson'
    data?: GeoJSON.Feature | GeoJSON.FeatureCollection | string
    lineMetrics?: boolean
    generateId?: boolean
  }

  export interface LayerSpecification {
    id: string
    type: string
    source?: string | { type: string; [key: string]: any }
    paint?: any
    layout?: any
    filter?: any
    [key: string]: any
  }

  export interface MapOptions {
    container: string | HTMLElement
    style: string | object
    center?: [number, number]
    zoom?: number
    pitch?: number
    bearing?: number
    [key: string]: any
  }

  export class Map {
    constructor(options: MapOptions)
    on(event: string, callback: (e: any) => void): void
    off(event: string, callback: (e: any) => void): void
    addSource(id: string, source: any): void
    addLayer(layer: LayerSpecification): void
    getSource(id: string): any
    getLayer(id: string): any
    removeLayer(id: string): void
    removeSource(id: string): void
    setFeatureState(target: any, state: any): void
    getCanvas(): HTMLCanvasElement
    remove(): void
    [key: string]: any
  }

  export class Marker {
    constructor(element?: HTMLElement, options?: any)
    setLngLat(lngLat: [number, number] | { lng: number; lat: number }): Marker
    addTo(map: Map): Marker
    remove(): Marker
    setPopup(popup: Popup): Marker
    togglePopup(): Marker
    getElement(): HTMLElement
    getPopup(): Popup | undefined
    [key: string]: any
  }

  export class Popup {
    setLngLat(lngLat: [number, number]): Popup
    setHTML(html: string): Popup
    addTo(map: Map): Popup
    remove(): Popup
    [key: string]: any
  }

  export interface NavigationControlOptions {
    showCompass?: boolean
    showZoom?: boolean
    visualizePitch?: boolean
  }

  export class NavigationControl implements IControl {
    constructor(options?: NavigationControlOptions)
    onAdd(map: Map): HTMLElement
    onRemove(map: Map): void
  }

  export let accessToken: string
}

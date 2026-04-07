declare module 'three' {
  export class Vector3 {
    constructor(x?: number, y?: number, z?: number)
    x: number
    y: number
    z: number
    set(x: number, y: number, z: number): Vector3
    copy(v: Vector3): Vector3
    add(v: Vector3): Vector3
    addVectors(a: Vector3, b: Vector3): Vector3
    multiplyScalar(s: number): Vector3
    normalize(): Vector3
    [key: string]: any
  }

  export class Vector2 {
    constructor(x?: number, y?: number)
    x: number
    y: number
    [key: string]: any
  }

  export class Color {
    constructor(r?: number | string, g?: number, b?: number)
    [key: string]: any
  }

  export class Matrix4 {
    [key: string]: any
  }

  export class Quaternion {
    [key: string]: any
  }

  export class Euler {
    constructor(x?: number, y?: number, z?: number, order?: string)
    x: number
    y: number
    z: number
    [key: string]: any
  }

  export class Geometry {
    vertices: Vector3[]
    [key: string]: any
  }

  export class BufferGeometry {
    setFromPoints(points: Vector3[]): BufferGeometry
    [key: string]: any
  }

  export class Material {
    [key: string]: any
  }

  export class MeshPhongMaterial extends Material {
    constructor(parameters?: any)
    map?: Texture
    bumpMap?: Texture
    bumpScale?: number
    specularMap?: Texture
    specular?: Color
    shininess?: number
    emissive?: Color
    emissiveIntensity?: number
    [key: string]: any
  }

  export class ShaderMaterial extends Material {
    constructor(parameters?: any)
    uniforms?: any
    vertexShader?: string
    fragmentShader?: string
    transparent?: boolean
    side?: number
    blending?: number
    [key: string]: any
  }

  export class LineBasicMaterial extends Material {
    constructor(parameters?: any)
    color?: Color
    transparent?: boolean
    opacity?: number
    blending?: number
    linewidth?: number
    [key: string]: any
  }

  export class SpriteMaterial extends Material {
    constructor(parameters?: any)
    map?: Texture
    blending?: number
    depthWrite?: boolean
    [key: string]: any
  }

  export class Mesh {
    constructor(geometry: BufferGeometry | Geometry, material?: Material)
    geometry: BufferGeometry | Geometry
    material: Material
    position: Vector3
    rotation: Euler
    scale: Vector3
    userData: any
    [key: string]: any
  }

  export class Line {
    constructor(geometry: BufferGeometry, material?: Material)
    geometry: BufferGeometry
    material: Material
    [key: string]: any
  }

  export class Sprite {
    constructor(material?: Material)
    position: Vector3
    scale: Vector3
    material: Material
    userData: any
    [key: string]: any
  }

  export class Group {
    constructor()
    add(...objects: any[]): Group
    remove(...objects: any[]): Group
    position: Vector3
    rotation: Euler
    scale: Vector3
    children: any[]
    [key: string]: any
  }

  export class Scene {
    constructor()
    add(...objects: any[]): Scene
    remove(...objects: any[]): Scene
    [key: string]: any
  }

  export class Camera {
    position: Vector3
    [key: string]: any
  }

  export class PerspectiveCamera extends Camera {
    constructor(fov: number, aspect: number, near: number, far: number)
    fov: number
    aspect: number
    near: number
    far: number
    updateProjectionMatrix(): void
    [key: string]: any
  }

  export class WebGLRenderer {
    constructor(parameters?: any)
    setSize(width: number, height: number): void
    setPixelRatio(ratio: number): void
    render(scene: Scene, camera: Camera): void
    dispose(): void
    domElement: HTMLCanvasElement
    outputColorSpace: string
    [key: string]: any
  }

  export class SphereGeometry extends BufferGeometry {
    constructor(radius: number, widthSegments?: number, heightSegments?: number)
    [key: string]: any
  }

  export class TextureLoader {
    load(url: string, onLoad?: (texture: Texture) => void): Texture
    [key: string]: any
  }

  export class Texture {
    [key: string]: any
  }

  export class CanvasTexture extends Texture {
    constructor(canvas: HTMLCanvasElement)
  }

  export class Light {
    [key: string]: any
  }

  export class AmbientLight extends Light {
    constructor(color?: number | string, intensity?: number)
    [key: string]: any
  }

  export class DirectionalLight extends Light {
    constructor(color?: number | string, intensity?: number)
    position: Vector3
    [key: string]: any
  }

  export class PointLight extends Light {
    constructor(color?: number | string, intensity?: number)
    position: Vector3
    [key: string]: any
  }

  export class QuadraticBezierCurve3 {
    constructor(v0: Vector3, v1: Vector3, v2: Vector3)
    getPoints(divisions?: number): Vector3[]
    [key: string]: any
  }

  export class Raycaster {
    constructor()
    setFromCamera(coords: Vector2, camera: Camera): void
    intersectObjects(objects: any[], recursive?: boolean): any[]
    [key: string]: any
  }

  export const SRGBColorSpace: string
  export const AdditiveBlending: number
  export const BackSide: number
  export const FrontSide: number
  export const DoubleSide: number
}

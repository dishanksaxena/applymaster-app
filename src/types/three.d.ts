declare module 'three' {
  export class Vector3 {
    constructor(x?: number, y?: number, z?: number)
    x: number
    y: number
    z: number
    set(x: number, y: number, z: number): Vector3
    copy(v: Vector3): Vector3
    clone(): Vector3
    add(v: Vector3): Vector3
    addVectors(a: Vector3, b: Vector3): Vector3
    sub(v: Vector3): Vector3
    multiplyScalar(s: number): Vector3
    normalize(): Vector3
    length(): number
    lerp(v: Vector3, alpha: number): Vector3
    cross(v: Vector3): Vector3
    dot(v: Vector3): number
    applyMatrix4(m: Matrix4): Vector3
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
    r: number
    g: number
    b: number
    setHex(hex: number): Color
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
    setAttribute(name: string, attribute: any): BufferGeometry
    dispose(): void
    [key: string]: any
  }

  export class BufferAttribute {
    constructor(array: Float32Array | Uint8Array | Uint16Array | Uint32Array, itemSize: number, normalized?: boolean)
    [key: string]: any
  }

  export class Float32BufferAttribute extends BufferAttribute {
    constructor(array: number[] | Float32Array, itemSize: number)
  }

  export class Material {
    transparent?: boolean
    opacity?: number
    dispose(): void
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

  export class MeshBasicMaterial extends Material {
    constructor(parameters?: any)
    color?: Color
    map?: Texture
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
    depthWrite?: boolean
    [key: string]: any
  }

  export class LineBasicMaterial extends Material {
    constructor(parameters?: any)
    color?: Color | number
    transparent?: boolean
    opacity?: number
    blending?: number
    linewidth?: number
    [key: string]: any
  }

  export class PointsMaterial extends Material {
    constructor(parameters?: any)
    color?: Color | number
    size?: number
    map?: Texture
    blending?: number
    depthWrite?: boolean
    [key: string]: any
  }

  export class SpriteMaterial extends Material {
    constructor(parameters?: any)
    map?: Texture
    blending?: number
    depthWrite?: boolean
    color?: Color | number
    opacity?: number
    [key: string]: any
  }

  export class Object3D {
    position: Vector3
    rotation: Euler
    scale: Vector3
    visible: boolean
    userData: any
    children: Object3D[]
    add(...objects: Object3D[]): Object3D
    remove(...objects: Object3D[]): Object3D
    [key: string]: any
  }

  export class Mesh extends Object3D {
    constructor(geometry?: BufferGeometry | Geometry, material?: Material)
    geometry: BufferGeometry | Geometry
    material: Material
    [key: string]: any
  }

  export class Line extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material)
    geometry: BufferGeometry
    material: Material
    [key: string]: any
  }

  export class LineSegments extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material)
    geometry: BufferGeometry
    material: Material
    [key: string]: any
  }

  export class Points extends Object3D {
    constructor(geometry?: BufferGeometry, material?: PointsMaterial)
    geometry: BufferGeometry
    material: PointsMaterial
    [key: string]: any
  }

  export class Sprite extends Object3D {
    constructor(material?: Material)
    material: Material
    [key: string]: any
  }

  export class Group extends Object3D {
    constructor()
    [key: string]: any
  }

  export class Scene extends Object3D {
    constructor()
    background?: Color | Texture | null
    fog?: any
    [key: string]: any
  }

  export class Camera extends Object3D {
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
    toneMapping: number
    toneMappingExposure: number
    [key: string]: any
  }

  export class SphereGeometry extends BufferGeometry {
    constructor(radius?: number, widthSegments?: number, heightSegments?: number)
    [key: string]: any
  }

  export class RingGeometry extends BufferGeometry {
    constructor(innerRadius?: number, outerRadius?: number, thetaSegments?: number)
    [key: string]: any
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, widthSegments?: number, heightSegments?: number)
    [key: string]: any
  }

  export class CircleGeometry extends BufferGeometry {
    constructor(radius?: number, segments?: number)
    [key: string]: any
  }

  export class CylinderGeometry extends BufferGeometry {
    constructor(radiusTop?: number, radiusBottom?: number, height?: number, radialSegments?: number)
    [key: string]: any
  }

  export class TubeGeometry extends BufferGeometry {
    constructor(path?: any, tubularSegments?: number, radius?: number, radialSegments?: number, closed?: boolean)
    [key: string]: any
  }

  export class TextureLoader {
    load(url: string, onLoad?: (texture: Texture) => void, onProgress?: any, onError?: (err: any) => void): Texture
    [key: string]: any
  }

  export class Texture {
    needsUpdate: boolean
    [key: string]: any
  }

  export class CanvasTexture extends Texture {
    constructor(canvas: HTMLCanvasElement)
  }

  export class Light extends Object3D {
    [key: string]: any
  }

  export class AmbientLight extends Light {
    constructor(color?: number | string, intensity?: number)
    [key: string]: any
  }

  export class DirectionalLight extends Light {
    constructor(color?: number | string, intensity?: number)
    [key: string]: any
  }

  export class PointLight extends Light {
    constructor(color?: number | string, intensity?: number, distance?: number, decay?: number)
    [key: string]: any
  }

  export class HemisphereLight extends Light {
    constructor(skyColor?: number | string, groundColor?: number | string, intensity?: number)
    [key: string]: any
  }

  export class QuadraticBezierCurve3 {
    constructor(v0: Vector3, v1: Vector3, v2: Vector3)
    getPoints(divisions?: number): Vector3[]
    getPoint(t: number): Vector3
    [key: string]: any
  }

  export class CubicBezierCurve3 {
    constructor(v0: Vector3, v1: Vector3, v2: Vector3, v3: Vector3)
    getPoints(divisions?: number): Vector3[]
    getPoint(t: number): Vector3
    [key: string]: any
  }

  export class CatmullRomCurve3 {
    constructor(points: Vector3[], closed?: boolean, curveType?: string, tension?: number)
    getPoints(divisions?: number): Vector3[]
    [key: string]: any
  }

  export class Raycaster {
    constructor()
    setFromCamera(coords: Vector2 | { x: number; y: number }, camera: Camera): void
    intersectObjects(objects: any[], recursive?: boolean): any[]
    [key: string]: any
  }

  export class Clock {
    constructor(autoStart?: boolean)
    getElapsedTime(): number
    getDelta(): number
    [key: string]: any
  }

  export const SRGBColorSpace: string
  export const LinearSRGBColorSpace: string
  export const AdditiveBlending: number
  export const NormalBlending: number
  export const BackSide: number
  export const FrontSide: number
  export const DoubleSide: number
  export const ACESFilmicToneMapping: number
  export const NoToneMapping: number

  export namespace MathUtils {
    function degToRad(degrees: number): number
    function radToDeg(radians: number): number
    function lerp(x: number, y: number, t: number): number
    function clamp(value: number, min: number, max: number): number
    function randFloat(low: number, high: number): number
    function randFloatSpread(range: number): number
  }
}

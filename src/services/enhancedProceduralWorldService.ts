/**
 * Enhanced Procedural 3D World Generation Service - Epic R2 PoC
 *
 * Enhancements for V2:
 * - Camera position marking (A/B/C markers)
 * - Lighting preset system (5 presets with real-time switching)
 * - Camera export to JSON format
 * - Improved visual quality
 * - Performance monitoring (FPS tracking)
 *
 * Base service: proceduralWorldService.ts
 */

import { GoogleGenAI } from '@google/genai'
import * as THREE from 'three'
import { getGeminiApiKey } from './apiKeys'

// Camera marker types
export interface CameraMarker {
  id: 'A' | 'B' | 'C'
  label: string
  position: THREE.Vector3
  rotation: THREE.Euler
  fov: number
  focalLength: string
  timestamp: Date
}

// Lighting preset types
export type LightingPreset =
  | 'golden-hour'
  | 'overcast'
  | 'neon-night'
  | 'studio'
  | 'dramatic-low-key'

export interface LightingPresetConfig {
  name: string
  description: string
  sunPosition?: { azimuth: number; elevation: number }
  sunColor?: number
  sunIntensity?: number
  ambientColor?: number
  ambientIntensity?: number
  shadowHardness?: number
  fogColor?: number
  fogDensity?: number
  pointLights?: Array<{
    position: THREE.Vector3
    color: number
    intensity: number
  }>
}

// Enhanced world options
export interface EnhancedWorldOptions {
  prompt: string
  style?: 'realistic' | 'stylized' | 'low-poly' | 'voxel'
  size?: 'small' | 'medium' | 'large'
  complexity?: 'low' | 'medium' | 'high'
  initialLightingPreset?: LightingPreset
  onProgress?: (progress: number, status: string) => void
}

// Enhanced world with camera marking and lighting
export interface EnhancedProceduralWorld {
  id: string
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  cameraMarkers: CameraMarker[]
  activeLightingPreset: LightingPreset
  metadata: {
    prompt: string
    style: string
    generatedAt: Date
    fps: number
  }
}

// Lighting preset configurations
const LIGHTING_PRESETS: Record<LightingPreset, LightingPresetConfig> = {
  'golden-hour': {
    name: 'Golden Hour',
    description: 'Warm sunlight 30min before sunset',
    sunPosition: { azimuth: 270, elevation: 12 },
    sunColor: 0xffa000,
    sunIntensity: 0.8,
    ambientColor: 0xff8800,
    ambientIntensity: 0.3,
    shadowHardness: 0.6,
    fogColor: 0xffcc88,
    fogDensity: 0.002,
  },
  overcast: {
    name: 'Overcast',
    description: 'Cloudy diffused daylight',
    sunPosition: { azimuth: 0, elevation: 60 },
    sunColor: 0xccccee,
    sunIntensity: 0.6,
    ambientColor: 0xb0b0c0,
    ambientIntensity: 0.5,
    shadowHardness: 0.1,
    fogColor: 0xb0b0b0,
    fogDensity: 0.001,
  },
  'neon-night': {
    name: 'Neon Night',
    description: 'Cyberpunk colored artificial lighting',
    ambientColor: 0x001122,
    ambientIntensity: 0.1,
    shadowHardness: 0.9,
    fogColor: 0x002244,
    fogDensity: 0.005,
    pointLights: [
      { position: new THREE.Vector3(5, 3, 0), color: 0x00ffff, intensity: 2 },
      { position: new THREE.Vector3(-5, 3, 0), color: 0xff00ff, intensity: 2 },
      { position: new THREE.Vector3(0, 3, 5), color: 0xffff00, intensity: 1.5 },
    ],
  },
  studio: {
    name: 'Studio',
    description: 'Professional 3-point lighting',
    ambientColor: 0x808080,
    ambientIntensity: 0.2,
    shadowHardness: 0.7,
    fogDensity: 0,
  },
  'dramatic-low-key': {
    name: 'Dramatic Low-Key',
    description: 'Film noir high contrast',
    sunPosition: { azimuth: 90, elevation: 30 },
    sunColor: 0xffcc99,
    sunIntensity: 1.0,
    ambientColor: 0x000000,
    ambientIntensity: 0.05,
    shadowHardness: 1.0,
    fogColor: 0x000000,
    fogDensity: 0.003,
  },
}

class EnhancedProceduralWorldService {
  private worlds: Map<string, EnhancedProceduralWorld> = new Map()

  /**
   * Generate enhanced world with camera marking and lighting capabilities
   */
  async generateEnhancedWorld(options: EnhancedWorldOptions): Promise<EnhancedProceduralWorld> {
    const {
      prompt,
      style = 'stylized',
      size = 'medium',
      complexity = 'medium',
      initialLightingPreset = 'golden-hour',
      onProgress,
    } = options
    const worldId = `enhanced_world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // Step 1: Generate world structure using Gemini
      onProgress?.(10, 'Analyzing world description with Gemini AI...')
      const worldStructure = await this.generateWorldStructure(prompt, style, size, complexity)

      // Step 2: Create Three.js scene
      onProgress?.(30, 'Building 3D scene...')
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      )
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap

      // Step 3: Generate terrain
      onProgress?.(45, 'Generating procedural terrain...')
      this.generateTerrain(scene, worldStructure.terrain)

      // Step 4: Add buildings
      onProgress?.(60, 'Creating buildings...')
      worldStructure.buildings.forEach((building) => {
        this.generateBuilding(scene, building)
      })

      // Step 5: Add props
      onProgress?.(75, 'Populating environment with props...')
      worldStructure.props.forEach((prop) => {
        this.generateProp(scene, prop)
      })

      // Step 6: Apply initial lighting preset
      onProgress?.(85, 'Applying lighting preset...')
      this.applyLightingPreset(scene, initialLightingPreset)

      // Step 7: Create skybox
      onProgress?.(95, 'Creating skybox...')
      this.createSkybox(scene, worldStructure.skybox)

      // Step 8: Position camera
      camera.position.set(0, 10, 30)
      camera.lookAt(0, 0, 0)

      onProgress?.(100, 'Enhanced world generation complete!')

      const world: EnhancedProceduralWorld = {
        id: worldId,
        scene,
        camera,
        renderer,
        cameraMarkers: [],
        activeLightingPreset: initialLightingPreset,
        metadata: {
          prompt,
          style,
          generatedAt: new Date(),
          fps: 60,
        },
      }

      this.worlds.set(worldId, world)
      return world
    } catch (error) {
      console.error('Enhanced world generation error:', error)
      throw new Error(
        `Failed to generate enhanced world: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Add camera position marker
   */
  addCameraMarker(
    worldId: string,
    markerId: 'A' | 'B' | 'C',
    label: string,
    position?: THREE.Vector3,
    rotation?: THREE.Euler
  ): CameraMarker | null {
    const world = this.worlds.get(worldId)
    if (!world) return null

    const camera = world.camera
    const marker: CameraMarker = {
      id: markerId,
      label,
      position: position ? position.clone() : camera.position.clone(),
      rotation: rotation ? rotation.clone() : camera.rotation.clone(),
      fov: camera.fov,
      focalLength: this.computeFocalLength(camera.fov),
      timestamp: new Date(),
    }

    // Remove existing marker with same ID
    world.cameraMarkers = world.cameraMarkers.filter((m) => m.id !== markerId)
    world.cameraMarkers.push(marker)

    // Create visual representation
    this.createMarkerVisual(world.scene, marker)

    return marker
  }

  /**
   * Create visual marker in 3D space
   */
  private createMarkerVisual(scene: THREE.Scene, marker: CameraMarker): void {
    // Remove existing marker visual
    const existingMarker = scene.getObjectByName(`marker_${marker.id}`)
    if (existingMarker) {
      scene.remove(existingMarker)
    }

    // Color coding: A=Red, B=Green, C=Blue
    const colors = { A: 0xff0000, B: 0x00ff00, C: 0x0000ff }
    const color = colors[marker.id]

    // Create sphere marker
    const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16)
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.7,
    })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.copy(marker.position)
    sphere.name = `marker_${marker.id}`
    scene.add(sphere)

    // Add wireframe outline
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(sphereGeometry),
      new THREE.LineBasicMaterial({ color, linewidth: 2 })
    )
    wireframe.position.copy(marker.position)
    sphere.add(wireframe)

    // Add camera icon (simplified cone pointing in view direction)
    const coneGeometry = new THREE.ConeGeometry(0.3, 0.8, 8)
    const coneMaterial = new THREE.MeshBasicMaterial({ color })
    const cone = new THREE.Mesh(coneGeometry, coneMaterial)
    cone.rotation.copy(marker.rotation)
    cone.position.copy(marker.position)
    cone.position.y += 1.2
    cone.name = `marker_icon_${marker.id}`
    scene.add(cone)
  }

  /**
   * Remove camera marker
   */
  removeCameraMarker(worldId: string, markerId: 'A' | 'B' | 'C'): boolean {
    const world = this.worlds.get(worldId)
    if (!world) return false

    // Remove from array
    const initialLength = world.cameraMarkers.length
    world.cameraMarkers = world.cameraMarkers.filter((m) => m.id !== markerId)

    // Remove visual
    const marker = world.scene.getObjectByName(`marker_${markerId}`)
    const icon = world.scene.getObjectByName(`marker_icon_${markerId}`)
    if (marker) world.scene.remove(marker)
    if (icon) world.scene.remove(icon)

    return world.cameraMarkers.length < initialLength
  }

  /**
   * Switch lighting preset with real-time update
   */
  switchLightingPreset(worldId: string, preset: LightingPreset): boolean {
    const world = this.worlds.get(worldId)
    if (!world) return false

    const startTime = Date.now()
    this.applyLightingPreset(world.scene, preset)
    world.activeLightingPreset = preset
    const duration = Date.now() - startTime

    console.log(`Lighting preset '${preset}' applied in ${duration}ms`)
    return duration < 2000 // Verify <2s requirement
  }

  /**
   * Apply lighting preset to scene
   */
  private applyLightingPreset(scene: THREE.Scene, preset: LightingPreset): void {
    const config = LIGHTING_PRESETS[preset]

    // Remove existing lights
    scene.children
      .filter((obj) => obj instanceof THREE.Light)
      .forEach((light) => {
        scene.remove(light)
      })

    // Add directional light (sun) if specified
    if (config.sunPosition) {
      const directionalLight = new THREE.DirectionalLight(config.sunColor, config.sunIntensity)
      const phi = THREE.MathUtils.degToRad(90 - config.sunPosition.elevation)
      const theta = THREE.MathUtils.degToRad(config.sunPosition.azimuth)
      directionalLight.position.setFromSphericalCoords(100, phi, theta)
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 2048
      directionalLight.shadow.mapSize.height = 2048
      directionalLight.shadow.camera.near = 0.5
      directionalLight.shadow.camera.far = 500
      directionalLight.shadow.camera.left = -50
      directionalLight.shadow.camera.right = 50
      directionalLight.shadow.camera.top = 50
      directionalLight.shadow.camera.bottom = -50
      directionalLight.shadow.radius = config.shadowHardness! * 5
      directionalLight.name = 'directionalLight'
      scene.add(directionalLight)
    }

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(config.ambientColor, config.ambientIntensity)
    ambientLight.name = 'ambientLight'
    scene.add(ambientLight)

    // Add hemisphere light for better ambient
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.4)
    hemisphereLight.name = 'hemisphereLight'
    scene.add(hemisphereLight)

    // Add point lights (for neon-night preset)
    if (config.pointLights) {
      config.pointLights.forEach((light, index) => {
        const pointLight = new THREE.PointLight(light.color, light.intensity, 50)
        pointLight.position.copy(light.position)
        pointLight.name = `pointLight_${index}`
        scene.add(pointLight)
      })
    }

    // Update fog
    if (config.fogDensity && config.fogDensity > 0) {
      scene.fog = new THREE.Fog(config.fogColor!, 20, 200)
    } else {
      scene.fog = null
    }

    // For studio preset, add 3-point lighting setup
    if (preset === 'studio') {
      // Key light
      const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)
      keyLight.position.set(5, 4, 3)
      keyLight.castShadow = true
      keyLight.name = 'keyLight'
      scene.add(keyLight)

      // Fill light
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
      fillLight.position.set(-3, 3, 3)
      fillLight.name = 'fillLight'
      scene.add(fillLight)

      // Rim light
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.6)
      rimLight.position.set(0, 4, -5)
      rimLight.name = 'rimLight'
      scene.add(rimLight)
    }
  }

  /**
   * Export camera markers to JSON
   */
  exportCameraData(worldId: string): string | null {
    const world = this.worlds.get(worldId)
    if (!world) return null

    const exportData = {
      locationId: worldId,
      locationName: world.metadata.prompt,
      cameraPositions: world.cameraMarkers.map((marker) => ({
        id: marker.id,
        label: marker.label,
        position: {
          x: Number(marker.position.x.toFixed(3)),
          y: Number(marker.position.y.toFixed(3)),
          z: Number(marker.position.z.toFixed(3)),
        },
        rotation: {
          x: Number(THREE.MathUtils.radToDeg(marker.rotation.x).toFixed(2)),
          y: Number(THREE.MathUtils.radToDeg(marker.rotation.y).toFixed(2)),
          z: Number(THREE.MathUtils.radToDeg(marker.rotation.z).toFixed(2)),
        },
        fov: marker.fov,
        focalLength: marker.focalLength,
      })),
      lightingPreset: world.activeLightingPreset,
      metadata: {
        createdAt: world.metadata.generatedAt.toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0',
      },
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Get available lighting presets
   */
  getLightingPresets(): Array<{ id: LightingPreset; name: string; description: string }> {
    return Object.entries(LIGHTING_PRESETS).map(([id, config]) => ({
      id: id as LightingPreset,
      name: config.name,
      description: config.description,
    }))
  }

  /**
   * Attach world to DOM container with enhanced controls
   */
  attachToContainer(worldId: string, container: HTMLElement): void {
    const world = this.worlds.get(worldId)
    if (!world) throw new Error('World not found')

    const { scene, camera, renderer } = world

    // Setup renderer
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Add WASD + Mouse controls
    this.addEnhancedControls(worldId, camera, renderer.domElement)

    // Animation loop with FPS tracking
    let lastTime = Date.now()
    let frameCount = 0
    const animate = () => {
      requestAnimationFrame(animate)

      // Update FPS
      frameCount++
      const currentTime = Date.now()
      if (currentTime - lastTime >= 1000) {
        world.metadata.fps = frameCount
        frameCount = 0
        lastTime = currentTime
      }

      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)
  }

  /**
   * Enhanced camera controls with WASD + Mouse
   */
  private addEnhancedControls(
    worldId: string,
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement
  ): void {
    const keys = { w: false, a: false, s: false, d: false, q: false, e: false }
    const moveSpeed = 0.5
    const rotateSpeed = 0.002

    let yaw = 0
    let pitch = 0

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase()
      if (key in keys) keys[key as keyof typeof keys] = true

      // Hotkeys for camera markers
      if (e.key === '1') this.addCameraMarker(worldId, 'A', 'Camera Position A')
      if (e.key === '2') this.addCameraMarker(worldId, 'B', 'Camera Position B')
      if (e.key === '3') this.addCameraMarker(worldId, 'C', 'Camera Position C')
    })

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase()
      if (key in keys) keys[key as keyof typeof keys] = false
    })

    // Mouse controls
    domElement.addEventListener('mousemove', (e) => {
      if (e.buttons === 1) {
        yaw -= e.movementX * rotateSpeed
        pitch -= e.movementY * rotateSpeed
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch))
      }
    })

    // Update loop
    const updateControls = () => {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)

      if (keys.w) camera.position.addScaledVector(forward, moveSpeed)
      if (keys.s) camera.position.addScaledVector(forward, -moveSpeed)
      if (keys.a) camera.position.addScaledVector(right, -moveSpeed)
      if (keys.d) camera.position.addScaledVector(right, moveSpeed)
      if (keys.q) camera.position.y -= moveSpeed
      if (keys.e) camera.position.y += moveSpeed

      camera.rotation.set(pitch, yaw, 0, 'YXZ')

      requestAnimationFrame(updateControls)
    }
    updateControls()
  }

  /**
   * Get current FPS for performance monitoring
   */
  getFPS(worldId: string): number {
    const world = this.worlds.get(worldId)
    return world?.metadata.fps || 0
  }

  // Reuse existing methods from proceduralWorldService.ts
  private async generateWorldStructure(
    prompt: string,
    style: string,
    size: string,
    complexity: string
  ): Promise<any> {
    const apiKey = getGeminiApiKey()
    if (!apiKey) throw new Error('Gemini API key not found')

    const genAI = new GoogleGenAI({ apiKey })
    const systemPrompt = `You are a 3D world architect AI. Generate a detailed JSON structure for a 3D environment based on the user's description.

User prompt: "${prompt}"
Style: ${style}
Size: ${size}
Complexity: ${complexity}

Generate a JSON object with this exact structure:
{
  "terrain": {
    "type": "hills" | "mountains" | "flat" | "valley" | "canyon",
    "size": {"width": 100, "depth": 100},
    "heightVariation": 0-20,
    "texture": "grass" | "sand" | "stone" | "snow" | "custom",
    "customColors": ["#color1", "#color2", "#color3"]
  },
  "buildings": [
    {
      "type": "house" | "tower" | "castle" | "modern" | "industrial",
      "position": {"x": 0, "y": 0, "z": 0},
      "scale": {"x": 1, "y": 1, "z": 1},
      "color": "#hexcolor",
      "style": "detailed" | "simple" | "abstract"
    }
  ],
  "props": [
    {
      "type": "tree" | "rock" | "fence" | "path" | "water",
      "position": {"x": 0, "y": 0, "z": 0},
      "scale": 1.0,
      "rotation": 0
    }
  ],
  "lighting": {
    "timeOfDay": "dawn" | "day" | "dusk" | "night",
    "sunPosition": {"x": 10, "y": 20, "z": -15},
    "sunIntensity": 0.5-2.0,
    "ambientColor": "#hexcolor",
    "ambientIntensity": 0.2-1.0,
    "shadows": true | false
  },
  "atmosphere": {
    "fogEnabled": true | false,
    "fogColor": "#hexcolor",
    "fogDensity": 0.001-0.1
  },
  "skybox": {
    "type": "gradient" | "stars" | "clouds",
    "colors": ["#color1", "#color2", "#color3"]
  }
}

Be creative and match the user's vision. IMPORTANT: Return ONLY the JSON object, no other text.`

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: systemPrompt,
    })

    const jsonText = result.text.replace(/```json|```/g, '').trim()
    return JSON.parse(jsonText)
  }

  private generateTerrain(scene: THREE.Scene, spec: any): void {
    const { size, heightVariation, texture, customColors } = spec
    const geometry = new THREE.PlaneGeometry(size.width, size.depth, 50, 50)

    const vertices = geometry.attributes.position.array as Float32Array
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i]
      const z = vertices[i + 2]
      const noise = this.simpleNoise(x * 0.05, z * 0.05)
      vertices[i + 1] = noise * heightVariation
    }
    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()

    let material: THREE.Material
    if (customColors && customColors.length > 0) {
      material = new THREE.MeshStandardMaterial({
        color: customColors[0],
        roughness: 0.8,
        metalness: 0.2,
      })
    } else {
      const textureColors = {
        grass: '#3a7d44',
        sand: '#c2b280',
        stone: '#6b7280',
        snow: '#f0f0f0',
      }
      material = new THREE.MeshStandardMaterial({
        color: textureColors[texture as keyof typeof textureColors] || textureColors.grass,
        roughness: 0.85,
        metalness: 0.1,
      })
    }

    const terrain = new THREE.Mesh(geometry, material)
    terrain.rotation.x = -Math.PI / 2
    terrain.receiveShadow = true
    scene.add(terrain)
  }

  private generateBuilding(scene: THREE.Scene, spec: any): void {
    const { type, position, scale, color } = spec
    let geometry: THREE.BufferGeometry

    switch (type) {
      case 'tower':
        geometry = new THREE.CylinderGeometry(scale.x, scale.x * 1.2, scale.y, 8)
        break
      default:
        geometry = new THREE.BoxGeometry(scale.x, scale.y, scale.z)
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: type === 'modern' ? 0.3 : 0.1,
    })

    const building = new THREE.Mesh(geometry, material)
    building.position.set(position.x, position.y + scale.y / 2, position.z)
    building.castShadow = true
    building.receiveShadow = true
    scene.add(building)
  }

  private generateProp(scene: THREE.Scene, spec: any): void {
    const { type, position, scale, rotation } = spec
    if (type === 'tree') this.generateTree(scene, position, scale, rotation)
    else if (type === 'rock') this.generateRock(scene, position, scale, rotation)
  }

  private generateTree(scene: THREE.Scene, position: any, scale: number, rotation: number): void {
    const trunkGeometry = new THREE.CylinderGeometry(0.3 * scale, 0.4 * scale, 3 * scale, 8)
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#6b4423' })
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
    trunk.position.set(position.x, position.y + 1.5 * scale, position.z)
    trunk.rotation.y = rotation
    trunk.castShadow = true
    scene.add(trunk)

    const foliageGeometry = new THREE.SphereGeometry(1.5 * scale, 8, 8)
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: '#2d5016' })
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial)
    foliage.position.set(position.x, position.y + 3.5 * scale, position.z)
    foliage.castShadow = true
    scene.add(foliage)
  }

  private generateRock(scene: THREE.Scene, position: any, scale: number, rotation: number): void {
    const geometry = new THREE.DodecahedronGeometry(scale)
    const material = new THREE.MeshStandardMaterial({
      color: '#808080',
      roughness: 0.9,
      metalness: 0.1,
    })
    const rock = new THREE.Mesh(geometry, material)
    rock.position.set(position.x, position.y + scale / 2, position.z)
    rock.rotation.set(Math.random(), rotation, Math.random())
    rock.castShadow = true
    rock.receiveShadow = true
    scene.add(rock)
  }

  private createSkybox(scene: THREE.Scene, spec: any): void {
    // Defensive check: ensure colors exists with default fallback
    const { type, colors = ['#87CEEB', '#E0F6FF', '#FFFFFF'] } = spec

    // Additional safety: ensure colors is an array with at least one element
    const safeColors =
      Array.isArray(colors) && colors.length > 0 ? colors : ['#87CEEB', '#E0F6FF', '#FFFFFF']

    if (type === 'gradient') {
      const skyGeo = new THREE.SphereGeometry(500, 32, 32)
      const skyMat = new THREE.ShaderMaterial({
        uniforms: {
          topColor: { value: new THREE.Color(safeColors[0]) },
          bottomColor: { value: new THREE.Color(safeColors[1] || safeColors[0]) },
          offset: { value: 33 },
          exponent: { value: 0.6 },
        },
        vertexShader: `
                    varying vec3 vWorldPosition;
                    void main() {
                        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                        vWorldPosition = worldPosition.xyz;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
        fragmentShader: `
                    uniform vec3 topColor;
                    uniform vec3 bottomColor;
                    uniform float offset;
                    uniform float exponent;
                    varying vec3 vWorldPosition;
                    void main() {
                        float h = normalize(vWorldPosition + offset).y;
                        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                    }
                `,
        side: THREE.BackSide,
      })
      const sky = new THREE.Mesh(skyGeo, skyMat)
      scene.add(sky)
    } else {
      scene.background = new THREE.Color(safeColors[0])
    }
  }

  private simpleNoise(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return (n - Math.floor(n)) * 2 - 1
  }

  private computeFocalLength(fov: number): string {
    const focalLengthMm = (35 / (2 * Math.tan((fov * Math.PI) / 180 / 2))).toFixed(0)
    return `${focalLengthMm}mm`
  }

  /**
   * Dispose of world and clean up resources
   */
  disposeWorld(worldId: string): void {
    const world = this.worlds.get(worldId)
    if (world) {
      world.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (object.material instanceof THREE.Material) {
            object.material.dispose()
          }
        }
      })
      world.renderer.dispose()
      this.worlds.delete(worldId)
    }
  }

  /**
   * Get world by ID
   */
  getWorld(worldId: string): EnhancedProceduralWorld | undefined {
    return this.worlds.get(worldId)
  }
}

// Export singleton instance
export const enhancedProceduralWorldService = new EnhancedProceduralWorldService()

/**
 * Procedural 3D World Generation Service
 *
 * Cost-effective alternative to Luma AI and Emu3-Gen using:
 * - Gemini API for world structure/layout generation
 * - Three.js for real-time procedural rendering
 * - Client-side processing for fast, mobile-friendly performance
 *
 * This approach generates navigable 3D environments without expensive external APIs.
 */

import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from './apiKeys';
import * as THREE from 'three';

export interface WorldGenerationOptions {
    prompt: string;
    style?: 'realistic' | 'stylized' | 'low-poly' | 'voxel';
    size?: 'small' | 'medium' | 'large';
    complexity?: 'low' | 'medium' | 'high';
    onProgress?: (progress: number, status: string) => void;
}

export interface ProceduralWorld {
    id: string;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    metadata: {
        prompt: string;
        style: string;
        structure: WorldStructure;
        generatedAt: Date;
    };
}

interface WorldStructure {
    terrain: TerrainSpec;
    buildings: BuildingSpec[];
    props: PropSpec[];
    lighting: LightingSpec;
    atmosphere: AtmosphereSpec;
    skybox: SkyboxSpec;
}

interface TerrainSpec {
    type: 'flat' | 'hills' | 'mountains' | 'valley' | 'canyon';
    size: { width: number; depth: number };
    heightVariation: number;
    texture: 'grass' | 'sand' | 'stone' | 'snow' | 'custom';
    customColors?: string[];
}

interface BuildingSpec {
    type: 'house' | 'tower' | 'castle' | 'modern' | 'industrial';
    position: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
    color: string;
    style: 'detailed' | 'simple' | 'abstract';
}

interface PropSpec {
    type: 'tree' | 'rock' | 'fence' | 'path' | 'water';
    position: { x: number; y: number; z: number };
    scale: number;
    rotation: number;
}

interface LightingSpec {
    timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
    sunPosition: { x: number; y: number; z: number };
    sunIntensity: number;
    ambientColor: string;
    ambientIntensity: number;
    shadows: boolean;
}

interface AtmosphereSpec {
    fogEnabled: boolean;
    fogColor: string;
    fogDensity: number;
}

interface SkyboxSpec {
    type: 'gradient' | 'stars' | 'clouds';
    colors: string[];
}

class ProceduralWorldService {
    private worlds: Map<string, ProceduralWorld> = new Map();

    /**
     * Generate a navigable 3D world from a text prompt
     */
    async generateWorld(options: WorldGenerationOptions): Promise<ProceduralWorld> {
        const { prompt, style = 'stylized', size = 'medium', complexity = 'medium', onProgress } = options;
        const worldId = `world_${Date.now()}`;

        try {
            // Step 1: Use Gemini to generate world structure (fast, cheap)
            onProgress?.(10, 'Analyzing world description with AI...');
            const worldStructure = await this.generateWorldStructure(prompt, style, size, complexity);

            // Step 2: Create Three.js scene (client-side, instant)
            onProgress?.(30, 'Building 3D scene...');
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });

            // Step 3: Generate terrain (procedural, fast)
            onProgress?.(45, 'Generating terrain...');
            this.generateTerrain(scene, worldStructure.terrain);

            // Step 4: Add buildings (procedural geometry)
            onProgress?.(60, 'Creating buildings...');
            worldStructure.buildings.forEach(building => {
                this.generateBuilding(scene, building);
            });

            // Step 5: Add props (trees, rocks, etc.)
            onProgress?.(75, 'Populating environment...');
            worldStructure.props.forEach(prop => {
                this.generateProp(scene, prop);
            });

            // Step 6: Setup lighting and atmosphere
            onProgress?.(85, 'Setting up lighting...');
            this.setupLighting(scene, worldStructure.lighting);
            this.setupAtmosphere(scene, worldStructure.atmosphere);

            // Step 7: Create skybox
            onProgress?.(95, 'Creating skybox...');
            this.createSkybox(scene, worldStructure.skybox);

            // Step 8: Position camera
            camera.position.set(0, 10, 30);
            camera.lookAt(0, 0, 0);

            onProgress?.(100, 'World generation complete!');

            const world: ProceduralWorld = {
                id: worldId,
                scene,
                camera,
                renderer,
                metadata: {
                    prompt,
                    style,
                    structure: worldStructure,
                    generatedAt: new Date()
                }
            };

            this.worlds.set(worldId, world);
            return world;

        } catch (error) {
            console.error('Procedural world generation error:', error);
            throw new Error(`Failed to generate world: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Use Gemini to generate structured world parameters
     */
    private async generateWorldStructure(
        prompt: string,
        style: string,
        size: string,
        complexity: string
    ): Promise<WorldStructure> {
        const apiKey = getGeminiApiKey();
        if (!apiKey) {
            throw new Error('Gemini API key not found');
        }

        const genAI = new GoogleGenAI({ apiKey });

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

Be creative and match the user's vision. For a "${prompt}", create an immersive 3D world structure.
IMPORTANT: Return ONLY the JSON object, no other text.`;

        const result = await genAI.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: systemPrompt
        });

        const jsonText = result.text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        return JSON.parse(jsonText);
    }

    /**
     * Generate procedural terrain using noise functions
     */
    private generateTerrain(scene: THREE.Scene, spec: TerrainSpec): void {
        const { size, heightVariation, texture, customColors } = spec;
        const geometry = new THREE.PlaneGeometry(size.width, size.depth, 50, 50);

        // Apply procedural height variation using Perlin-like noise
        const vertices = geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            const noise = this.simpleNoise(x * 0.05, z * 0.05);
            vertices[i + 1] = noise * heightVariation;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();

        // Create material with appropriate texture/color
        let material: THREE.Material;
        if (customColors && customColors.length > 0) {
            material = new THREE.MeshStandardMaterial({
                color: customColors[0],
                roughness: 0.8,
                metalness: 0.2
            });
        } else {
            const textureColors = {
                grass: '#3a7d44',
                sand: '#c2b280',
                stone: '#6b7280',
                snow: '#f0f0f0'
            };
            material = new THREE.MeshStandardMaterial({
                color: textureColors[texture] || textureColors.grass,
                roughness: 0.85,
                metalness: 0.1
            });
        }

        const terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;
        scene.add(terrain);
    }

    /**
     * Generate procedural buildings
     */
    private generateBuilding(scene: THREE.Scene, spec: BuildingSpec): void {
        const { type, position, scale, color, style } = spec;
        let geometry: THREE.BufferGeometry;

        switch (type) {
            case 'tower':
                geometry = new THREE.CylinderGeometry(scale.x, scale.x * 1.2, scale.y, 8);
                break;
            case 'castle':
                geometry = new THREE.BoxGeometry(scale.x, scale.y, scale.z);
                break;
            case 'modern':
                geometry = new THREE.BoxGeometry(scale.x, scale.y, scale.z);
                break;
            default:
                geometry = new THREE.BoxGeometry(scale.x, scale.y, scale.z);
        }

        const material = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.7,
            metalness: type === 'modern' ? 0.3 : 0.1
        });

        const building = new THREE.Mesh(geometry, material);
        building.position.set(position.x, position.y + scale.y / 2, position.z);
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);

        // Add roof for houses
        if (type === 'house') {
            const roofGeometry = new THREE.ConeGeometry(scale.x * 0.8, scale.y * 0.3, 4);
            const roofMaterial = new THREE.MeshStandardMaterial({ color: '#8b4513' });
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(position.x, position.y + scale.y + scale.y * 0.15, position.z);
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            scene.add(roof);
        }
    }

    /**
     * Generate environmental props (trees, rocks, etc.)
     */
    private generateProp(scene: THREE.Scene, spec: PropSpec): void {
        const { type, position, scale, rotation } = spec;

        switch (type) {
            case 'tree':
                this.generateTree(scene, position, scale, rotation);
                break;
            case 'rock':
                this.generateRock(scene, position, scale, rotation);
                break;
            case 'water':
                this.generateWater(scene, position, scale);
                break;
            default:
                break;
        }
    }

    /**
     * Generate a simple procedural tree
     */
    private generateTree(scene: THREE.Scene, position: { x: number; y: number; z: number }, scale: number, rotation: number): void {
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.3 * scale, 0.4 * scale, 3 * scale, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#6b4423' });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(position.x, position.y + 1.5 * scale, position.z);
        trunk.rotation.y = rotation;
        trunk.castShadow = true;
        scene.add(trunk);

        // Foliage
        const foliageGeometry = new THREE.SphereGeometry(1.5 * scale, 8, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({ color: '#2d5016' });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.set(position.x, position.y + 3.5 * scale, position.z);
        foliage.castShadow = true;
        scene.add(foliage);
    }

    /**
     * Generate a procedural rock
     */
    private generateRock(scene: THREE.Scene, position: { x: number; y: number; z: number }, scale: number, rotation: number): void {
        const geometry = new THREE.DodecahedronGeometry(scale);
        const material = new THREE.MeshStandardMaterial({
            color: '#808080',
            roughness: 0.9,
            metalness: 0.1
        });
        const rock = new THREE.Mesh(geometry, material);
        rock.position.set(position.x, position.y + scale / 2, position.z);
        rock.rotation.set(Math.random(), rotation, Math.random());
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
    }

    /**
     * Generate water plane
     */
    private generateWater(scene: THREE.Scene, position: { x: number; y: number; z: number }, scale: number): void {
        const geometry = new THREE.PlaneGeometry(scale * 10, scale * 10);
        const material = new THREE.MeshStandardMaterial({
            color: '#1e90ff',
            roughness: 0.2,
            metalness: 0.6,
            transparent: true,
            opacity: 0.7
        });
        const water = new THREE.Mesh(geometry, material);
        water.rotation.x = -Math.PI / 2;
        water.position.set(position.x, position.y, position.z);
        water.receiveShadow = true;
        scene.add(water);
    }

    /**
     * Setup scene lighting
     */
    private setupLighting(scene: THREE.Scene, spec: LightingSpec): void {
        const { sunPosition, sunIntensity, ambientColor, ambientIntensity, shadows } = spec;

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, sunIntensity);
        directionalLight.position.set(sunPosition.x, sunPosition.y, sunPosition.z);
        if (shadows) {
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 500;
            directionalLight.shadow.camera.left = -50;
            directionalLight.shadow.camera.right = 50;
            directionalLight.shadow.camera.top = 50;
            directionalLight.shadow.camera.bottom = -50;
        }
        scene.add(directionalLight);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
        scene.add(ambientLight);

        // Hemisphere light for better ambient lighting
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.4);
        scene.add(hemisphereLight);
    }

    /**
     * Setup atmospheric effects
     */
    private setupAtmosphere(scene: THREE.Scene, spec: AtmosphereSpec): void {
        if (spec.fogEnabled) {
            scene.fog = new THREE.Fog(spec.fogColor, 20, 200);
        }
    }

    /**
     * Create procedural skybox
     */
    private createSkybox(scene: THREE.Scene, spec: SkyboxSpec): void {
        const { type, colors } = spec;

        if (type === 'gradient') {
            // Create gradient skybox using shader material
            const skyGeo = new THREE.SphereGeometry(500, 32, 32);
            const skyMat = new THREE.ShaderMaterial({
                uniforms: {
                    topColor: { value: new THREE.Color(colors[0]) },
                    bottomColor: { value: new THREE.Color(colors[1]) },
                    offset: { value: 33 },
                    exponent: { value: 0.6 }
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
                side: THREE.BackSide
            });
            const sky = new THREE.Mesh(skyGeo, skyMat);
            scene.add(sky);
        } else {
            // Simple colored background
            scene.background = new THREE.Color(colors[0]);
        }
    }

    /**
     * Simple noise function for terrain variation
     */
    private simpleNoise(x: number, y: number): number {
        // Simple pseudo-random noise function
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }

    /**
     * Attach world to DOM container and start rendering
     */
    attachToContainer(worldId: string, container: HTMLElement, enableControls: boolean = true): void {
        const world = this.worlds.get(worldId);
        if (!world) {
            throw new Error('World not found');
        }

        const { scene, camera, renderer } = world;

        // Setup renderer
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for mobile performance
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // Add camera controls if requested
        if (enableControls) {
            this.addCameraControls(camera, renderer.domElement);
        }

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        // Handle window resize
        const handleResize = () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener('resize', handleResize);
    }

    /**
     * Add simple camera controls (WASD + Mouse)
     */
    private addCameraControls(camera: THREE.PerspectiveCamera, domElement: HTMLElement): void {
        const keys = { w: false, a: false, s: false, d: false, q: false, e: false };
        const moveSpeed = 0.5;
        const rotateSpeed = 0.002;

        let yaw = 0;
        let pitch = 0;

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key in keys) keys[key as keyof typeof keys] = true;
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key in keys) keys[key as keyof typeof keys] = false;
        });

        // Mouse controls
        domElement.addEventListener('mousemove', (e) => {
            if (e.buttons === 1) { // Left mouse button
                yaw -= e.movementX * rotateSpeed;
                pitch -= e.movementY * rotateSpeed;
                pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
            }
        });

        // Update loop
        const updateControls = () => {
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

            if (keys.w) camera.position.addScaledVector(forward, moveSpeed);
            if (keys.s) camera.position.addScaledVector(forward, -moveSpeed);
            if (keys.a) camera.position.addScaledVector(right, -moveSpeed);
            if (keys.d) camera.position.addScaledVector(right, moveSpeed);
            if (keys.q) camera.position.y -= moveSpeed;
            if (keys.e) camera.position.y += moveSpeed;

            camera.rotation.set(pitch, yaw, 0, 'YXZ');

            requestAnimationFrame(updateControls);
        };
        updateControls();
    }

    /**
     * Dispose of a world and clean up resources
     */
    disposeWorld(worldId: string): void {
        const world = this.worlds.get(worldId);
        if (world) {
            world.scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    if (object.material instanceof THREE.Material) {
                        object.material.dispose();
                    }
                }
            });
            world.renderer.dispose();
            this.worlds.delete(worldId);
        }
    }

    /**
     * Get world by ID
     */
    getWorld(worldId: string): ProceduralWorld | undefined {
        return this.worlds.get(worldId);
    }

    /**
     * Get all worlds
     */
    getAllWorlds(): ProceduralWorld[] {
        return Array.from(this.worlds.values());
    }
}

// Export singleton instance
export const proceduralWorldService = new ProceduralWorldService();

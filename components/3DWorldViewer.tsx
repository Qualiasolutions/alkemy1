import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { XIcon, RotateCcwIcon, ZoomInIcon, ZoomOutIcon, MoveIcon, EyeIcon } from './icons/Icons';
import type { GeneratedWorld } from '../services/emuWorldService';

interface ThreeDWorldViewerProps {
    isOpen: boolean;
    onClose: () => void;
    prompt?: string;
    generatedModelUrl?: string | null;
    generatedWorld?: GeneratedWorld | null; // Full world data with all views
    onGenerate?: (prompt: string) => Promise<void>;
}

const ThreeDWorldViewer: React.FC<ThreeDWorldViewerProps> = ({
    isOpen,
    onClose,
    prompt: initialPrompt = '',
    generatedModelUrl,
    generatedWorld,
    onGenerate
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const rendererRef = useRef<any>(null);
    const controlsRef = useRef<any>(null);
    const animationFrameRef = useRef<number>();
    const skyboxRef = useRef<any>(null);

    const [prompt, setPrompt] = useState(initialPrompt);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading3D, setIsLoading3D] = useState(false);
    const [progress, setProgress] = useState<string>('');

    // Initialize Three.js scene
    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;

        const initThreeJS = async () => {
            // Dynamically import Three.js to avoid SSR issues
            const THREE = await import('three');
            const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

            const canvas = canvasRef.current;
            if (!canvas) return;

            // Scene setup
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0a0a0a);
            sceneRef.current = scene;

            // Camera setup
            const camera = new THREE.PerspectiveCamera(
                75,
                canvas.clientWidth / canvas.clientHeight,
                0.1,
                1000
            );
            camera.position.set(0, 0, 0.1);
            cameraRef.current = camera;

            // Renderer setup
            const renderer = new THREE.WebGLRenderer({
                canvas,
                antialias: true,
                alpha: false,
            });
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.0;
            rendererRef.current = renderer;

            // Orbit controls - for looking around
            const controls = new OrbitControls(camera, canvas);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.enableZoom = true;
            controls.enablePan = false; // Disable panning, we're inside a skybox
            controls.rotateSpeed = -0.5; // Invert rotation for intuitive inside-view
            controlsRef.current = controls;

            // Lighting setup (minimal, skybox provides illumination)
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
            scene.add(ambientLight);

            // Load skybox if world data is provided
            if (generatedWorld && generatedWorld.views.length > 0) {
                setIsLoading3D(true);
                setProgress('Loading world textures...');
                await loadWorldAsSkybox(THREE, scene, generatedWorld);
                setIsLoading3D(false);
                setProgress('');
            }

            // Animation loop
            const animate = () => {
                animationFrameRef.current = requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };
            animate();

            // Handle resize
            const handleResize = () => {
                if (!canvas) return;
                const width = canvas.clientWidth;
                const height = canvas.clientHeight;
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            };
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                renderer.dispose();
            };
        };

        initThreeJS();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isOpen, generatedWorld]);

    /**
     * Load generated world as cube-map skybox
     */
    const loadWorldAsSkybox = async (THREE: any, scene: any, world: GeneratedWorld) => {
        try {
            // Remove existing skybox if any
            if (skyboxRef.current) {
                scene.remove(skyboxRef.current);
                skyboxRef.current.geometry.dispose();
                skyboxRef.current.material.forEach((mat: any) => mat.dispose());
            }

            // Create cube geometry for skybox (inverted normals to see from inside)
            const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);

            // Map view directions to cube faces
            // Three.js cube map order: [px, nx, py, ny, pz, nz]
            // Our directions: [right, left, up, down, front, back]
            const directionMap: Record<string, number> = {
                'right': 0,  // positive x
                'left': 1,   // negative x
                'up': 2,     // positive y
                'down': 3,   // negative y
                'front': 4,  // positive z
                'back': 5    // negative z
            };

            // Load textures for each face
            const materials: any[] = [];
            const textureLoader = new THREE.TextureLoader();

            // Create materials array in correct order
            for (const direction of ['right', 'left', 'up', 'down', 'front', 'back']) {
                const view = world.views.find(v => v.direction === direction);

                if (view) {
                    setProgress(`Loading ${direction} view...`);
                    const texture = await new Promise<any>((resolve, reject) => {
                        textureLoader.load(
                            view.imageUrl,
                            (tex: any) => {
                                tex.colorSpace = THREE.SRGBColorSpace;
                                resolve(tex);
                            },
                            undefined,
                            (error: any) => {
                                console.error(`Failed to load ${direction} texture:`, error);
                                reject(error);
                            }
                        );
                    });

                    materials.push(new THREE.MeshBasicMaterial({
                        map: texture,
                        side: THREE.BackSide // Render inside of cube
                    }));
                } else {
                    // Fallback material for missing views
                    materials.push(new THREE.MeshBasicMaterial({
                        color: 0x0a0a0a,
                        side: THREE.BackSide
                    }));
                }
            }

            // Create skybox mesh
            const skyboxMesh = new THREE.Mesh(skyboxGeometry, materials);
            scene.add(skyboxMesh);
            skyboxRef.current = skyboxMesh;

            setProgress('World loaded successfully!');
            setTimeout(() => setProgress(''), 2000);

        } catch (error) {
            console.error('Error loading world skybox:', error);
            setError('Failed to load world environment');
            throw error;
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || !onGenerate) return;

        setIsGenerating(true);
        setError(null);
        setProgress('Starting generation...');

        try {
            await onGenerate(prompt);
            setProgress('Generation complete!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate 3D world');
            setProgress('');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReset = useCallback(() => {
        if (controlsRef.current && cameraRef.current) {
            cameraRef.current.position.set(0, 0, 0.1);
            cameraRef.current.rotation.set(0, 0, 0);
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
        }
    }, []);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="relative w-full max-w-7xl h-[90vh] bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-6 bg-gradient-to-b from-zinc-950 to-transparent pointer-events-none">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">3D World Viewer</h2>
                            <p className="text-sm text-zinc-400">Navigable AI-generated environments powered by Emu3-Gen</p>
                        </div>
                        <Button
                            onClick={onClose}
                            variant="secondary"
                            className="!p-2 pointer-events-auto"
                        >
                            <XIcon className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Main Canvas Area */}
                    <div ref={containerRef} className="w-full h-full">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full"
                            style={{ display: 'block' }}
                        />

                        {/* Loading Overlay */}
                        {(isLoading3D || isGenerating) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                                <div className="text-center max-w-md px-6">
                                    <div className="w-16 h-16 border-4 border-t-transparent border-teal-500 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-white font-semibold text-lg mb-2">
                                        {isGenerating ? 'Generating Navigable World...' : 'Loading World...'}
                                    </p>
                                    <p className="text-zinc-400 text-sm mb-3">
                                        {isGenerating
                                            ? 'Creating 6 views for immersive environment (2-3 minutes)'
                                            : 'Preparing 3D scene...'}
                                    </p>
                                    {progress && (
                                        <p className="text-teal-400 text-xs font-mono">{progress}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Error Overlay */}
                        {error && (
                            <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-red-900/90 text-white px-6 py-3 rounded-lg border border-red-700 shadow-2xl">
                                <p className="font-semibold">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* World Info Badge */}
                        {generatedWorld && !isLoading3D && !isGenerating && (
                            <div className="absolute top-24 left-6 bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-700">
                                <p className="text-xs text-zinc-400 mb-1">Generated World</p>
                                <p className="text-sm text-white font-semibold truncate max-w-xs">{generatedWorld.prompt}</p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pointer-events-none">
                        <div className="flex items-center gap-4 pointer-events-auto">
                            {/* Generation Input */}
                            {onGenerate && (
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
                                        placeholder="Describe your world... (e.g., 'futuristic city skyline at sunset')"
                                        className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition-colors"
                                        disabled={isGenerating}
                                    />
                                    <Button
                                        onClick={handleGenerate}
                                        variant="primary"
                                        className="!px-6 !bg-gradient-to-r !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700"
                                        disabled={isGenerating || !prompt.trim()}
                                        isLoading={isGenerating}
                                    >
                                        Generate World
                                    </Button>
                                </div>
                            )}

                            {/* View Controls */}
                            <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
                                <Button
                                    onClick={handleReset}
                                    variant="secondary"
                                    className="!p-2"
                                    title="Reset View"
                                    disabled={isGenerating}
                                >
                                    <RotateCcwIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="mt-4 flex items-center gap-6 text-xs text-zinc-500 pointer-events-none">
                            <span className="flex items-center gap-2">
                                <MoveIcon className="w-3 h-3" />
                                Click + drag to look around
                            </span>
                            <span className="flex items-center gap-2">
                                <ZoomInIcon className="w-3 h-3" />
                                Scroll to zoom
                            </span>
                            <span className="flex items-center gap-2">
                                <EyeIcon className="w-3 h-3" />
                                Explore 360° immersive environment
                            </span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ThreeDWorldViewer;

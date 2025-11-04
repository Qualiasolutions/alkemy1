import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { XIcon, RotateCcwIcon, ZoomInIcon, ZoomOutIcon, MoveIcon, EyeIcon } from './icons/Icons';

interface ThreeDWorldViewerProps {
    isOpen: boolean;
    onClose: () => void;
    prompt?: string;
    generatedModelUrl?: string | null;
    onGenerate?: (prompt: string) => Promise<void>;
}

const ThreeDWorldViewer: React.FC<ThreeDWorldViewerProps> = ({
    isOpen,
    onClose,
    prompt: initialPrompt = '',
    generatedModelUrl,
    onGenerate
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const rendererRef = useRef<any>(null);
    const controlsRef = useRef<any>(null);
    const animationFrameRef = useRef<number>();

    const [prompt, setPrompt] = useState(initialPrompt);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading3D, setIsLoading3D] = useState(false);

    // Initialize Three.js scene
    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;

        const initThreeJS = async () => {
            // Dynamically import Three.js to avoid SSR issues
            const THREE = await import('three');
            const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
            const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

            const canvas = canvasRef.current;
            if (!canvas) return;

            // Scene setup
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0a0a0a);
            scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
            sceneRef.current = scene;

            // Camera setup
            const camera = new THREE.PerspectiveCamera(
                75,
                canvas.clientWidth / canvas.clientHeight,
                0.1,
                1000
            );
            camera.position.set(0, 2, 5);
            cameraRef.current = camera;

            // Renderer setup
            const renderer = new THREE.WebGLRenderer({
                canvas,
                antialias: true,
                alpha: true,
            });
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.0;
            rendererRef.current = renderer;

            // Orbit controls
            const controls = new OrbitControls(camera, canvas);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.minDistance = 1;
            controls.maxDistance = 50;
            controls.maxPolarAngle = Math.PI / 2;
            controlsRef.current = controls;

            // Lighting setup
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 10, 5);
            directionalLight.castShadow = true;
            directionalLight.shadow.camera.near = 0.1;
            directionalLight.shadow.camera.far = 50;
            directionalLight.shadow.camera.left = -10;
            directionalLight.shadow.camera.right = 10;
            directionalLight.shadow.camera.top = 10;
            directionalLight.shadow.camera.bottom = -10;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            scene.add(directionalLight);

            const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362c1c, 0.5);
            scene.add(hemisphereLight);

            // Add ground plane
            const groundGeometry = new THREE.PlaneGeometry(100, 100);
            const groundMaterial = new THREE.MeshStandardMaterial({
                color: 0x1a1a1a,
                roughness: 0.8,
                metalness: 0.2,
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            scene.add(ground);

            // Add grid helper
            const gridHelper = new THREE.GridHelper(100, 100, 0x2a2a2a, 0x1a1a1a);
            scene.add(gridHelper);

            // Load 3D model if provided
            if (generatedModelUrl) {
                setIsLoading3D(true);
                const loader = new GLTFLoader();
                loader.load(
                    generatedModelUrl,
                    (gltf) => {
                        const model = gltf.scene;

                        // Center and scale model
                        const box = new THREE.Box3().setFromObject(model);
                        const center = box.getCenter(new THREE.Vector3());
                        const size = box.getSize(new THREE.Vector3());
                        const maxDim = Math.max(size.x, size.y, size.z);
                        const scale = 5 / maxDim;

                        model.scale.setScalar(scale);
                        model.position.sub(center.multiplyScalar(scale));
                        model.position.y = 0;

                        // Enable shadows
                        model.traverse((child: any) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });

                        scene.add(model);
                        setIsLoading3D(false);
                    },
                    undefined,
                    (error) => {
                        console.error('Error loading 3D model:', error);
                        setError('Failed to load 3D model');
                        setIsLoading3D(false);
                    }
                );
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
    }, [isOpen, generatedModelUrl]);

    const handleGenerate = async () => {
        if (!prompt.trim() || !onGenerate) return;

        setIsGenerating(true);
        setError(null);

        try {
            await onGenerate(prompt);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate 3D world');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReset = useCallback(() => {
        if (controlsRef.current && cameraRef.current) {
            cameraRef.current.position.set(0, 2, 5);
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
                    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-6 bg-gradient-to-b from-zinc-950 to-transparent">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">3D World Viewer</h2>
                            <p className="text-sm text-zinc-400">Professional cinematic environment visualization</p>
                        </div>
                        <Button
                            onClick={onClose}
                            variant="secondary"
                            className="!p-2"
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
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-t-transparent border-teal-500 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-white font-semibold">
                                        {isGenerating ? 'Generating 3D World...' : 'Loading 3D Model...'}
                                    </p>
                                    <p className="text-zinc-400 text-sm mt-2">
                                        {isGenerating ? 'This may take 10-30 seconds' : 'Preparing scene...'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Error Overlay */}
                        {error && (
                            <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-red-900/90 text-white px-6 py-3 rounded-lg border border-red-700">
                                <p className="font-semibold">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 to-transparent">
                        <div className="flex items-center gap-4">
                            {/* Generation Input */}
                            {onGenerate && (
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                                        placeholder="Describe your 3D world... (e.g., 'futuristic city street at night')"
                                        className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500"
                                        disabled={isGenerating}
                                    />
                                    <Button
                                        onClick={handleGenerate}
                                        variant="primary"
                                        className="!px-6"
                                        disabled={isGenerating || !prompt.trim()}
                                        isLoading={isGenerating}
                                    >
                                        Generate 3D World
                                    </Button>
                                </div>
                            )}

                            {/* View Controls */}
                            <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
                                <Button
                                    onClick={handleReset}
                                    variant="secondary"
                                    className="!p-2"
                                    title="Reset Camera"
                                >
                                    <RotateCcwIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="mt-4 flex items-center gap-6 text-xs text-zinc-500">
                            <span className="flex items-center gap-2">
                                <MoveIcon className="w-3 h-3" />
                                Left-click + drag to rotate
                            </span>
                            <span className="flex items-center gap-2">
                                <EyeIcon className="w-3 h-3" />
                                Right-click + drag to pan
                            </span>
                            <span className="flex items-center gap-2">
                                <ZoomInIcon className="w-3 h-3" />
                                Scroll to zoom
                            </span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ThreeDWorldViewer;

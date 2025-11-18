/**
 * Alkemy 3D Generator Tab - Modernized Version
 *
 * Features:
 * - Modern UI with shadcn components
 * - Elegant animations with Framer Motion
 * - Fully accessible with ARIA labels
 * - Responsive design with mobile support
 * - Professional visual design
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hunyuanWorldService, type HunyuanWorldResult, type HunyuanWorldGenerationJob } from '../services/hunyuanWorldService';
import { useTheme } from '../../theme/ThemeContext';
import type { ScriptAnalysis } from '../../types';
import NavigationControls from '../../components/3d/NavigationControls';

// shadcn components
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Progress } from '../../components/ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { cn } from '../../lib/utils';

// Lucide React Icons
import {
    Globe,
    Sparkles,
    Download,
    Trash2,
    Loader2,
    Eye,
    Images,
    Maximize2,
    Zap,
    Clock,
    CheckCircle2,
    AlertCircle,
    Wand2,
    Layers,
    Settings,
    Film,
    RefreshCw
} from 'lucide-react';

interface ThreeDWorldsTabProps {
    scriptAnalysis: ScriptAnalysis | null;
}

export function ThreeDWorldsTab({ scriptAnalysis }: ThreeDWorldsTabProps) {
    const { colors } = useTheme();
    const viewerRef = useRef<HTMLDivElement>(null);

    const [worlds, setWorlds] = useState<HunyuanWorldResult[]>([]);
    const [activeWorld, setActiveWorld] = useState<HunyuanWorldResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [prompt, setPrompt] = useState('');
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [quality, setQuality] = useState<'turbo' | 'fast' | 'standard'>('fast');
    const [resolution, setResolution] = useState<'low' | 'standard' | 'high'>('standard');
    const [format, setFormat] = useState<'glb' | 'obj' | 'ply' | 'stl'>('glb');
    const [showGallery, setShowGallery] = useState(false);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [serviceStatus, setServiceStatus] = useState<{
        available: boolean;
        apiStatus: 'online' | 'offline' | 'error';
        activeJobs: number;
    }>({ available: false, apiStatus: 'offline', activeJobs: 0 });

    // 3D Navigation Controls State
    const [navigationSettings, setNavigationSettings] = useState({
        gridEnabled: false,
        wireframeEnabled: false,
        autoRotateEnabled: false,
        ambientIntensity: 0.6,
        directionalIntensity: 0.4
    });

    // 3D scene references
    const sceneRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const rendererRef = useRef<any>(null);
    const controlsRef = useRef<any>(null);
    const directionalLightRef = useRef<any>(null);
    const animationIdRef = useRef<number | null>(null);

    // Check service status
    useEffect(() => {
        const checkStatus = async () => {
            const status = await hunyuanWorldService.getServiceStatus();
            setServiceStatus(status);
        };
        checkStatus();
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    // Cancel generation
    const handleCancelGeneration = () => {
        if (abortController) {
            abortController.abort();
            setIsGenerating(false);
            setStatus('Generation cancelled');
            setAbortController(null);
        }
    };

    // Generate world from prompt
    const handleGenerateWorld = async () => {
        if (!prompt.trim() || isGenerating) return;

        const controller = new AbortController();
        setAbortController(controller);
        setIsGenerating(true);
        setProgress(0);
        setStatus('Initializing AI model...');

        try {
            const world = await hunyuanWorldService.generateWorld({
                prompt: prompt.trim(),
                quality,
                resolution,
                format,
                includeTextures: true,
                onProgress: (progressValue, statusMessage) => {
                    setProgress(progressValue);
                    setStatus(statusMessage);
                }
            });

            setWorlds(prev => [...prev, world]);
            setActiveWorld(world);
            setStatus('Generation complete!');

        } catch (error) {
            console.error('Failed to generate world:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            if (!controller.signal.aborted) {
                setStatus(errorMessage);
            }
        } finally {
            setIsGenerating(false);
            setAbortController(null);
        }
    };

    // Generate from script
    const handleGenerateFromScript = async () => {
        if (!scriptAnalysis?.scenes.length) return;
        const firstScene = scriptAnalysis.scenes[0];
        const scenePrompt = `A 3D world representing: ${firstScene.description}. ${firstScene.location ? `Setting: ${firstScene.location}.` : ''} Style: Cinematic, detailed, realistic.`;
        setPrompt(scenePrompt);
        await handleGenerateWorld();
    };

    // Delete world
    const handleDeleteWorld = (worldId: string) => {
        setWorlds(prev => prev.filter(w => w.id !== worldId));
        if (activeWorld?.id === worldId) {
            setActiveWorld(null);
        }
    };

    // Download world
    const handleDownloadWorld = async (world: HunyuanWorldResult) => {
        try {
            const response = await fetch(world.modelUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `world-${world.id.substring(0, 8)}.${world.metadata.format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    // Navigation control callbacks
    const handleCameraPreset = useCallback(async (preset: 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right' | 'isometric') => {
        if (!cameraRef.current || !controlsRef.current || !sceneRef.current) return;
        const THREE = await import('three');
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        const scene = sceneRef.current;

        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        const distance = maxDimension * 2;

        const positions = {
            front: [0, 0, distance],
            back: [0, 0, -distance],
            top: [0, distance, 0],
            bottom: [0, -distance, 0],
            left: [-distance, 0, 0],
            right: [distance, 0, 0],
            isometric: [distance * 0.7, distance * 0.7, distance * 0.7]
        };

        const pos = positions[preset];
        camera.position.set(pos[0], pos[1], pos[2]);
        controls.target.set(0, 0, 0);
        controls.update();
    }, []);

    const handleLightingChange = useCallback(async (lighting: {
        ambientIntensity: number;
        directionalIntensity: number;
        directionalPosition: [number, number, number];
    }) => {
        if (!sceneRef.current || !directionalLightRef.current) return;
        const THREE = await import('three');
        const scene = sceneRef.current;
        const directionalLight = directionalLightRef.current;

        scene.traverse((child: any) => {
            if (child instanceof THREE.AmbientLight) {
                child.intensity = lighting.ambientIntensity;
            }
        });

        directionalLight.intensity = lighting.directionalIntensity;
        directionalLight.position.set(...lighting.directionalPosition);

        setNavigationSettings(prev => ({
            ...prev,
            ambientIntensity: lighting.ambientIntensity,
            directionalIntensity: lighting.directionalIntensity
        }));
    }, []);

    const handleGridToggle = useCallback(async (enabled: boolean) => {
        if (!sceneRef.current) return;
        const scene = sceneRef.current;
        const existingGrid = scene.getObjectByName('gridHelper');
        if (existingGrid) {
            scene.remove(existingGrid);
        }
        if (enabled) {
            const { GridHelper } = await import('three');
            const gridHelper = new GridHelper(20, 20, 0x888888, 0xcccccc);
            gridHelper.name = 'gridHelper';
            scene.add(gridHelper);
        }
        setNavigationSettings(prev => ({ ...prev, gridEnabled: enabled }));
    }, []);

    const handleWireframeToggle = useCallback((enabled: boolean) => {
        if (!sceneRef.current) return;
        sceneRef.current.traverse((child: any) => {
            if (child.isMesh) {
                child.material.wireframe = enabled;
            }
        });
        setNavigationSettings(prev => ({ ...prev, wireframeEnabled: enabled }));
    }, []);

    const handleAutoRotateToggle = useCallback((enabled: boolean) => {
        if (!controlsRef.current) return;
        controlsRef.current.autoRotate = enabled;
        setNavigationSettings(prev => ({ ...prev, autoRotateEnabled: enabled }));
    }, []);

    const handleReset = useCallback(async () => {
        handleCameraPreset('isometric');
        handleLightingChange({
            ambientIntensity: 0.6,
            directionalIntensity: 0.4,
            directionalPosition: [5, 5, 5]
        });
        handleWireframeToggle(false);
        await handleGridToggle(false);
        handleAutoRotateToggle(false);
    }, [handleCameraPreset, handleLightingChange, handleWireframeToggle, handleGridToggle, handleAutoRotateToggle]);

    // Load 3D model in viewer
    useEffect(() => {
        if (!activeWorld || !viewerRef.current) return;

        const loadModel = async () => {
            const viewer = viewerRef.current;
            if (!viewer) return;

            viewer.innerHTML = '';

            if (activeWorld.metadata.format === 'glb' || activeWorld.metadata.format === 'gltf') {
                try {
                    const THREE = await import('three');
                    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
                    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');

                    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                    const camera = new THREE.PerspectiveCamera(75, viewer.clientWidth / viewer.clientHeight, 0.1, 1000);

                    renderer.setSize(viewer.clientWidth, viewer.clientHeight);
                    renderer.setClearColor(0x000000, 0);
                    renderer.shadowMap.enabled = true;
                    viewer.appendChild(renderer.domElement);

                    const controls = new OrbitControls(camera, renderer.domElement);
                    controls.enableDamping = true;
                    controls.dampingFactor = 0.05;
                    controls.autoRotate = navigationSettings.autoRotateEnabled;

                    const ambientLight = new THREE.AmbientLight(0xffffff, navigationSettings.ambientIntensity);
                    const directionalLight = new THREE.DirectionalLight(0xffffff, navigationSettings.directionalIntensity);
                    directionalLight.position.set(5, 5, 5);
                    directionalLight.castShadow = true;

                    const scene3D = new THREE.Scene();
                    scene3D.add(ambientLight);
                    scene3D.add(directionalLight);

                    sceneRef.current = scene3D;
                    cameraRef.current = camera;
                    rendererRef.current = renderer;
                    controlsRef.current = controls;
                    directionalLightRef.current = directionalLight;

                    const loader = new GLTFLoader();
                    loader.load(activeWorld.modelUrl, (gltf) => {
                        scene3D.add(gltf.scene);

                        const box = new THREE.Box3().setFromObject(gltf.scene);
                        const center = box.getCenter(new THREE.Vector3());
                        const size = box.getSize(new THREE.Vector3());

                        gltf.scene.position.sub(center);
                        camera.position.set(size.x, size.y, size.z * 2);
                        controls.target.set(0, 0, 0);
                        controls.update();

                        handleCameraPreset('isometric');

                        const animate = () => {
                            animationIdRef.current = requestAnimationFrame(animate);
                            controls.update();
                            renderer.render(scene3D, camera);
                        };
                        animate();
                    });

                    // Handle resize
                    const handleResize = () => {
                        if (!viewer) return;
                        camera.aspect = viewer.clientWidth / viewer.clientHeight;
                        camera.updateProjectionMatrix();
                        renderer.setSize(viewer.clientWidth, viewer.clientHeight);
                    };
                    window.addEventListener('resize', handleResize);

                    return () => {
                        window.removeEventListener('resize', handleResize);
                        if (animationIdRef.current) {
                            cancelAnimationFrame(animationIdRef.current);
                        }
                    };

                } catch (error) {
                    console.error('Failed to load 3D model:', error);
                }
            }
        };

        loadModel();
    }, [activeWorld, navigationSettings.autoRotateEnabled]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
        };
    }, []);

    return (
        <TooltipProvider>
            <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
                {/* Modern Header */}
                <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Globe className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight">3D World Generator</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Create stunning 3D worlds with AI
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={serviceStatus.available ? "default" : "destructive"}>
                                    <span className="mr-1.5">●</span>
                                    {serviceStatus.available ? 'Online' : 'Offline'}
                                </Badge>
                                {serviceStatus.activeJobs > 0 && (
                                    <Badge variant="secondary">
                                        {serviceStatus.activeJobs} active
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Modern Controls */}
                    <div className="px-6 pb-4">
                        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur">
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    {/* Prompt Input */}
                                    <div className="space-y-2">
                                        <Label htmlFor="prompt" className="text-sm font-medium">
                                            Describe your 3D world
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="prompt"
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder="e.g., A futuristic city with neon lights and flying cars..."
                                                disabled={isGenerating}
                                                className="flex-1"
                                            />
                                            {scriptAnalysis && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={handleGenerateFromScript}
                                                            disabled={isGenerating}
                                                        >
                                                            <Film className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Generate from script scene
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>

                                    {/* Generation Options */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="quality" className="text-sm">Quality</Label>
                                            <Select value={quality} onValueChange={(value: any) => setQuality(value)} disabled={isGenerating}>
                                                <SelectTrigger id="quality">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="turbo">
                                                        <div className="flex items-center gap-2">
                                                            <Zap className="h-3 w-3" />
                                                            <span>Turbo (15 steps)</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="fast">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3 w-3" />
                                                            <span>Fast (25 steps)</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="standard">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            <span>Standard (30 steps)</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="resolution" className="text-sm">Resolution</Label>
                                            <Select value={resolution} onValueChange={(value: any) => setResolution(value)} disabled={isGenerating}>
                                                <SelectTrigger id="resolution">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low (128)</SelectItem>
                                                    <SelectItem value="standard">Standard (256)</SelectItem>
                                                    <SelectItem value="high">High (512)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="format" className="text-sm">Format</Label>
                                            <Select value={format} onValueChange={(value: any) => setFormat(value)} disabled={isGenerating}>
                                                <SelectTrigger id="format">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="glb">GLB (Recommended)</SelectItem>
                                                    <SelectItem value="obj">OBJ</SelectItem>
                                                    <SelectItem value="ply">PLY</SelectItem>
                                                    <SelectItem value="stl">STL</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm invisible">Action</Label>
                                            {isGenerating ? (
                                                <Button
                                                    onClick={handleCancelGeneration}
                                                    variant="destructive"
                                                    className="w-full"
                                                >
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Cancel
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={handleGenerateWorld}
                                                    disabled={!prompt.trim() || !serviceStatus.available}
                                                    className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                                                >
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Generate
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <AnimatePresence>
                                        {isGenerating && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-2"
                                            >
                                                <Progress value={progress} className="h-2" />
                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    {status}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* 3D Viewer */}
                    <div className="flex-1 p-6">
                        <Card className="h-full border-0 shadow-lg overflow-hidden bg-gradient-to-br from-card via-card/95 to-muted/10">
                            <div
                                ref={viewerRef}
                                className="w-full h-full relative rounded-lg"
                                style={{
                                    background: activeWorld ?
                                        'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.05), transparent)' :
                                        undefined
                                }}
                            >
                                {!activeWorld && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center max-w-md space-y-4"
                                        >
                                            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                                                <Globe className="w-10 h-10 text-primary" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-semibold">Ready to Create</h3>
                                                <p className="text-muted-foreground">
                                                    Enter a description and generate your first 3D world
                                                </p>
                                            </div>
                                            <div className="flex justify-center gap-4 pt-4">
                                                <Badge variant="secondary">
                                                    <Wand2 className="mr-1 h-3 w-3" />
                                                    AI Powered
                                                </Badge>
                                                <Badge variant="secondary">
                                                    <Layers className="mr-1 h-3 w-3" />
                                                    High Quality
                                                </Badge>
                                                <Badge variant="secondary">
                                                    <Zap className="mr-1 h-3 w-3" />
                                                    Fast Generation
                                                </Badge>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}

                                {/* Navigation Controls */}
                                {activeWorld && (
                                    <NavigationControls
                                        onCameraPreset={handleCameraPreset}
                                        onLightingChange={handleLightingChange}
                                        onGridToggle={handleGridToggle}
                                        onWireframeToggle={handleWireframeToggle}
                                        onAutoRotateToggle={handleAutoRotateToggle}
                                        onReset={handleReset}
                                        gridEnabled={navigationSettings.gridEnabled}
                                        wireframeEnabled={navigationSettings.wireframeEnabled}
                                        autoRotateEnabled={navigationSettings.autoRotateEnabled}
                                        ambientIntensity={navigationSettings.ambientIntensity}
                                        directionalIntensity={navigationSettings.directionalIntensity}
                                    />
                                )}

                                {/* Viewer Actions */}
                                {activeWorld && (
                                    <div className="absolute bottom-4 left-4 flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setShowFullscreen(true)}
                                        >
                                            <Maximize2 className="mr-2 h-4 w-4" />
                                            Fullscreen
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleDownloadWorld(activeWorld)}
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Gallery Sidebar */}
                    <Sheet open={showGallery} onOpenChange={setShowGallery}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
                            >
                                <Images className="h-6 w-6" />
                                {worlds.length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                        {worlds.length}
                                    </span>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px]">
                            <SheetHeader>
                                <SheetTitle>World Gallery</SheetTitle>
                                <SheetDescription>
                                    Your generated 3D worlds collection
                                </SheetDescription>
                            </SheetHeader>
                            <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                                {worlds.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center">
                                        <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">No worlds generated yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {worlds.map((world) => (
                                            <motion.div
                                                key={world.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                whileHover={{ scale: 1.02 }}
                                            >
                                                <Card
                                                    className={cn(
                                                        "cursor-pointer transition-all",
                                                        activeWorld?.id === world.id && "ring-2 ring-primary"
                                                    )}
                                                    onClick={() => setActiveWorld(world)}
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <h4 className="font-medium text-sm truncate flex-1">
                                                                {world.metadata.prompt?.substring(0, 50)}...
                                                            </h4>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDownloadWorld(world);
                                                                    }}
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteWorld(world.id);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                            <div>
                                                                <span className="font-medium">Quality:</span> {world.metadata.quality}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Format:</span> {world.metadata.format.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Vertices:</span> {world.metadata.vertices.toLocaleString()}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Time:</span> {new Date(world.metadata.createdAt).toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Fullscreen Modal */}
                <AnimatePresence>
                    {showFullscreen && activeWorld && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
                            onClick={() => setShowFullscreen(false)}
                        >
                            <div className="w-full h-full p-8">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-4 right-4 text-white hover:bg-white/20"
                                    onClick={() => setShowFullscreen(false)}
                                >
                                    <RefreshCw className="h-6 w-6" />
                                </Button>
                                <div className="w-full h-full" ref={viewerRef} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </TooltipProvider>
    );
}

export default ThreeDWorldsTab;
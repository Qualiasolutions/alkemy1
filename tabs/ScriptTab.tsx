import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeContext';
import { THEME_COLORS } from '../constants';
import Button from '../components/Button';
import { ScriptAnalysis } from '../types';
import { UploadCloudIcon, XIcon, UsersIcon, MapPinIcon, ClapperboardIcon } from '../components/icons/Icons';
import { SkeletonAnalysis } from '../components/SkeletonLoader';


interface AnalysisInfoCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
}

const AnalysisInfoCard: React.FC<AnalysisInfoCardProps> = ({ icon, label, value }) => (
    <div className={`bg-[${THEME_COLORS.surface_card}] border border-[${THEME_COLORS.border_color}] rounded-lg p-4 flex items-center gap-4`}>
        <div className={`w-10 h-10 flex-shrink-0 bg-[${THEME_COLORS.background_primary}] rounded-md flex items-center justify-center text-[${THEME_COLORS.accent_primary}]`}>
            {icon}
        </div>
        <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className={`text-sm text-[${THEME_COLORS.text_secondary}] uppercase tracking-wider`}>{label}</div>
        </div>
    </div>
);

interface AnalysisSectionProps {
    title: string;
    children: React.ReactNode;
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ title, children }) => (
    <div className={`bg-[${THEME_COLORS.surface_card}] border border-[${THEME_COLORS.border_color}] rounded-lg p-6`}>
        <h4 className={`text-lg font-semibold mb-4 text-[${THEME_COLORS.text_primary}]`}>{title}</h4>
        {children}
    </div>
);


interface ScriptTabProps {
    scriptContent: string | null;
    analysis: ScriptAnalysis | null;
    onScriptUpdate: (content: string | null) => void;
    isAnalyzing: boolean;
    analysisError: string | null;
    analysisMessage: string;
    onAnalyze: () => void;
}

const ScriptTab: React.FC<ScriptTabProps> = ({ scriptContent, analysis, onScriptUpdate, isAnalyzing, analysisError, analysisMessage, onAnalyze }) => {
    const { isDark } = useTheme();
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isParsing, setIsParsing] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
    const [pastedScript, setPastedScript] = useState<string>('');
    
    useEffect(() => {
        // FIX: Added !analysisError to prevent an infinite loop on analysis failure.
        if (scriptContent && !isAnalyzing && !analysis && !analysisError) {
            onAnalyze();
        }
    }, [scriptContent, isAnalyzing, analysis, analysisError, onAnalyze]);

    const handleClearScript = useCallback(() => {
        onScriptUpdate(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setInputMode('upload');
        setPastedScript('');
    }, [onScriptUpdate]);

    const handleFile = useCallback((file: File) => {
        if (!file || !(file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.fountain') || file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
            alert('Please upload a valid script file (.pdf, .txt, .md, .fountain)');
            return;
        }

        onScriptUpdate(null); // Clear previous script while parsing new one
        setIsParsing(true);

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            const pdfjsLib = (window as any).pdfjsLib;
            if (!pdfjsLib) {
                console.error("pdf.js library is not loaded.");
                alert("Error: PDF library not loaded. Cannot parse PDF file.");
                handleClearScript();
                setIsParsing(false);
                return;
            }
            
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js`;
            const reader = new FileReader();

            reader.onload = async (event) => {
                try {
                    const arrayBuffer = event.target?.result;
                    if (!arrayBuffer) throw new Error("File could not be read as ArrayBuffer.");
                    
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    const numPages = pdf.numPages;
                    const textPromises = [];
                    for (let i = 1; i <= numPages; i++) {
                        const page = await pdf.getPage(i);
                        textPromises.push(page.getTextContent());
                    }

                    const textContents = await Promise.all(textPromises);
                    const fullText = textContents.map(content => {
                        return content.items.map((item: any) => item.str).join(' ');
                    }).join('\n\n');
                    
                    onScriptUpdate(fullText);
                } catch (error) {
                    console.error('Error parsing PDF:', error);
                    alert('Could not read the PDF file. It might be corrupted or an image-based PDF.');
                    handleClearScript();
                } finally {
                    setIsParsing(false);
                }
            };
            reader.onerror = () => {
                console.error('FileReader error on PDF');
                alert('An error occurred while reading the PDF file.');
                handleClearScript();
                setIsParsing(false);
            };
            reader.readAsArrayBuffer(file);
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                onScriptUpdate(e.target?.result as string);
                setIsParsing(false);
            };
            reader.onerror = () => {
                console.error('FileReader error on text file');
                alert('An error occurred while reading the file.');
                handleClearScript();
                setIsParsing(false);
            };
            reader.readAsText(file);
        }
    }, [handleClearScript, onScriptUpdate]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handlePasteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pastedScript.trim()) {
            alert("Please paste some script content.");
            return;
        }
        onScriptUpdate(pastedScript);
    };
    
    const renderAnalysisSummary = () => {
        if (isAnalyzing) {
            return (
                <div>
                    <div className="mb-6 flex items-center gap-4">
                        <div className="w-8 h-8 border-4 border-t-transparent border-[#10A37F] rounded-full animate-spin"></div>
                        <div>
                            <p className="font-semibold text-white">Analyzing Script...</p>
                            <p className="text-sm text-gray-400">{analysisMessage}</p>
                        </div>
                    </div>
                    <SkeletonAnalysis />
                </div>
            );
        }

        if (analysisError) {
             return (
                <div className="mt-8">
                    <AnalysisSection title="Analysis Failed">
                        <div className={`text-[${THEME_COLORS.error}] space-y-2`}>
                            <p className="font-semibold">There was an error analyzing the script.</p>
                            <p className="text-sm font-mono bg-red-900/20 p-2 rounded">{analysisError}</p>
                        </div>
                    </AnalysisSection>
                </div>
            );
        }
        
        if (!analysis) return null;

        return (
             <div className="mt-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnalysisInfoCard icon={<UsersIcon />} label="Cast" value={analysis.characters.length} />
                    <AnalysisInfoCard icon={<MapPinIcon />} label="Locations" value={analysis.locations.length} />
                    <AnalysisInfoCard icon={<ClapperboardIcon />} label="Scenes" value={analysis.scenes.length} />
                </div>
                 <AnalysisSection title="Summary">
                    <p className={`text-[${THEME_COLORS.text_secondary}]`}>{analysis.summary}</p>
                </AnalysisSection>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnalysisSection title="Key Props">
                        <ul className={`list-disc list-inside text-[${THEME_COLORS.text_secondary}] space-y-1 h-32 overflow-y-auto`}>
                            {analysis.props?.length > 0 ? analysis.props.map((prop, i) => <li key={i}>{prop}</li>) : <li className="list-none">None specified.</li>}
                        </ul>
                    </AnalysisSection>
                    <AnalysisSection title="Styling & Wardrobe">
                        <ul className={`list-disc list-inside text-[${THEME_COLORS.text_secondary}] space-y-1 h-32 overflow-y-auto`}>
                             {analysis.styling?.length > 0 ? analysis.styling.map((style, i) => <li key={i}>{style}</li>) : <li className="list-none">None specified.</li>}
                        </ul>
                    </AnalysisSection>
                     <AnalysisSection title="Set Dressing">
                        <ul className={`list-disc list-inside text-[${THEME_COLORS.text_secondary}] space-y-1 h-32 overflow-y-auto`}>
                             {analysis.setDressing?.length > 0 ? analysis.setDressing.map((item, i) => <li key={i}>{item}</li>) : <li className="list-none">None specified.</li>}
                        </ul>
                    </AnalysisSection>
                    <AnalysisSection title="Makeup & Hair">
                        <ul className={`list-disc list-inside text-[${THEME_COLORS.text_secondary}] space-y-1 h-32 overflow-y-auto`}>
                             {analysis.makeupAndHair?.length > 0 ? analysis.makeupAndHair.map((item, i) => <li key={i}>{item}</li>) : <li className="list-none">None specified.</li>}
                        </ul>
                    </AnalysisSection>
                    <AnalysisSection title="Sound Cues">
                         <ul className={`list-disc list-inside text-[${THEME_COLORS.text_secondary}] space-y-1 h-32 overflow-y-auto`}>
                             {analysis.sound?.length > 0 ? analysis.sound.map((item, i) => <li key={i}>{item}</li>) : <li className="list-none">None specified.</li>}
                        </ul>
                    </AnalysisSection>
                </div>
             </div>
        );
    };

    if (!scriptContent) {
        return (
            <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center overflow-hidden">
                {/* Elegant Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Animated gradient halos */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.15, 0.25, 0.15],
                            x: [0, 50, 0],
                            y: [0, -30, 0]
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl ${
                            isDark ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/10' : 'bg-gradient-to-br from-teal-400/25 to-cyan-400/15'
                        }`}
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.12, 0.22, 0.12],
                            x: [0, -40, 0],
                            y: [0, 40, 0]
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1
                        }}
                        className={`absolute bottom-1/4 right-1/3 w-[450px] h-[450px] rounded-full blur-3xl ${
                            isDark ? 'bg-gradient-to-tl from-purple-500/15 to-pink-500/8' : 'bg-gradient-to-tl from-purple-400/20 to-pink-400/12'
                        }`}
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{
                            duration: 12,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 2
                        }}
                        className={`absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl ${
                            isDark ? 'bg-gradient-to-br from-blue-500/12 to-indigo-500/8' : 'bg-gradient-to-br from-blue-400/18 to-indigo-400/12'
                        }`}
                    />

                    {/* Floating particles */}
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            className={`absolute w-1 h-1 rounded-full ${
                                isDark ? 'bg-teal-400/30' : 'bg-teal-500/40'
                            }`}
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -30, 0],
                                x: [0, Math.random() * 20 - 10, 0],
                                opacity: [0.2, 0.6, 0.2],
                                scale: [1, 1.5, 1]
                            }}
                            transition={{
                                duration: 4 + Math.random() * 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: Math.random() * 3
                            }}
                        />
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative z-10 w-full max-w-4xl mx-auto px-8 text-center"
                >
                    {/* Centered Title Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mb-12"
                    >
                        <h1 className={`text-6xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                            <span className={`bg-gradient-to-r ${
                                isDark
                                    ? 'from-teal-400 via-cyan-400 to-teal-500'
                                    : 'from-teal-600 via-cyan-600 to-teal-700'
                            } bg-clip-text text-transparent inline-block`}>
                                Script Analysis
                            </span>
                        </h1>
                        <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto leading-relaxed`}>
                            Upload a script to automatically break it down into scenes, characters, and locations with AI-powered precision
                        </p>
                    </motion.div>

                    {inputMode === 'upload' ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative p-16 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 backdrop-blur-sm ${
                                    isDragging
                                        ? isDark
                                            ? 'border-teal-400 bg-teal-500/10 shadow-lg shadow-teal-500/20'
                                            : 'border-teal-600 bg-teal-500/15 shadow-lg shadow-teal-500/30'
                                        : isDark
                                            ? 'border-gray-700 bg-gray-900/30 hover:border-teal-500/50 hover:bg-gray-900/50'
                                            : 'border-gray-300 bg-white/40 hover:border-teal-500/50 hover:bg-white/60'
                                }`}
                                aria-label="Script upload dropzone"
                                role="button"
                                tabIndex={0}
                            >
                                <motion.div
                                    animate={{
                                        y: isDragging ? -5 : 0,
                                        scale: isDragging ? 1.05 : 1
                                    }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col items-center"
                                >
                                    <motion.div
                                        animate={{
                                            y: [0, -8, 0]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        className={`w-20 h-20 mb-6 ${
                                            isDark ? 'text-teal-400' : 'text-teal-600'
                                        }`}
                                    >
                                        <UploadCloudIcon />
                                    </motion.div>
                                    <h3 className={`text-2xl font-bold mb-2 ${
                                        isDark ? 'text-white' : 'text-black'
                                    }`}>
                                        Drag & drop your script
                                    </h3>
                                    <p className={`text-lg mb-4 ${
                                        isDark ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        or click to browse files
                                    </p>
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                                        isDark
                                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                                            : 'bg-teal-100 text-teal-700 border border-teal-200'
                                    }`}>
                                        <span>Supports:</span>
                                        <span className="font-mono">.pdf</span>
                                        <span className="font-mono">.txt</span>
                                        <span className="font-mono">.fountain</span>
                                        <span className="font-mono">.md</span>
                                    </div>
                                </motion.div>
                            </div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className={`mt-8 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                                Don't have a file?{' '}
                                <button
                                    onClick={() => setInputMode('paste')}
                                    className={`font-semibold ${
                                        isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
                                    } hover:underline focus:outline-none transition-colors`}
                                >
                                    Paste your script directly →
                                </button>
                            </motion.p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.txt,.md,.fountain"
                                onChange={handleFileSelect}
                                aria-hidden="true"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <form onSubmit={handlePasteSubmit} className="w-full">
                                <h3 className={`text-2xl font-semibold mb-6 ${
                                    isDark ? 'text-white' : 'text-black'
                                }`}>
                                    Paste your script
                                </h3>
                                <textarea
                                    value={pastedScript}
                                    onChange={(e) => setPastedScript(e.target.value)}
                                    placeholder="INT. COFFEE SHOP - DAY&#10;&#10;A cozy neighborhood coffee shop buzzes with morning energy..."
                                    className={`w-full h-80 rounded-2xl p-6 text-base font-mono focus:outline-none focus:ring-2 transition-all backdrop-blur-sm ${
                                        isDark
                                            ? 'bg-gray-900/50 border-2 border-gray-700 text-gray-300 placeholder-gray-600 focus:ring-teal-500 focus:border-teal-500'
                                            : 'bg-white/60 border-2 border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-teal-500 focus:border-teal-500'
                                    }`}
                                    aria-label="Paste script content"
                                />
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={!pastedScript.trim()}
                                        className="!px-8 !py-3 !text-lg"
                                    >
                                        Analyze Script
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => setInputMode('upload')}
                                        className={`text-base font-semibold transition-colors ${
                                            isDark
                                                ? 'text-gray-400 hover:text-teal-400'
                                                : 'text-gray-600 hover:text-teal-600'
                                        }`}
                                    >
                                        ← or upload a file instead
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        );
    }
    
    return (
        <div>
            <header className="flex justify-between items-start">
                <div>
                    <h2 className={`text-2xl font-bold mb-1 text-[${THEME_COLORS.text_primary}]`}>{analysis ? analysis.title : 'Script'}</h2>
                    <p className={`text-md text-[${THEME_COLORS.text_secondary}]`}>{analysis ? analysis.logline : 'Analyze your script to prepare for production.'}</p>
                </div>
                 <button onClick={handleClearScript} aria-label="Clear script" className={`flex items-center gap-2 text-sm text-[${THEME_COLORS.text_secondary}] hover:text-white bg-[${THEME_COLORS.surface_card}] border border-[${THEME_COLORS.border_color}] rounded-lg px-3 py-2`}>
                    <XIcon />
                    <span>Clear</span>
                </button>
            </header>
            
            <div className="mt-6 space-y-8">
                <section aria-labelledby="script-viewer-heading">
                     <div className={`bg-[${THEME_COLORS.surface_card}] border border-[${THEME_COLORS.border_color}] rounded-xl p-4 h-96`}>
                        {isParsing ? (
                            <div className="flex items-center justify-center h-full text-center text-gray-400">
                                <div>
                                    <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin mx-auto mb-3"></div>
                                    <p>Extracting text from script...</p>
                                </div>
                            </div>
                        ) : (
                          <pre className="text-sm whitespace-pre-wrap break-words h-full overflow-y-auto text-gray-300 font-mono">
                              {scriptContent}
                          </pre>
                        )}
                    </div>
                </section>
                
                {renderAnalysisSummary()}
            </div>
        </div>
    );
};

export default ScriptTab;

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
             <div>
                <h2 className={`text-2xl font-bold mb-1 text-[${THEME_COLORS.text_primary}]`}>Script</h2>
                <p className={`text-md text-[${THEME_COLORS.text_secondary}] mb-6`}>Upload a script to automatically break it down into scenes, characters, and locations.</p>
                
                {inputMode === 'upload' ? (
                    <div 
                        className="flex flex-col items-center justify-center h-[calc(100vh-15rem)] text-center"
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-10 border-2 border-dashed border-[${THEME_COLORS.border_color}] rounded-2xl w-full max-w-2xl cursor-pointer transition-colors duration-300 ${isDragging ? `border-[${THEME_COLORS.accent_primary}] bg-[${THEME_COLORS.hover_background}]` : ''}`}
                            aria-label="Script upload dropzone"
                            role="button"
                            tabIndex={0}
                        >
                            <div className="flex justify-center mb-4">
                                <span className={`w-12 h-12 text-[${THEME_COLORS.text_secondary}]`}>
                                    <UploadCloudIcon />
                                </span>
                            </div>
                            <h3 className={`text-xl font-semibold mb-1 text-[${THEME_COLORS.text_primary}]`}>Drag & drop script file</h3>
                            <p className={`text-md text-[${THEME_COLORS.text_secondary}]`}>or click to browse</p>
                            <p className={`text-xs text-[${THEME_COLORS.text_secondary}] mt-4`}>Supported formats: .pdf, .txt, .fountain, .md</p>
                        </div>
                        <p className="mt-6 text-sm text-gray-400">
                            Don't have a file?{' '}
                            <button onClick={() => setInputMode('paste')} className={`font-semibold text-[${THEME_COLORS.accent_primary}] hover:underline focus:outline-none`}>
                                Paste your script directly.
                            </button>
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.txt,.md,.fountain"
                            onChange={handleFileSelect}
                            aria-hidden="true"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[calc(100vh-15rem)] text-center">
                        <form onSubmit={handlePasteSubmit} className="w-full max-w-2xl">
                            <h3 className="text-xl font-semibold mb-4">Paste your script</h3>
                            <textarea
                                value={pastedScript}
                                onChange={(e) => setPastedScript(e.target.value)}
                                placeholder="INT. COFFEE SHOP - DAY..."
                                className={`w-full h-64 bg-[${THEME_COLORS.surface_card}] border border-[${THEME_COLORS.border_color}] rounded-xl p-4 text-sm text-gray-300 font-mono focus:outline-none focus:ring-2 focus:ring-[${THEME_COLORS.accent_primary}]`}
                                aria-label="Paste script content"
                            />
                            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <Button type="submit" variant="primary" disabled={!pastedScript.trim()}>
                                    Submit Script
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setInputMode('upload')}
                                    className={`text-sm font-semibold text-[${THEME_COLORS.text_secondary}] hover:text-[${THEME_COLORS.accent_primary}] transition-colors`}
                                >
                                    or upload a file instead
                                </button>
                            </div>
                        </form>
                    </div>
                )}
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

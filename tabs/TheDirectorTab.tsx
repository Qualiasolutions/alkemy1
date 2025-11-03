
import React, { useState, useRef, useEffect } from 'react';
import { ScriptAnalysis } from '../types';
import { THEME_COLORS } from '../constants';
import Button from '../components/Button';
import { askTheDirector } from '../services/aiService';
import { BrainIcon, SendIcon } from '../components/icons/Icons';

interface Message {
    author: 'user' | 'director';
    text: string;
}

interface TheDirectorTabProps {
    scriptAnalysis: ScriptAnalysis | null;
}

const TheDirectorTab: React.FC<TheDirectorTabProps> = ({ scriptAnalysis }) => {
    const [messages, setMessages] = useState<Message[]>([
        { author: 'director', text: "Welcome. I have reviewed the project materials. How can I assist you with the creative direction?" }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !scriptAnalysis) return;

        const newMessages: Message[] = [...messages, { author: 'user', text: userInput }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const responseText = await askTheDirector(scriptAnalysis, userInput);
            setMessages([...newMessages, { author: 'director', text: responseText }]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setMessages([...newMessages, { author: 'director', text: `Sorry, I encountered an error: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!scriptAnalysis) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
                <div className={`p-10 border border-dashed border-[${THEME_COLORS.border_color}] rounded-2xl`}>
                    <h2 className="text-3xl font-bold mb-2">The Director is Waiting</h2>
                    <p className="text-lg text-gray-400 max-w-md">Please analyze a script in the 'Script' tab to access your creative partner.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <header className="mb-6 flex-shrink-0">
                <h2 className={`text-2xl font-bold mb-1 text-[${THEME_COLORS.text_primary}]`}>The Director</h2>
                <p className={`text-md text-[${THEME_COLORS.text_secondary}] max-w-3xl`}>Your creative partner. Ask questions about the script, request creative suggestions, or generate detailed visual prompts.</p>
            </header>
            
            <main className={`flex-1 flex flex-col bg-[${THEME_COLORS.surface_card}] border border-[${THEME_COLORS.border_color}] rounded-xl overflow-hidden`}>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-4 ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.author === 'director' && (
                                <div className={`w-9 h-9 flex-shrink-0 bg-[${THEME_COLORS.accent_primary}] rounded-full flex items-center justify-center`}>
                                    <BrainIcon className={`w-5 h-5 text-[${THEME_COLORS.background_primary}]`} />
                                </div>
                            )}
                            <div className={`max-w-xl rounded-2xl px-5 py-3 ${msg.author === 'user' ? `bg-[${THEME_COLORS.accent_secondary}] text-white rounded-br-none` : `bg-[${THEME_COLORS.background_secondary}] text-gray-200 rounded-bl-none`}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex gap-4 justify-start">
                            <div className={`w-9 h-9 flex-shrink-0 bg-[${THEME_COLORS.accent_primary}] rounded-full flex items-center justify-center`}>
                                <BrainIcon className={`w-5 h-5 text-[${THEME_COLORS.background_primary}]`} />
                            </div>
                            <div className={`max-w-xl rounded-2xl px-5 py-3 bg-[${THEME_COLORS.background_secondary}] text-gray-200 rounded-bl-none`}>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 border-t border-[${THEME_COLORS.border_color}] bg-[#0F0F0F]">
                    <div className="relative">
                        <textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Ask the director..."
                            rows={1}
                            className="w-full bg-[#1F1F1F] border border-gray-600 rounded-xl p-3 pr-28 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isLoading || !userInput.trim()}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 !px-4 !py-2"
                        >
                            <SendIcon className="w-4 h-4" />
                            <span>Send</span>
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default TheDirectorTab;

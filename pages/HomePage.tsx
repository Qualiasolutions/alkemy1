import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Zap, Palette, CreditCard, Share2, ArrowRight, Play, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AuthModal from '@/components/auth/AuthModal';
import { isSupabaseConfigured } from '@/services/supabase';

const HomePage = () => {
  const navigate = useNavigate();
  const supabaseConfigured = isSupabaseConfigured();
  const authContext = supabaseConfigured ? useAuth() : null;
  const { user, isAuthenticated, signOut } = authContext || { user: null, isAuthenticated: false, signOut: async () => {} };

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password'>('login');

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/app');
    } else if (supabaseConfigured) {
      setAuthMode('register');
      setShowAuthModal(true);
    } else {
      navigate('/app');
    }
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/50 border-b border-gray-800">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#dfec2d] to-[#c4d319] rounded-lg font-bold text-black text-xl">
                A
              </div>
              <span className="text-xl font-bold">Alkemy Studio</span>
            </div>

            <div className="flex items-center gap-4">
              {supabaseConfigured && isAuthenticated ? (
                <>
                  <Button
                    onClick={() => navigate('/app')}
                    className="bg-[#dfec2d] text-black hover:bg-[#c4d319] font-semibold"
                  >
                    Open Studio
                  </Button>
                  <Button
                    onClick={() => signOut()}
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
                    Sign Out
                  </Button>
                </>
              ) : supabaseConfigured ? (
                <>
                  <Button
                    onClick={handleSignIn}
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={handleGetStarted}
                    className="bg-[#dfec2d] text-black hover:bg-[#c4d319] font-semibold"
                  >
                    Get Started
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigate('/app')}
                  className="bg-[#dfec2d] text-black hover:bg-[#c4d319] font-semibold"
                >
                  Launch Studio
                </Button>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-48 pb-20 px-6">
        {/* Animated background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#dfec2d]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-60 -left-40 w-80 h-80 bg-[#dfec2d]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-6 mt-12">
            {/* Badge */}
            <div className="flex justify-center">
              <Badge variant="outline" className="border-[#dfec2d]/30 text-[#dfec2d] px-4 py-1">
                <Sparkles className="w-4 h-4 mr-2" />
                Powered by Gemini 2.5, Imagen 4 & Veo 3.1
              </Badge>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
              <span className="block">AI-POWERED</span>
              <span className="block text-[#dfec2d] drop-shadow-[0_0_30px_rgba(223,236,45,0.5)]">
                FILM PRODUCTION
              </span>
              <span className="block">MADE SIMPLE</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From script analysis to frame generation with character consistency.
              Alkemy transforms your creative vision into stunning visuals in hours, not weeks.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-[#dfec2d] text-black hover:bg-[#c4d319] font-semibold text-lg px-8 py-6 group"
              >
                Start Creating
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-900 text-lg px-8 py-6 group"
                onClick={() => window.open('https://www.youtube.com/watch?v=demo', '_blank')}
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Create
            </h2>
            <p className="text-gray-400 text-lg">
              Professional tools that adapt to your creative workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-gray-900/50 border-gray-800 p-6 hover:bg-gray-900/80 transition-all duration-300 hover:scale-105 hover:border-[#dfec2d]/30"
              >
                <feature.icon className="w-10 h-10 text-[#dfec2d] mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gray-950">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#dfec2d] mb-2">90%</div>
              <p className="text-gray-400">Faster than traditional production</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#dfec2d] mb-2">98%</div>
              <p className="text-gray-400">Character consistency with LoRA</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#dfec2d] mb-2">60%</div>
              <p className="text-gray-400">Cost savings with intelligent caching</p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 px-6 bg-black">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple Workflow, Powerful Results
            </h2>
            <p className="text-gray-400 text-lg">
              From script to screen in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {workflow.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-[#dfec2d]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#dfec2d]/30">
                  <span className="text-2xl font-bold text-[#dfec2d]">{index + 1}</span>
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-950 to-black">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Vision?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Join creators who are revolutionizing film production with AI
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-[#dfec2d] text-black hover:bg-[#c4d319] font-semibold text-lg px-10 py-6"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#dfec2d] to-[#c4d319] rounded-lg font-bold text-black">
                A
              </div>
              <span className="text-sm text-gray-400">© 2024 Alkemy Studio. All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {supabaseConfigured && showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          onSwitchMode={setAuthMode}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

const features = [
  {
    icon: FileText,
    title: "AI Script Analysis",
    description: "Automatically extract characters, locations, and scenes from any screenplay format."
  },
  {
    icon: Users,
    title: "Consistent Characters",
    description: "LoRA-trained models ensure perfect character consistency across all frames."
  },
  {
    icon: Zap,
    title: "Fast Generation",
    description: "Draft to production in hours with multi-tier quality levels."
  },
  {
    icon: Palette,
    title: "Look Bible System",
    description: "Reference images that guide your film's visual style throughout."
  },
  {
    icon: CreditCard,
    title: "Cost Tracking",
    description: "Real-time budget tracking with intelligent caching for 40-60% savings."
  },
  {
    icon: Share2,
    title: "Collaboration",
    description: "Real-time multi-user editing with conflict resolution built-in."
  }
];

const workflow = [
  {
    title: "Upload Script",
    description: "Import your screenplay in any format"
  },
  {
    title: "AI Analysis",
    description: "Extract scenes, characters, and locations"
  },
  {
    title: "Generate Frames",
    description: "Create consistent visuals with AI"
  },
  {
    title: "Export & Share",
    description: "Download your production-ready assets"
  }
];

export default HomePage;
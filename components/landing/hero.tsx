import { Button } from "@/components/ui/button"
import { Play, ChevronRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative w-full pt-32 pb-20 md:pt-48 md:pb-32 flex flex-col items-center justify-center px-4 text-center">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] hero-glow pointer-events-none opacity-60" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80 mb-8 animate-fade-in">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Alkemy V2.0 is now available</span>
        <ChevronRight className="w-3 h-3 text-white/40" />
      </div>
      
      {/* Heading */}
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight max-w-5xl mx-auto mb-6 leading-[0.95] animate-slide-up">
        <span className="text-gradient">The Unreal Engine for</span>
        <br />
        <span className="text-white">AI Filmmaking.</span>
      </h1>
      
      {/* Subheading */}
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up [animation-delay:100ms]">
        Transform scripts into complete visual productions. 
        Control characters, cameras, and audio with the precision of a professional studio.
      </p>
      
      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up [animation-delay:200ms]">
        <Button size="lg" className="h-12 px-8 rounded-full text-base bg-white text-black hover:bg-white/90 font-medium min-w-[160px]">
          Start Studio
        </Button>
        <Button size="lg" variant="outline" className="h-12 px-8 rounded-full text-base border-white/20 bg-transparent hover:bg-white/5 text-white min-w-[160px] group">
          <Play className="w-4 h-4 mr-2 fill-white group-hover:scale-110 transition-transform" />
          Watch Reel
        </Button>
      </div>
      
      {/* Hero Visual / UI Mockup */}
      <div className="relative w-full max-w-6xl mt-20 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm shadow-2xl shadow-black/50 overflow-hidden animate-slide-up [animation-delay:300ms] group">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
        
        {/* Mockup Header */}
        <div className="h-10 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white/10" />
            <div className="w-3 h-3 rounded-full bg-white/10" />
            <div className="w-3 h-3 rounded-full bg-white/10" />
          </div>
          <div className="ml-4 h-5 w-64 rounded bg-white/5" />
        </div>
        
        {/* Mockup Content */}
        <div className="aspect-[16/9] w-full bg-grid-white/[0.02] relative flex items-center justify-center">
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                 <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto animate-pulse">
                    <Play className="w-8 h-8 text-white/40 ml-1" />
                 </div>
                 <p className="text-sm text-muted-foreground font-mono">Generating Scene 01: "The Arrival"...</p>
              </div>
           </div>
           
           {/* Floating UI Elements */}
           <div className="absolute top-8 right-8 w-64 p-4 rounded-lg glass-panel border border-white/10 space-y-3 transform transition-transform group-hover:-translate-y-2 duration-500">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                 <span>Director Agent</span>
                 <span className="w-2 h-2 rounded-full bg-[#dfec2d]/100" />
              </div>
              <div className="space-y-2">
                 <div className="p-2 rounded bg-white/5 text-xs text-white/80">
                    Suggesting 50mm lens for close-up continuity.
                 </div>
                 <div className="p-2 rounded bg-primary/10 text-xs text-primary border border-primary/20">
                    Applying "Blade Runner" color grade...
                 </div>
              </div>
           </div>
        </div>
      </div>
    </section>
  )
}

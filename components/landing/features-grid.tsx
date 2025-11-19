import { Mic, Users, Box, Music, Wand2, Layers } from 'lucide-react'

export function FeaturesGrid() {
  return (
    <section id="features" className="w-full py-24 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything you need to direct.</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          A complete production studio in your browser. From script analysis to final render.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[300px]">
        
        {/* Feature 1: Director Agent - Large */}
        <div className="md:col-span-2 row-span-1 md:row-span-2 rounded-3xl glass-panel p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 h-full flex flex-col">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Director Agent</h3>
            <p className="text-muted-foreground max-w-md">
              Control your entire production with voice commands. The AI Director understands film terminology, suggests shots, and ensures continuity across your timeline.
            </p>
            
            <div className="mt-auto pt-8">
               <div className="w-full p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                     <span className="text-xs font-mono text-white/60">LISTENING...</span>
                  </div>
                  <p className="text-lg font-medium text-white">"Change the lighting to golden hour and switch to a 35mm lens."</p>
               </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Character Consistency */}
        <div className="rounded-3xl glass-panel p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-0" />
          <div className="relative z-10 h-full flex flex-col">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Character Identity</h3>
            <p className="text-sm text-muted-foreground">
              Keep your cast consistent across every shot. No more morphing faces.
            </p>
            <div className="mt-auto flex gap-2 pt-4">
               <div className="h-16 w-16 rounded-lg bg-white/10 border border-white/20" />
               <div className="h-16 w-16 rounded-lg bg-white/10 border border-white/20" />
               <div className="h-16 w-16 rounded-lg bg-white/10 border border-white/20" />
            </div>
          </div>
        </div>

        {/* Feature 3: 3D Worlds */}
        <div className="rounded-3xl glass-panel p-8 relative overflow-hidden group">
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
          <div className="relative z-10 h-full flex flex-col">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <Box className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">3D Worlds</h3>
            <p className="text-sm text-muted-foreground">
              Scout locations in 3D. Place cameras and lights in a virtual environment.
            </p>
            <div className="mt-auto w-full h-24 rounded-lg border border-white/10 bg-grid-white/[0.05] relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-white/40 rounded-full" />
            </div>
          </div>
        </div>

        {/* Feature 4: Audio Mixing */}
        <div className="md:col-span-2 rounded-3xl glass-panel p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 group">
          <div className="flex-1 relative z-10">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <Music className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Professional Audio</h3>
            <p className="text-muted-foreground">
              Generate scores, foley, and dialogue. Mix multi-stem audio directly in the timeline with professional controls.
            </p>
          </div>
          <div className="flex-1 w-full h-full min-h-[120px] rounded-xl bg-black/40 border border-white/10 flex items-center justify-center gap-1 px-4">
             {[...Array(20)].map((_, i) => (
                <div key={i} className="w-2 bg-white/20 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.05}s` }} />
             ))}
          </div>
        </div>

        {/* Feature 5: Script Analysis */}
        <div className="rounded-3xl glass-panel p-8 relative overflow-hidden group">
          <div className="relative z-10 h-full flex flex-col">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Script to Screen</h3>
            <p className="text-sm text-muted-foreground">
              Upload your screenplay and watch Alkemy break it down into scenes, shots, and assets automatically.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}

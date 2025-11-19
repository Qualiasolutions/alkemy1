import { Button } from "@/components/ui/button"
import { Check } from 'lucide-react'

export function DirectorShowcase() {
  return (
    <section id="showcase" className="w-full py-24 px-4 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        
        <div className="flex-1 space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Your AI Co-Pilot.
            <br />
            <span className="text-muted-foreground">Always on set.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The Director Agent isn't just a chatbot. It's a context-aware filmmaking partner that knows your script, understands cinematography, and helps you execute your vision.
          </p>
          
          <ul className="space-y-4">
            {[
              "Context-aware suggestions based on your script",
              "Real-time continuity checking across shots",
              "Learns your visual style and preferences",
              "Hands-free voice control for rapid iteration"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-white/80">{item}</span>
              </li>
            ))}
          </ul>
          
          <Button variant="outline" className="rounded-full px-8 border-white/20 hover:bg-white/5">
            Meet the Director
          </Button>
        </div>

        <div className="flex-1 w-full">
          <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl">
            {/* Chat Interface Mockup */}
            <div className="absolute inset-0 flex flex-col">
              <div className="h-14 border-b border-white/10 bg-white/5 flex items-center px-6 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#dfec2d]/100" />
                  <span className="font-medium">Director Agent</span>
                </div>
                <div className="text-xs text-muted-foreground">Online</div>
              </div>
              
              <div className="flex-1 p-6 space-y-6 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
                
                {/* Message 1 */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                  <div className="space-y-2 max-w-[80%]">
                    <div className="p-4 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 text-sm leading-relaxed">
                      I've analyzed Scene 4. The lighting in Shot 3 doesn't match the established "Golden Hour" look from the previous shots. Should I regenerate it?
                    </div>
                  </div>
                </div>

                {/* Message 2 (User) */}
                <div className="flex gap-4 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-white shrink-0" />
                  <div className="space-y-2 max-w-[80%]">
                    <div className="p-4 rounded-2xl rounded-tr-none bg-white text-black text-sm font-medium">
                      Yes, fix it. And make the camera angle slightly lower.
                    </div>
                  </div>
                </div>

                {/* Message 3 */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                  <div className="space-y-2 max-w-[80%]">
                    <div className="p-4 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 text-sm leading-relaxed">
                      <p className="mb-3">On it. Generating 3 variations with low angle + golden hour lighting...</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="aspect-video bg-white/10 rounded animate-pulse" />
                        <div className="aspect-video bg-white/10 rounded animate-pulse [animation-delay:100ms]" />
                        <div className="aspect-video bg-white/10 rounded animate-pulse [animation-delay:200ms]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Input Area */}
              <div className="p-4 border-t border-white/10 bg-white/[0.02]">
                <div className="h-12 rounded-full bg-white/5 border border-white/10 flex items-center px-4 text-muted-foreground text-sm">
                  Type a message or press Space to speak...
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

export function TrustedBy() {
  return (
    <section className="w-full py-12 border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-sm font-medium text-muted-foreground mb-8">TRUSTED BY CREATIVE TEAMS AT</p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {/* Placeholder Logos - Using text for now, would be SVGs */}
          <span className="text-xl font-bold tracking-tighter text-white">ACME Studios</span>
          <span className="text-xl font-bold tracking-tighter text-white">NEXUS</span>
          <span className="text-xl font-bold tracking-tighter text-white">VORTEX</span>
          <span className="text-xl font-bold tracking-tighter text-white">HYPERION</span>
          <span className="text-xl font-bold tracking-tighter text-white">LUMINA</span>
        </div>
      </div>
    </section>
  )
}

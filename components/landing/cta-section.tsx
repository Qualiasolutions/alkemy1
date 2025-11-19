import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="w-full py-32 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none" />
      
      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
          Ready to direct your masterpiece?
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Join thousands of filmmakers using Alkemy to bring their stories to life faster than ever before.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button size="lg" className="h-14 px-10 rounded-full text-lg bg-white text-black hover:bg-white/90 font-medium w-full sm:w-auto">
            Get Started for Free
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-10 rounded-full text-lg border-white/20 hover:bg-white/5 w-full sm:w-auto">
            View Pricing
          </Button>
        </div>
        <p className="text-sm text-muted-foreground pt-8">
          No credit card required. Free tier available.
        </p>
      </div>
    </section>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center w-full px-4 py-4">
      <nav className="flex items-center justify-between w-full max-w-6xl px-6 py-3 rounded-full bg-background/60 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-black" />
            </div>
            Alkemy
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#showcase" className="hover:text-foreground transition-colors">Showcase</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Log in
          </Link>
          <Button size="sm" className="rounded-full px-5 bg-white text-black hover:bg-white/90 font-medium">
            Start Creating <ArrowRight className="w-3 h-3 ml-2" />
          </Button>
        </div>
      </nav>
    </header>
  )
}

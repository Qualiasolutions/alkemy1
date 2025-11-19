import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full py-12 px-4 border-t border-white/5 bg-black">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2 md:col-span-1 space-y-4">
          <Link href="/" className="text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-black" />
            </div>
            Alkemy
          </Link>
          <p className="text-sm text-muted-foreground">
            The AI Film Studio for professional storytellers.
          </p>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Showcase</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Changelog</Link></li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white">Resources</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Community</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Legal</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>© 2025 Alkemy AI Inc. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  )
}

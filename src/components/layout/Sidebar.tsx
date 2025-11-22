import { Box, FileText, Film, Home, Layers, Settings, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const navItems = [
    { label: 'Script', icon: FileText, to: 'script' },
    { label: 'Assets', icon: Users, to: 'assets' },
    { label: 'Stage', icon: Box, to: 'stage' },
    { label: 'Composition', icon: Layers, to: 'composite' },
    { label: 'Timeline', icon: Film, to: 'timeline' },
  ]

  return (
    <aside className="w-64 bg-black/90 backdrop-blur-xl border-r border-white/10 flex flex-col h-full">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="w-8 h-8 bg-[var(--color-accent-primary)] rounded-lg flex items-center justify-center mr-3 shadow-[var(--shadow-glow)]">
          <span className="text-black font-bold text-xl">A</span>
        </div>
        <span className="text-xl font-bold text-white tracking-wider">ALKEMY</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 space-y-8 overflow-y-auto">
        <div className="space-y-1 px-3">
          <p className="px-4 text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
            Production Phases
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-white/5 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div
                      className={cn(
                        'absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-accent-primary)] shadow-[var(--shadow-glow)]'
                      )}
                    />
                  )}
                  <item.icon
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-[var(--color-accent-primary)]' : 'text-white/40 group-hover:text-white'
                    )}
                  />
                  <span className="font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="space-y-1 px-3">
          <p className="px-4 text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
            System
          </p>
          <NavLink
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <Home className="w-5 h-5 text-white/40" />
            <span className="font-medium">Dashboard</span>
          </NavLink>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all">
            <Settings className="w-5 h-5 text-white/40" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] p-[2px]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
              <span className="text-xs font-bold text-white">USR</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Producer</p>
            <p className="text-xs text-white/40 truncate">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

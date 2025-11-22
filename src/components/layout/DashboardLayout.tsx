import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function DashboardLayout() {
  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Sidebar */}
      <Sidebar className="hidden md:flex shrink-0" />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gradient-to-br from-gray-900 to-black relative">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[120px]" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="container mx-auto p-6 md:p-8 max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

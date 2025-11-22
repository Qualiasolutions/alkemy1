import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ProjectList } from './components/dashboard/ProjectList'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { AssetsPhase } from './pages/AssetsPhase'
import { ScriptPhase } from './pages/ScriptPhase'

const StagePhase = () => (
  <div className="space-y-4">
    <h2 className="text-3xl font-bold text-white">Stage Phase</h2>
    <p className="text-white/60">Block out your scenes in 3D.</p>
    <div className="aspect-video border border-white/10 rounded-xl bg-black/40 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]" />
      <span className="text-green-400 font-mono z-10">3D Viewport</span>
    </div>
  </div>
)

const CompositePhase = () => (
  <div className="space-y-4">
    <h2 className="text-3xl font-bold text-white">Composite Phase</h2>
    <p className="text-white/60">Render high-fidelity images.</p>
    <div className="p-6 border border-white/10 rounded-xl bg-white/5">
      <p className="text-pink-400 font-mono">Image Generation Controls</p>
    </div>
  </div>
)

const TimelinePhase = () => (
  <div className="space-y-4">
    <h2 className="text-3xl font-bold text-white">Timeline Phase</h2>
    <p className="text-white/60">Assemble your final video.</p>
    <div className="h-32 border border-white/10 rounded-xl bg-white/5 flex items-center justify-center">
      <p className="text-yellow-400 font-mono">Timeline Track</p>
    </div>
  </div>
)

import { CreateProjectDialog } from './components/dashboard/CreateProjectDialog'

const DashboardHome = () => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white tracking-tight">Welcome back, Producer.</h1>
        <p className="text-xl text-white/60">Select a project to continue production.</p>
      </div>
      <CreateProjectDialog />
    </div>

    <ProjectList />
  </div>
)

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes (Login, etc.) could go here */}

        {/* Protected Dashboard Routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />

          {/* Project Routes */}
          <Route path="project/:id">
            <Route index element={<Navigate to="script" replace />} />
            <Route path="script" element={<ScriptPhase />} />
            <Route path="assets" element={<AssetsPhase />} />
            <Route path="stage" element={<StagePhase />} />
            <Route path="composite" element={<CompositePhase />} />
            <Route path="timeline" element={<TimelinePhase />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster theme="dark" position="bottom-right" />
    </Router>
  )
}

export default App

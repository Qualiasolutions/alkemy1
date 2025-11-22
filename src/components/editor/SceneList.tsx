import { Film, Users } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type Scene } from '@/services/scriptAnalysisService'

interface SceneListProps {
  scenes: Scene[]
}

export function SceneList({ scenes }: SceneListProps) {
  if (!scenes || scenes.length === 0) {
    return (
      <div className="text-center py-10 text-white/40">
        <p>No scenes analyzed yet.</p>
        <p className="text-xs mt-2">Click "Analyze Script" to generate a breakdown.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)] pr-4">
      <div className="space-y-4">
        {scenes.map((scene) => (
          <div
            key={scene.id}
            className="bg-black/40 border border-white/10 rounded-lg p-4 hover:border-[var(--color-accent-primary)] transition-colors group"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-bold text-white group-hover:text-[var(--color-accent-primary)] transition-colors">
                {scene.number}. {scene.heading}
              </h4>
            </div>
            
            <p className="text-sm text-white/60 mb-3 line-clamp-2">
              {scene.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-white/40">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{scene.characters.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Film className="w-3 h-3" />
                <span>{scene.shots.length} Shots</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

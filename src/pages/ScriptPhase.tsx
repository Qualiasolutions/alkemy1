import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BrainCircuit, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { SceneList } from '@/components/editor/SceneList'
import { ScriptEditor } from '@/components/editor/ScriptEditor'
import { Button } from '@/components/ui/button'
import { type Project, projectService } from '@/services/projectService'
import { type Scene, scriptAnalysisService } from '@/services/scriptAnalysisService'

export function ScriptPhase() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)


  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (content: string) =>
      projectService.updateProject(id!, { script_content: content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
    },
    onError: (error) => {
      console.error('Failed to save script:', error)
      toast.error('Failed to save script')
    },
    onSettled: () => {
      setIsSaving(false)
    },
  })

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!project?.script_content) throw new Error('No script content')
      const scenes = await scriptAnalysisService.analyzeScript(project.script_content)
      await scriptAnalysisService.saveAnalysis(id!, scenes)
      return scenes
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('Script analysis complete!')
    },
    onError: (error) => {
      console.error('Analysis failed:', error)
      toast.error('Failed to analyze script')
    },
  })

  // We need a ref to store the timeout ID to clear it, but for simplicity in this MVP
  // we'll just let the ScriptEditor call onUpdate, and we'll handle the debounce there or here.
  // Actually, let's implement a proper debounce here.

  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const onEditorUpdate = (content: string) => {
    if (!id) return
    if (timeoutId) clearTimeout(timeoutId)

    setIsSaving(true) // Show saving immediately to indicate pending save
    const newTimeoutId = setTimeout(() => {
      updateMutation.mutate(content)
    }, 2000)

    setTimeoutId(newTimeoutId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[var(--color-accent-primary)] animate-spin" />
      </div>
    )
  }

  if (!project) {
    return <div className="text-white">Project not found</div>
  }

  return (
    <div className="h-[calc(100vh-100px)] grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
      {/* Editor Section */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Script Phase</h2>
            <p className="text-white/60">Write your screenplay. AI will break it down.</p>
          </div>
          <Button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending || !project?.script_content}
            className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-black font-bold shadow-[var(--shadow-glow)]"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4 mr-2" />
                Analyze Script
              </>
            )}
          </Button>
        </div>

        <div className="flex-1 min-h-0">
          <ScriptEditor
            content={project?.script_content || ''}
            onUpdate={onEditorUpdate}
            isSaving={isSaving}
          />
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="bg-black/20 border-l border-white/5 p-6 flex flex-col">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-[var(--color-accent-primary)]" />
          AI Breakdown
        </h3>
        <SceneList scenes={(project?.script_analysis as unknown as Scene[]) || []} />
      </div>
    </div>
  )
}

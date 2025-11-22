import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Folder, MoreVertical, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { projectService } from '@/services/projectService'
import { CreateProjectDialog } from './CreateProjectDialog'

export function ProjectList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const deleteMutation = useMutation({
    mutationFn: projectService.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted')
    },
    onError: (error) => {
      console.error('Failed to delete project:', error)
      toast.error('Failed to delete project')
    },
  })

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this project?')) return
    deleteMutation.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
        <Folder className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">No projects yet</h3>
        <p className="text-white/40 mb-6">Create your first video production project to get started.</p>
        <CreateProjectDialog onProjectCreated={() => queryClient.invalidateQueries({ queryKey: ['projects'] })} />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="group bg-black/40 border-white/10 hover:border-[var(--color-accent-primary)] transition-all duration-300 hover:shadow-[var(--shadow-glow)] cursor-pointer overflow-hidden"
          onClick={() => navigate(`/project/${project.id}/script`)}
        >
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <CardTitle className="text-lg font-bold text-white group-hover:text-[var(--color-accent-primary)] transition-colors truncate pr-4">
              {project.title}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mr-2 text-white/40 hover:text-white hover:bg-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[var(--color-surface-elevated)] border-white/10 text-white">
                <DropdownMenuItem
                  className="text-[var(--color-error)] focus:text-[var(--color-error)] focus:bg-[var(--color-error)]/10 cursor-pointer"
                  onClick={(e) => handleDelete(e, project.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-lg bg-gradient-to-br from-white/5 to-white/10 mb-4 flex items-center justify-center group-hover:from-[var(--color-accent-primary)]/10 group-hover:to-purple-500/10 transition-colors">
              <Folder className="w-8 h-8 text-white/20 group-hover:text-[var(--color-accent-primary)] transition-colors" />
            </div>
          </CardContent>
          <CardFooter className="text-xs text-white/40 border-t border-white/5 pt-4 flex justify-between">
            <span>Edited {formatDistanceToNow(new Date(project.updated_at || project.created_at || new Date()), { addSuffix: true })}</span>
            <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
              Draft
            </span>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

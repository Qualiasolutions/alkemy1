import {
  AlertCircle,
  AlertTriangle,
  Archive,
  Calendar,
  FileText,
  Trash2,
  Undo2,
} from 'lucide-react'
import { useState } from 'react'
import { getProjectService } from '@/services/projectService'
import type { Project } from '@/types'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  onDelete: (projectIds: string[], permanent: boolean) => void
  mode?: 'soft' | 'permanent' | 'empty-trash'
}

export default function DeleteConfirmationDialog({
  isOpen,
  onClose,
  projects,
  onDelete,
  mode = 'soft',
}: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [permanentDelete, setPermanentDelete] = useState(mode === 'permanent')
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const projectService = getProjectService()

  const isSingleProject = projects.length === 1
  const requiresConfirmation = mode === 'permanent' || mode === 'empty-trash' || permanentDelete
  const confirmationWord = mode === 'empty-trash' ? 'EMPTY' : 'DELETE'

  const handleDelete = async () => {
    if (requiresConfirmation && confirmText !== confirmationWord) {
      setError(`Please type "${confirmationWord}" to confirm`)
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const projectIds = projects.map((p) => p.id)

      if (mode === 'empty-trash') {
        // Empty trash - permanently delete all deleted projects
        const { error } = await projectService.emptyTrash(projects[0]?.user_id || '')
        if (error) throw error
      } else if (mode === 'permanent' || permanentDelete) {
        // Permanent delete
        if (isSingleProject) {
          const { error } = await projectService.permanentlyDeleteProject(projectIds[0])
          if (error) throw error
        } else {
          // Bulk permanent delete
          for (const id of projectIds) {
            const { error } = await projectService.permanentlyDeleteProject(id)
            if (error) console.error(`Failed to delete project ${id}:`, error)
          }
        }
      } else {
        // Soft delete (move to trash)
        if (isSingleProject) {
          const { error } = await projectService.softDeleteProject(projectIds[0])
          if (error) throw error

          await projectService.logActivity(projectIds[0], 'deleted', {
            softDelete: true,
            title: projects[0].title,
          })
        } else {
          const { error } = await projectService.bulkDeleteProjects(projectIds)
          if (error) throw error
        }
      }

      onDelete(projectIds, mode === 'permanent' || permanentDelete)
      onClose()
    } catch (err) {
      console.error('Error deleting project(s):', err)
      setError(err instanceof Error ? err.message : 'Failed to delete project(s)')
    } finally {
      setIsDeleting(false)
    }
  }

  const getDialogTitle = () => {
    if (mode === 'empty-trash') return 'Empty Trash'
    if (mode === 'permanent') return 'Permanently Delete Project'
    if (permanentDelete) return 'Permanently Delete Project'
    return isSingleProject ? 'Delete Project' : `Delete ${projects.length} Projects`
  }

  const getDialogDescription = () => {
    if (mode === 'empty-trash') {
      return 'This will permanently delete all projects in the trash. This action cannot be undone.'
    }

    if (mode === 'permanent' || permanentDelete) {
      return isSingleProject
        ? 'This will permanently delete the project and all associated data. This action cannot be undone.'
        : `This will permanently delete ${projects.length} projects and all associated data. This action cannot be undone.`
    }

    return isSingleProject
      ? 'This will move the project to trash. You can restore it within 30 days.'
      : `This will move ${projects.length} projects to trash. You can restore them within 30 days.`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'permanent' || permanentDelete ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Details */}
          {isSingleProject && projects[0] && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{projects[0].title}</p>
                  {projects[0].description && (
                    <p className="text-sm text-muted-foreground mt-1">{projects[0].description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created: {new Date(projects[0].created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Updated: {new Date(projects[0].updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Multiple Projects List */}
          {!isSingleProject && (
            <div className="max-h-[200px] overflow-y-auto space-y-2 bg-muted p-3 rounded-lg">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{project.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Soft Delete Options */}
          {mode === 'soft' && !permanentDelete && (
            <Alert>
              <Archive className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Projects will be moved to trash</p>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <Undo2 className="h-3 w-3" />
                    Can be restored within 30 days
                  </li>
                  <li className="flex items-center gap-2">
                    <Trash2 className="h-3 w-3" />
                    Automatically deleted after 30 days
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Permanent Delete Warning */}
          {(mode === 'permanent' || permanentDelete || mode === 'empty-trash') && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">⚠️ This action cannot be undone!</p>
                <p className="text-sm">
                  All project data including scripts, generated media, and settings will be
                  permanently deleted.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Permanent Delete Option (for soft delete mode) */}
          {mode === 'soft' && (
            <div className="flex items-start gap-2">
              <Checkbox
                id="permanent"
                checked={permanentDelete}
                onCheckedChange={(checked) => setPermanentDelete(checked as boolean)}
                disabled={isDeleting}
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="permanent"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Delete permanently
                </label>
                <p className="text-sm text-muted-foreground">
                  Skip trash and delete immediately (cannot be undone)
                </p>
              </div>
            </div>
          )}

          {/* Confirmation Input */}
          {requiresConfirmation && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Type <span className="font-mono font-bold">{confirmationWord}</span> to confirm:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder={`Type ${confirmationWord} here`}
                disabled={isDeleting}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant={mode === 'permanent' || permanentDelete ? 'destructive' : 'default'}
            onClick={handleDelete}
            disabled={isDeleting || (requiresConfirmation && confirmText !== confirmationWord)}
            className="min-w-[100px]"
          >
            {isDeleting ? (
              <>Deleting...</>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {mode === 'empty-trash'
                  ? 'Empty Trash'
                  : mode === 'permanent' || permanentDelete
                    ? 'Delete Permanently'
                    : 'Move to Trash'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

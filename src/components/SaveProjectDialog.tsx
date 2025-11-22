import { AlertCircle, Calendar, Check, Copy, FileText, Save, SaveAll, Tag } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { getProjectService } from '@/services/projectService'
import type { Project } from '@/types'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'

interface SaveProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  mode: 'save' | 'save-as'
  onSave: (project: Project) => void
}

export default function SaveProjectDialog({
  isOpen,
  onClose,
  project,
  mode,
  onSave,
}: SaveProjectDialogProps) {
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const projectService = getProjectService()

  useEffect(() => {
    if (project && isOpen) {
      setProjectName(mode === 'save-as' ? `${project.title} (Copy)` : project.title)
      setDescription(project.description || '')
      setTags(project.tags || [])
      setError(null)
      setSaveSuccess(false)
    }
  }, [project, isOpen, mode])

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSave = async () => {
    if (!project) return

    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (mode === 'save') {
        // Regular save - update existing project
        const { error } = await projectService.updateProject(project.id, {
          title: projectName,
          description,
          tags,
        })

        if (error) throw error

        // Update the project object and notify parent
        const updatedProject = {
          ...project,
          title: projectName,
          description,
          tags,
        }

        await projectService.logActivity(project.id, 'manual_saved', {
          title: projectName,
          description,
          tags,
        })

        onSave(updatedProject)
        setSaveSuccess(true)

        // Close dialog after a brief success message
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        // Save As - create a copy with new name
        const { project: newProject, error } = await projectService.saveAs(project.id, projectName)

        if (error) throw error
        if (!newProject) throw new Error('Failed to create project copy')

        // Update metadata for the new copy
        await projectService.updateProjectMetadata(newProject.id, {
          description,
          tags,
        })

        await projectService.logActivity(newProject.id, 'duplicated', {
          originalId: project.id,
          originalTitle: project.title,
        })

        onSave(newProject)
        setSaveSuccess(true)

        // Close dialog after a brief success message
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (err) {
      console.error('Error saving project:', err)
      setError(err instanceof Error ? err.message : 'Failed to save project')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'save' ? (
              <>
                <Save className="h-5 w-5" />
                Save Project
              </>
            ) : (
              <>
                <SaveAll className="h-5 w-5" />
                Save As New Project
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'save'
              ? 'Update your project details and save changes'
              : 'Create a copy of this project with a new name'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Project Name */}
          <div className="grid gap-2">
            <Label htmlFor="project-name" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Project Name
            </Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className={error && !projectName.trim() ? 'border-red-500' : ''}
              disabled={isSaving}
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for your project"
              rows={3}
              disabled={isSaving}
            />
          </div>

          {/* Tags */}
          <div className="grid gap-2">
            <Label htmlFor="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a tag and press Enter"
                disabled={isSaving}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="outline"
                disabled={isSaving || !tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                    onClick={() => !isSaving && handleRemoveTag(tag)}
                  >
                    {tag}
                    {!isSaving && <span className="ml-1">×</span>}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Project Info */}
          {project && (
            <div className="text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Updated: {new Date(project.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Success Message */}
          {saveSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              {mode === 'save' ? 'Project saved successfully!' : 'Project copied successfully!'}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !projectName.trim()}
            className="min-w-[100px]"
          >
            {isSaving ? (
              <>Saving...</>
            ) : mode === 'save' ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Save As
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

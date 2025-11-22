import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import {
  Archive,
  Download,
  FileText,
  FolderOpen,
  Grid,
  Layout,
  List,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getProjectService, type ProjectTemplate } from '@/services/projectService'
import { useTheme } from '@/theme/ThemeContext'
import type { Project, ProjectFilter } from '@/types'
import Button from './Button'
import DeleteConfirmationDialog from './DeleteConfirmationDialog'

interface ProjectSelectorModalEnhancedProps {
  isOpen: boolean
  onClose: () => void
  onSelectProject: (project: Project) => void
  onCreateProject?: () => void
  currentProjectId?: string
}

type TabType = 'projects' | 'trash' | 'templates'
type ViewMode = 'grid' | 'list'

const ProjectSelectorModalEnhanced: React.FC<ProjectSelectorModalEnhancedProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  onCreateProject,
  currentProjectId,
}) => {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [activeTab, setActiveTab] = useState<TabType>('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([])
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created' | 'accessed'>('accessed')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteMode, setDeleteMode] = useState<'soft' | 'permanent' | 'empty-trash'>('soft')
  const [projectsToDelete, setProjectsToDelete] = useState<Project[]>([])

  const projectService = getProjectService()

  useEffect(() => {
    if (!isOpen || !user) return
    loadData()
  }, [isOpen, user, loadData])

  const loadData = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'projects') {
        const filter: ProjectFilter = {
          includeDeleted: false,
          sortBy,
          sortOrder: 'desc',
        }
        const { projects, error } = await projectService.getProjects(user?.id, filter)
        if (error) throw error
        setProjects(projects || [])
      } else if (activeTab === 'trash') {
        const { projects, error } = await projectService.getDeletedProjects(user?.id)
        if (error) throw error
        setDeletedProjects(projects || [])
      } else if (activeTab === 'templates') {
        const { templates, error } = await projectService.getTemplates(true)
        if (error) throw error
        setTemplates(templates || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredItems = () => {
    const searchLower = searchQuery.toLowerCase()

    if (activeTab === 'projects') {
      return projects.filter(
        (project) =>
          project.title.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          project.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      )
    } else if (activeTab === 'trash') {
      return deletedProjects.filter(
        (project) =>
          project.title.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower)
      )
    } else {
      return templates.filter(
        (template) =>
          template.name.toLowerCase().includes(searchLower) ||
          template.description.toLowerCase().includes(searchLower) ||
          template.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      )
    }
  }

  const handleSelectProject = async (project: Project) => {
    if (activeTab === 'trash') {
      // Don't select deleted projects, show restore option instead
      return
    }
    onSelectProject(project)
    onClose()
  }

  const handleCreateFromTemplate = async (template: ProjectTemplate) => {
    try {
      const name = prompt('Enter a name for your new project:', `New ${template.name}`)
      if (!name) return

      const { project, error } = await projectService.createProjectFromTemplate(template.id, name)
      if (error) throw error
      if (project) {
        onSelectProject(project)
        onClose()
      }
    } catch (error) {
      console.error('Failed to create project from template:', error)
    }
  }

  const handleDeleteProjects = (permanent: boolean = false) => {
    const selected =
      activeTab === 'trash'
        ? deletedProjects.filter((p) => selectedProjects.includes(p.id))
        : projects.filter((p) => selectedProjects.includes(p.id))

    if (selected.length === 0) return

    setProjectsToDelete(selected)
    setDeleteMode(activeTab === 'trash' ? 'permanent' : permanent ? 'permanent' : 'soft')
    setShowDeleteDialog(true)
  }

  const handleDeleteComplete = (_projectIds: string[], _permanent: boolean) => {
    setSelectedProjects([])
    loadData() // Reload the data
  }

  const handleRestoreProjects = async () => {
    if (selectedProjects.length === 0) return

    try {
      const { error } = await projectService.bulkRestoreProjects(selectedProjects)
      if (error) throw error
      setSelectedProjects([])
      loadData()
    } catch (error) {
      console.error('Failed to restore projects:', error)
    }
  }

  const handleEmptyTrash = () => {
    setDeleteMode('empty-trash')
    setProjectsToDelete(deletedProjects)
    setShowDeleteDialog(true)
  }

  const handleBulkExport = async () => {
    if (selectedProjects.length === 0) return

    try {
      const { data, error } = await projectService.bulkExportProjects(selectedProjects)
      if (error) throw error

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `alkemy-projects-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export projects:', error)
    }
  }

  const toggleSelection = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    )
  }

  const toggleSelectAll = () => {
    const items = getFilteredItems()
    if (selectedProjects.length === items.length) {
      setSelectedProjects([])
    } else {
      setSelectedProjects(items.map((item: any) => item.id))
    }
  }

  if (!isOpen) return null

  const filteredItems = getFilteredItems()
  const hasSelection = selectedProjects.length > 0

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-5xl max-h-[85vh] bg-white dark:bg-[#161616] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2A2A2A] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2A2A2A]">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project Manager</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'projects'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-300'
                }`}
              >
                <FolderOpen className="inline-block w-4 h-4 mr-2" />
                Projects
              </button>
              <button
                onClick={() => setActiveTab('trash')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'trash'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-300'
                }`}
              >
                <Trash2 className="inline-block w-4 h-4 mr-2" />
                Trash
                {deletedProjects.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                    {deletedProjects.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'templates'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-300'
                }`}
              >
                <Layout className="inline-block w-4 h-4 mr-2" />
                Templates
              </button>
            </div>

            {/* Search and Actions Bar */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#0B0B0B] border border-gray-300 dark:border-[#2A2A2A] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>

              <div className="flex gap-2">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-[#0B0B0B] rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-[#2A2A2A] shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-[#2A2A2A] shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-gray-50 dark:bg-[#0B0B0B] border border-gray-300 dark:border-[#2A2A2A] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="accessed">Last Opened</option>
                  <option value="created">Date Created</option>
                  <option value="updated">Last Modified</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {hasSelection && activeTab !== 'templates' && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{selectedProjects.length} selected</span>
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400"
                  >
                    {selectedProjects.length === filteredItems.length
                      ? 'Deselect all'
                      : 'Select all'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === 'projects' && (
                    <>
                      <Button size="sm" variant="ghost" onClick={handleBulkExport}>
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteProjects(false)}>
                        <Archive className="w-4 h-4 mr-1" />
                        Move to Trash
                      </Button>
                    </>
                  )}
                  {activeTab === 'trash' && (
                    <>
                      <Button size="sm" variant="ghost" onClick={handleRestoreProjects}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteProjects(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Forever
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500">
                  {activeTab === 'trash' ? (
                    <Archive className="w-full h-full" />
                  ) : activeTab === 'templates' ? (
                    <Layout className="w-full h-full" />
                  ) : (
                    <FolderOpen className="w-full h-full" />
                  )}
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {searchQuery ? `No ${activeTab} found` : `No ${activeTab} yet`}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : activeTab === 'trash'
                      ? 'Deleted projects will appear here'
                      : activeTab === 'templates'
                        ? 'Create templates from your projects'
                        : 'Create your first project to get started'}
                </p>
                {activeTab === 'projects' && onCreateProject && (
                  <Button onClick={onCreateProject} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item: any) => {
                  const isProject = 'user_id' in item
                  const isSelected = selectedProjects.includes(item.id)
                  const isActive = isProject && item.id === currentProjectId
                  const isDeleted = isProject && item.deleted_at

                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        isProject ? handleSelectProject(item) : handleCreateFromTemplate(item)
                      }
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isActive
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                          : isSelected
                            ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10'
                            : isDeleted
                              ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                              : 'border-gray-200 dark:border-[#2A2A2A] hover:border-gray-300 dark:hover:border-[#3A3A3A]'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      {isProject && activeTab !== 'templates' && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSelection(item.id)
                          }}
                          className="absolute top-2 left-2"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4"
                          />
                        </div>
                      )}

                      {/* Status Badges */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {isActive && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500 text-black">
                            Active
                          </span>
                        )}
                        {isDeleted && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500 text-white">
                            Deleted
                          </span>
                        )}
                        {!isProject && (item as ProjectTemplate).isSystem && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500 text-white">
                            System
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 mt-6">
                        {isProject ? item.title : item.name}
                      </h3>

                      {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.tags.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-[#2A2A2A] rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="px-2 py-0.5 text-xs text-gray-500">
                              +{item.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                        <span>
                          {isProject
                            ? `Updated ${formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}`
                            : `Used ${item.usageCount} times`}
                        </span>
                      </div>

                      {isDeleted && item.permanently_delete_at && (
                        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                          Auto-deletes in{' '}
                          {formatDistanceToNow(new Date(item.permanently_delete_at))}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              // List View
              <div className="space-y-2">
                {filteredItems.map((item: any) => {
                  const isProject = 'user_id' in item
                  const isSelected = selectedProjects.includes(item.id)
                  const isActive = isProject && item.id === currentProjectId
                  const isDeleted = isProject && item.deleted_at

                  return (
                    <div
                      key={item.id}
                      onClick={() =>
                        isProject ? handleSelectProject(item) : handleCreateFromTemplate(item)
                      }
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                        isActive
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500'
                          : isSelected
                            ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-400'
                            : 'hover:bg-gray-50 dark:hover:bg-[#1A1A1A] border border-transparent'
                      }`}
                    >
                      {isProject && activeTab !== 'templates' && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleSelection(item.id)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="mr-3"
                        />
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{isProject ? item.title : item.name}</span>
                          {isActive && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-500 text-black rounded-full">
                              Active
                            </span>
                          )}
                          {isDeleted && (
                            <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                              Deleted
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>

                      <div className="text-sm text-gray-500">
                        {isProject
                          ? formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })
                          : `${item.usageCount} uses`}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#0B0B0B]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredItems.length} {activeTab === 'templates' ? 'template' : 'project'}
                {filteredItems.length !== 1 ? 's' : ''}
                {activeTab === 'trash' && deletedProjects.length > 0 && (
                  <button
                    onClick={handleEmptyTrash}
                    className="ml-4 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Empty Trash
                  </button>
                )}
              </p>
              <div className="flex gap-2">
                {onCreateProject && activeTab === 'projects' && (
                  <Button onClick={onCreateProject} variant="default">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                )}
                <Button onClick={onClose} variant="secondary">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        projects={projectsToDelete}
        onDelete={handleDeleteComplete}
        mode={deleteMode}
      />
    </>
  )
}

export default ProjectSelectorModalEnhanced

import type React from 'react'
import type { MoodboardTemplate } from '../types'
import Button from './Button'
import CompactMoodboardCard from './CompactMoodboardCard'
import { PlusIcon, RefreshCwIcon, SearchIcon } from './icons/Icons'

interface CompactMoodboardHeaderProps {
  moodboardTemplates: MoodboardTemplate[]
  activeId: string | null
  onSetActiveId: (id: string) => void
  onAddTemplate: () => void
  onDeleteTemplate: (id: string) => void
  getCoverImageUrl: (template: MoodboardTemplate) => string | null
  onWebSearch: () => void
  onRegenerateAI: () => void
  canRegenerate: boolean
  isGeneratingSummary: boolean
}

const CompactMoodboardHeader: React.FC<CompactMoodboardHeaderProps> = ({
  moodboardTemplates,
  activeId,
  onSetActiveId,
  onAddTemplate,
  onDeleteTemplate,
  getCoverImageUrl,
  onWebSearch,
  onRegenerateAI,
  canRegenerate,
  isGeneratingSummary,
}) => {
  return (
    <div className="border-b border-gray-800 bg-gray-900/50 px-4 py-3">
      <div className="flex justify-between items-start gap-4">
        {/* Compact Moodboards Grid */}
        <div className="flex gap-3 overflow-x-auto pb-2 flex-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {moodboardTemplates.map((template) => (
            <CompactMoodboardCard
              key={template.id}
              template={template}
              isActive={template.id === activeId}
              onSelect={onSetActiveId}
              onDelete={onDeleteTemplate}
              getCoverImageUrl={getCoverImageUrl}
            />
          ))}

          {/* New Moodboard Button */}
          <button
            onClick={onAddTemplate}
            className="flex-shrink-0 w-32 h-32 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center hover:border-gray-600 hover:bg-gray-900/50 transition-colors cursor-pointer bg-gray-900/30"
          >
            <div className="flex flex-col items-center gap-2">
              <PlusIcon className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">New</span>
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            onClick={onWebSearch}
            className="!px-3 !py-2 !text-sm border-gray-700 hover:bg-gray-800"
          >
            <SearchIcon className="w-3 h-3 mr-1" />
            Web
          </Button>
          <Button
            variant="secondary"
            onClick={onRegenerateAI}
            disabled={!canRegenerate || isGeneratingSummary}
            className="!px-3 !py-2 !text-sm border-gray-700 hover:bg-gray-800"
          >
            <RefreshCwIcon
              className={`w-3 h-3 mr-1 ${isGeneratingSummary ? 'animate-spin' : ''}`}
            />
            {isGeneratingSummary ? '...' : 'AI'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CompactMoodboardHeader

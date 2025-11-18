import React from 'react';
import { Trash2Icon, SparklesIcon } from './icons/Icons';
import { MoodboardTemplate } from '../types';

interface CompactMoodboardCardProps {
  template: MoodboardTemplate;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  getCoverImageUrl: (template: MoodboardTemplate) => string | null;
}

const MAX_ITEMS = 20;

const CompactMoodboardCard: React.FC<CompactMoodboardCardProps> = ({
  template,
  isActive,
  onSelect,
  onDelete,
  getCoverImageUrl
}) => {
  const coverUrl = getCoverImageUrl(template);
  const itemCount = template.items.length;
  const fillPercentage = (itemCount / MAX_ITEMS) * 100;

  return (
    <button
      onClick={() => onSelect(template.id)}
      className={`flex-shrink-0 w-32 h-32 rounded-lg border-2 p-3 transition-all cursor-pointer group relative overflow-hidden ${
        isActive
          ? 'border-[#dfec2d] bg-[#dfec2d]/5'
          : 'border-gray-700 bg-gray-900/30 hover:border-gray-600 hover:bg-gray-900/50'
      }`}
    >
      <div className="relative h-full flex flex-col justify-between">
        {/* Header with title and delete */}
        <div className="flex justify-between items-start gap-1">
          <h3 className="text-xs font-medium text-gray-200 line-clamp-2 text-left leading-tight">
            {template.title}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(template.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 rounded hover:bg-red-500/20"
          >
            <Trash2Icon className="w-3 h-3 text-gray-400 hover:text-red-400" />
          </button>
        </div>

        {/* Center content - cover image or placeholder */}
        <div className="flex-1 flex items-center justify-center my-2">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={template.title}
              className="w-full h-12 object-cover rounded"
            />
          ) : (
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 rounded bg-gray-800 flex items-center justify-center">
                <span className="text-xs text-gray-500">📷</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom info */}
        <div className="space-y-1">
          {/* Image count and AI indicator */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {itemCount}/{MAX_ITEMS}
            </span>
            {template.aiSummary && (
              <SparklesIcon className="w-3 h-3 text-purple-400" />
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                itemCount >= MAX_ITEMS
                  ? 'bg-yellow-500'
                  : isActive
                  ? 'bg-[#dfec2d]'
                  : 'bg-gray-600'
              }`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
};

export default CompactMoodboardCard;
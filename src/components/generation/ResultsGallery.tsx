import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'
import { useState } from 'react'
import { GlowCard } from '@/components/ui/spotlight-card'
import { useTheme } from '@/theme/ThemeContext'

export interface GalleryItem {
  id: string
  url: string
  title: string
  description?: string
  metadata?: {
    prompt?: string
    consistency_score?: number
    quality?: string
    generated_at?: string
    [key: string]: any
  }
  type: 'image' | 'video' | '3d'
}

interface ResultsGalleryProps {
  items: GalleryItem[]
  onItemClick?: (item: GalleryItem) => void
  onItemDelete?: (itemId: string) => void
  onItemDownload?: (item: GalleryItem) => void
  layout?: 'grid' | 'masonry'
  columns?: 2 | 3 | 4
  emptyMessage?: string
  className?: string
}

const ResultsGallery: React.FC<ResultsGalleryProps> = ({
  items,
  onItemClick,
  onItemDelete,
  onItemDownload,
  layout = 'grid',
  columns = 3,
  emptyMessage = 'No results yet. Start generating!',
  className = '',
}) => {
  const { colors } = useTheme()
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null)

  const handleItemClick = (item: GalleryItem) => {
    setSelectedItem(item)
    onItemClick?.(item)
  }

  const handleDownload = (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation()
    onItemDownload?.(item)
  }

  const handleDelete = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Delete this result?')) {
      onItemDelete?.(itemId)
      if (selectedItem?.id === itemId) {
        setSelectedItem(null)
      }
    }
  }

  if (items.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed ${className}`}
        style={{ borderColor: colors.border_color }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.text_tertiary}
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </motion.div>
        <p className="mt-4 text-center" style={{ color: colors.text_secondary }}>
          {emptyMessage}
        </p>
      </div>
    )
  }

  const gridColumns = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <>
      <div
        className={`${layout === 'grid' ? `grid ${gridColumns[columns]} gap-4` : 'flex flex-col gap-4'} ${className}`}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            className="relative group cursor-pointer"
            onClick={() => handleItemClick(item)}
            onMouseEnter={() => setHoveredItemId(item.id)}
            onMouseLeave={() => setHoveredItemId(null)}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <GlowCard glowColor="purple" customSize={true} className="w-full !p-0 overflow-hidden">
              {/* Image/Preview */}
              <div className="relative w-full aspect-square overflow-hidden">
                <img src={item.url} alt={item.title} className="w-full h-full object-cover" />

                {/* Overlay on Hover */}
                <AnimatePresence>
                  {hoveredItemId === item.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/70 flex items-center justify-center gap-3"
                    >
                      {onItemDownload && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleDownload(item, e)}
                          className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition"
                          title="Download"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                          </svg>
                        </motion.button>
                      )}
                      {onItemDelete && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-2 rounded-full bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 transition"
                          title="Delete"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#F04438"
                            strokeWidth="2"
                          >
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Type Badge */}
                <div className="absolute top-2 right-2">
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold uppercase"
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      color: '#fff',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {item.type}
                  </span>
                </div>

                {/* Consistency Score */}
                {item.metadata?.consistency_score && (
                  <div className="absolute bottom-2 left-2">
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold"
                      style={{
                        background: 'rgba(16, 163, 127, 0.2)',
                        color: colors.accent_primary,
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      {item.metadata.consistency_score.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h4
                  className="font-semibold text-sm truncate"
                  style={{ color: colors.text_primary }}
                >
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: colors.text_tertiary }}>
                    {item.description}
                  </p>
                )}
                {item.metadata?.generated_at && (
                  <p className="text-xs mt-2" style={{ color: colors.text_tertiary }}>
                    {new Date(item.metadata.generated_at).toLocaleString()}
                  </p>
                )}
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* Lightbox/Detail View */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-6xl w-full rounded-xl overflow-hidden"
              style={{ background: colors.surface_card }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* Image */}
              <div className="w-full max-h-[70vh] overflow-hidden">
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Details */}
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2" style={{ color: colors.text_primary }}>
                  {selectedItem.title}
                </h3>
                {selectedItem.description && (
                  <p className="mb-4" style={{ color: colors.text_secondary }}>
                    {selectedItem.description}
                  </p>
                )}

                {/* Metadata */}
                {selectedItem.metadata && (
                  <div
                    className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t"
                    style={{ borderColor: colors.border_color }}
                  >
                    {Object.entries(selectedItem.metadata).map(([key, value]) => (
                      <div key={key}>
                        <p
                          className="text-xs font-semibold uppercase mb-1"
                          style={{ color: colors.text_tertiary }}
                        >
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm font-mono" style={{ color: colors.text_secondary }}>
                          {typeof value === 'number' ? value.toFixed(2) : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ResultsGallery

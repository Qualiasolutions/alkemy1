import { motion } from 'framer-motion'
import type React from 'react'
import { useEffect, useState } from 'react'
import type { Generation } from '../types'
import Button from './Button'
import {
  AlkemyLoadingIcon,
  CheckIcon,
  DownloadIcon,
  PlayIcon,
  RefreshCwIcon,
  XIcon,
} from './icons/Icons'

interface VideoFullscreenViewProps {
  videos: Generation[]
  isGenerating: boolean
  generationProgress?: number
  onClose?: () => void
  onSelectVideo?: (video: Generation) => void
  onRegenerateVideo?: (video: Generation) => void
  className?: string
  showSidebar?: boolean // Whether to account for the sidebar
}

const VideoFullscreenView: React.FC<VideoFullscreenViewProps> = ({
  videos,
  isGenerating,
  generationProgress = 0,
  onClose,
  onSelectVideo,
  onRegenerateVideo,
  className = '',
  showSidebar = true,
}) => {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0)
  const [isPlaying, _setIsPlaying] = useState(true)
  const validVideos = videos.filter((v) => v.url && !v.isLoading)
  const currentVideo = validVideos[selectedVideoIndex]

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && selectedVideoIndex > 0) {
        setSelectedVideoIndex((prev) => prev - 1)
      } else if (e.key === 'ArrowDown' && selectedVideoIndex < validVideos.length - 1) {
        setSelectedVideoIndex((prev) => prev + 1)
      } else if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedVideoIndex, validVideos.length, onClose])

  // Calculate layout dimensions
  const sidebarWidth = showSidebar ? 'calc(100vw - 16rem)' : '100vw' // 16rem = 256px sidebar

  return (
    <div
      className={`fixed inset-0 bg-[#0B0B0B] z-40 flex ${showSidebar ? 'ml-64' : ''} ${className}`}
      style={{ width: sidebarWidth }}
    >
      {/* Main Video Display */}
      <div className="flex-1 flex flex-col">
        {/* Header Controls */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-white">Video Generation</h3>
            {validVideos.length > 0 && (
              <div className="text-sm text-gray-400">
                {selectedVideoIndex + 1} of {validVideos.length}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentVideo && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onRegenerateVideo?.(currentVideo)}
                  className="p-2 bg-gray-800/50 backdrop-blur-md rounded-lg text-white hover:bg-gray-700/50 transition-all"
                  title="Regenerate"
                >
                  <RefreshCwIcon className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-gray-800/50 backdrop-blur-md rounded-lg text-white hover:bg-gray-700/50 transition-all"
                  title="Download"
                >
                  <DownloadIcon className="w-5 h-5" />
                </motion.button>
                {onSelectVideo && (
                  <Button
                    onClick={() => onSelectVideo(currentVideo)}
                    variant="primary"
                    className="!py-2 !px-4"
                  >
                    <CheckIcon className="w-4 h-4" />
                    Select Video
                  </Button>
                )}
              </>
            )}
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 bg-gray-800/50 backdrop-blur-md rounded-lg text-white hover:bg-gray-700/50 transition-all"
                title="Close"
              >
                <XIcon className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </header>

        {/* Video Display Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          {currentVideo ? (
            <div className="relative w-full h-full max-w-7xl mx-auto">
              <video
                src={currentVideo.url!}
                controls
                autoPlay={isPlaying}
                loop
                className="w-full h-full object-contain rounded-lg"
                style={{ maxHeight: 'calc(100vh - 12rem)' }}
              />
            </div>
          ) : isGenerating ? (
            <div className="text-center">
              <AlkemyLoadingIcon className="w-16 h-16 mx-auto mb-4 animate-pulse text-teal-500" />
              <p className="text-lg font-semibold text-white mb-2">Generating Video...</p>
              <div className="w-64 mx-auto bg-gray-800 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-teal-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${generationProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {Math.round(generationProgress)}% complete
              </p>
            </div>
          ) : (
            <div className="text-center">
              <PlayIcon className="w-20 h-20 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-semibold">No videos generated yet</p>
              <p className="text-gray-500 text-sm mt-2">Generate a video to view it here</p>
            </div>
          )}
        </div>

        {/* Navigation Hints */}
        {validVideos.length > 1 && (
          <div className="flex-shrink-0 px-6 py-3 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <span>↑/↓ Navigate videos</span>
              <span>ESC Close view</span>
            </div>
          </div>
        )}
      </div>

      {/* Video List Sidebar (Scrollable) */}
      {validVideos.length > 0 && (
        <aside className="w-80 border-l border-gray-800/50 bg-[#0a0a0a] flex flex-col">
          <div className="flex-shrink-0 p-4 border-b border-gray-800/50">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Video List ({validVideos.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {validVideos.map((video, idx) => (
              <motion.div
                key={video.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedVideoIndex(idx)}
                className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  idx === selectedVideoIndex
                    ? 'border-teal-500 shadow-lg shadow-teal-500/30'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <video src={video.url!} className="w-full h-full object-cover" muted />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                  <div className="absolute bottom-2 left-2">
                    <p className="text-xs text-white font-semibold">Video {idx + 1}</p>
                    {idx === selectedVideoIndex && (
                      <p className="text-xs text-teal-400 mt-1">Currently viewing</p>
                    )}
                  </div>
                </div>
                {idx === selectedVideoIndex && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Loading placeholders for videos being generated */}
            {videos
              .filter((v) => v.isLoading)
              .map((video, _idx) => (
                <div
                  key={video.id}
                  className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-800 bg-gray-900/50"
                >
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlkemyLoadingIcon className="w-8 h-8 mx-auto mb-2 animate-pulse text-gray-600" />
                      <p className="text-xs text-gray-500">Generating...</p>
                      {video.progress !== undefined && (
                        <div className="w-24 mx-auto mt-2 bg-gray-800 rounded-full h-1">
                          <div
                            className="bg-teal-500 h-1 rounded-full"
                            style={{ width: `${video.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </aside>
      )}
    </div>
  )
}

export default VideoFullscreenView

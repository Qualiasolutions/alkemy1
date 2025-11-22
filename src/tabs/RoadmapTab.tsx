import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useRef, useState } from 'react'
import Button from '@/components/Button'
import {
  DownloadIcon,
  LinkIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '@/components/icons/Icons'
import { useTheme } from '@/theme/ThemeContext'

export interface RoadmapBlock {
  id: string
  type: 'task' | 'milestone' | 'note' | 'decision'
  title: string
  description: string
  position: { x: number; y: number }
  color: string
  connections: string[] // IDs of connected blocks
}

interface RoadmapTabProps {
  blocks: RoadmapBlock[]
  onUpdateBlocks: (blocks: RoadmapBlock[]) => void
}

const BLOCK_COLORS = [
  { name: 'Emerald', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Yellow', value: '#DFEC2D' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Cyan', value: '#06B6D4' },
]

const BLOCK_TYPES = [
  { id: 'task', label: 'Task', icon: '📋' },
  { id: 'milestone', label: 'Milestone', icon: '🎯' },
  { id: 'note', label: 'Note', icon: '📝' },
  { id: 'decision', label: 'Decision', icon: '🔀' },
]

const RoadmapTab: React.FC<RoadmapTabProps> = ({ blocks, onUpdateBlocks }) => {
  const { isDark } = useTheme()
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isAddingBlock, setIsAddingBlock] = useState(false)
  const [connectMode, setConnectMode] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddBlock = (
    type: 'task' | 'milestone' | 'note' | 'decision',
    position?: { x: number; y: number }
  ) => {
    const newBlock: RoadmapBlock = {
      id: `block-${Date.now()}`,
      type,
      title: `New ${type}`,
      description: '',
      position: position || { x: 100 + blocks.length * 20, y: 100 + blocks.length * 20 },
      color: BLOCK_COLORS[blocks.length % BLOCK_COLORS.length].value,
      connections: [],
    }
    onUpdateBlocks([...blocks, newBlock])
    setSelectedBlock(newBlock.id)
    setIsAddingBlock(false)
  }

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom

    handleAddBlock('note', { x, y })
  }

  const handleBlockMouseDown = (e: React.MouseEvent, blockId: string) => {
    // Don't interfere with text input clicks
    if (
      (e.target as HTMLElement).tagName === 'INPUT' ||
      (e.target as HTMLElement).tagName === 'TEXTAREA'
    ) {
      return
    }

    e.stopPropagation()
    e.preventDefault()

    if (connectMode) {
      if (!connectionStart) {
        setConnectionStart(blockId)
      } else if (connectionStart !== blockId) {
        // Create connection
        const updatedBlocks = blocks.map((block) => {
          if (block.id === connectionStart) {
            return {
              ...block,
              connections: [...new Set([...block.connections, blockId])],
            }
          }
          return block
        })
        onUpdateBlocks(updatedBlocks)
        setConnectionStart(null)
        setConnectMode(false)
      }
      return
    }

    const block = blocks.find((b) => b.id === blockId)
    if (!block) return

    setDraggingBlock(blockId)
    setSelectedBlock(blockId)

    // Calculate offset from the mouse to the block's top-left corner
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const canvasX = (e.clientX - rect.left - pan.x) / zoom
    const canvasY = (e.clientY - rect.top - pan.y) / zoom

    setDragOffset({
      x: canvasX - block.position.x,
      y: canvasY - block.position.y,
    })
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      // Middle mouse button or Shift+Click for panning
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (draggingBlock && !canvasRef.current) {
        setDraggingBlock(null)
        return
      }

      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        })
        return
      }

      if (!draggingBlock || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x
      const y = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y

      const updatedBlocks = blocks.map((block) =>
        block.id === draggingBlock
          ? { ...block, position: { x: Math.max(0, x), y: Math.max(0, y) } }
          : block
      )
      onUpdateBlocks(updatedBlocks)
    },
    [draggingBlock, blocks, dragOffset, onUpdateBlocks, zoom, pan, isPanning, panStart]
  )

  const handleMouseUp = useCallback(() => {
    setDraggingBlock(null)
    setIsPanning(false)
  }, [])

  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const handleUpdateBlock = (id: string, updates: Partial<RoadmapBlock>) => {
    const updatedBlocks = blocks.map((block) =>
      block.id === id ? { ...block, ...updates } : block
    )
    onUpdateBlocks(updatedBlocks)
  }

  const handleDeleteBlock = (id: string) => {
    const updatedBlocks = blocks
      .filter((block) => block.id !== id)
      .map((block) => ({
        ...block,
        connections: block.connections.filter((connId) => connId !== id),
      }))
    onUpdateBlocks(updatedBlocks)
    setSelectedBlock(null)
  }

  const handleDisconnect = (sourceId: string, targetId: string) => {
    const updatedBlocks = blocks.map((block) => {
      if (block.id === sourceId) {
        return {
          ...block,
          connections: block.connections.filter((id) => id !== targetId),
        }
      }
      return block
    })
    onUpdateBlocks(updatedBlocks)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify({ blocks, zoom, pan }, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `roadmap-${new Date().toISOString().split('T')[0]}.json`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.blocks) {
          onUpdateBlocks(data.blocks)
          if (data.zoom) setZoom(data.zoom)
          if (data.pan) setPan(data.pan)
        }
      } catch (error) {
        console.error('Failed to import roadmap:', error)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const selectedBlockData = blocks.find((b) => b.id === selectedBlock)

  const renderConnections = () => {
    return blocks.map((block) => {
      return block.connections.map((targetId) => {
        const target = blocks.find((b) => b.id === targetId)
        if (!target) return null

        const startX = (block.position.x + 125) * zoom + pan.x
        const startY = (block.position.y + 75) * zoom + pan.y
        const endX = (target.position.x + 125) * zoom + pan.x
        const endY = (target.position.y + 75) * zoom + pan.y

        // Calculate control points for curved path
        const midX = (startX + endX) / 2
        const midY = (startY + endY) / 2
        const dx = endX - startX
        const dy = endY - startY
        const offset = 50
        const controlX = midX - (dy * offset) / Math.sqrt(dx * dx + dy * dy)
        const controlY = midY + (dx * offset) / Math.sqrt(dx * dx + dy * dy)

        return (
          <g key={`${block.id}-${targetId}`}>
            <path
              d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
              stroke={block.color}
              strokeWidth="3"
              fill="none"
              markerEnd="url(#arrowhead)"
              className="cursor-pointer hover:stroke-opacity-80"
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm('Disconnect these blocks?')) {
                  handleDisconnect(block.id, targetId)
                }
              }}
            />
          </g>
        )
      })
    })
  }

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6">
      {/* Canvas */}
      <div
        className="flex-1 relative rounded-2xl border border-white/10 overflow-hidden cursor-grab active:cursor-grabbing bg-[#0a0a0a]"
        onDoubleClick={handleCanvasDoubleClick}
        onMouseDown={handleCanvasMouseDown}
      >
        <div ref={canvasRef} className="w-full h-full relative">
          {/* SVG for connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#DFEC2D" />
              </marker>
            </defs>
            <g className="pointer-events-auto">{renderConnections()}</g>
          </svg>

          {/* Blocks */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {blocks.map((block) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: draggingBlock === block.id ? 1.05 : 1,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  position: 'absolute',
                  left: block.position.x,
                  top: block.position.y,
                  zIndex: draggingBlock === block.id ? 100 : selectedBlock === block.id ? 10 : 2,
                  borderColor: block.color,
                }}
                className={`w-64 p-4 rounded-xl border-2 shadow-lg transition-all select-none bg-[#161616] ${
                  draggingBlock === block.id ? 'cursor-grabbing shadow-2xl' : 'cursor-grab'
                } ${selectedBlock === block.id ? 'ring-2 ring-#DFEC2D shadow-2xl' : ''} ${
                  connectMode && connectionStart === block.id
                    ? 'ring-2 ring-#DFEC2D animate-pulse'
                    : ''
                } ${
                  connectMode && connectionStart && connectionStart !== block.id
                    ? 'ring-2 ring-#DFEC2D/50 opacity-80'
                    : ''
                }`}
                onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-2xl">
                    {BLOCK_TYPES.find((t) => t.id === block.type)?.icon}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{block.title}</h3>
                    <p className="text-xs text-gray-400">
                      {BLOCK_TYPES.find((t) => t.id === block.type)?.label}
                    </p>
                  </div>
                </div>
                {block.description && (
                  <p className="text-sm mt-2 text-gray-300">{block.description}</p>
                )}
                {block.connections.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-500">
                      {block.connections.length} connection
                      {block.connections.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Instructions banner */}
          {blocks.length > 0 && connectMode && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 py-3 rounded-xl shadow-2xl border-2 bg-[#DFEC2D]/90 border-[#DFEC2D] text-black backdrop-blur-sm"
              >
                <p className="font-medium">
                  {connectionStart
                    ? '✨ Click on the second block to connect'
                    : '🔗 Click on the first block to start connecting'}
                </p>
              </motion.div>
            </div>
          )}

          {/* Empty state */}
          {blocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-lg mb-4 text-gray-400">
                  🎯 Double-click anywhere to add a block
                </p>
                <p className="text-sm text-gray-500">or use the "Add Block" button →</p>
                <p className="text-xs mt-3 text-gray-600">
                  💡 Tip: Click and drag blocks to move them freely
                </p>
              </div>
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-2 rounded-lg shadow-lg border bg-[#161616] border-white/10 text-white hover:bg-[#1F1F1F]"
            >
              <ZoomOutIcon className="w-5 h-5" />
            </button>
            <div className="px-4 py-2 rounded-lg shadow-lg border flex items-center bg-[#161616] border-white/10 text-white">
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-2 rounded-lg shadow-lg border bg-[#161616] border-white/10 text-white hover:bg-[#1F1F1F]"
            >
              <ZoomInIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setZoom(1)
                setPan({ x: 0, y: 0 })
              }}
              className="px-3 py-2 rounded-lg shadow-lg border text-xs font-medium bg-[#161616] border-white/10 text-white hover:bg-[#1F1F1F]"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 space-y-4 overflow-y-auto">
        {/* Toolbar */}
        <div className="rounded-2xl border border-white/10 p-4 space-y-3 bg-[#161616]">
          <h3 className="font-semibold text-white">Tools</h3>
          <Button
            variant="primary"
            onClick={() => setIsAddingBlock(!isAddingBlock)}
            className="w-full"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Block
          </Button>
          <Button
            variant={connectMode ? 'primary' : 'secondary'}
            onClick={() => {
              setConnectMode(!connectMode)
              setConnectionStart(null)
            }}
            className="w-full"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            {connectMode ? 'Cancel Connection' : 'Connect Blocks'}
          </Button>
          {connectMode && (
            <p className="text-xs text-gray-400">
              {connectionStart
                ? 'Click on second block to connect'
                : 'Click on first block to start'}
            </p>
          )}

          <div className="pt-2 border-t border-white/10">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleExport}
                className="flex-1 !py-2"
                disabled={blocks.length === 0}
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 !py-2"
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Add block menu */}
        <AnimatePresence>
          {isAddingBlock && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-white/10 p-4 space-y-2 bg-[#161616]"
            >
              <h4 className="font-semibold mb-3 text-white">Select Block Type</h4>
              {BLOCK_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleAddBlock(type.id as any)}
                  className="w-full text-left p-3 rounded-lg border transition bg-[#0B0B0B] border-white/10 hover:border-#DFEC2D/50"
                >
                  <span className="text-xl mr-3">{type.icon}</span>
                  <span className="text-white">{type.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Block editor */}
        {selectedBlockData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 p-4 space-y-4 bg-[#161616]"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Edit Block</h3>
              <button
                onClick={() => handleDeleteBlock(selectedBlockData.id)}
                className="p-2 rounded-lg transition hover:bg-red-500/10 text-red-400"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Title</label>
              <input
                type="text"
                value={selectedBlockData.title}
                onChange={(e) => handleUpdateBlock(selectedBlockData.id, { title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-[#0B0B0B] border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
              <textarea
                value={selectedBlockData.description}
                onChange={(e) =>
                  handleUpdateBlock(selectedBlockData.id, { description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 rounded-lg border bg-[#0B0B0B] border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Color</label>
              <div className="grid grid-cols-4 gap-2">
                {BLOCK_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleUpdateBlock(selectedBlockData.id, { color: color.value })}
                    className={`h-10 rounded-lg border-2 transition ${
                      selectedBlockData.color === color.value
                        ? 'border-white scale-110 shadow-lg'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {selectedBlockData.connections.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Connections ({selectedBlockData.connections.length})
                </label>
                <div className="space-y-2">
                  {selectedBlockData.connections.map((connId) => {
                    const connectedBlock = blocks.find((b) => b.id === connId)
                    if (!connectedBlock) return null
                    return (
                      <div
                        key={connId}
                        className="flex items-center justify-between p-2 rounded-lg border bg-[#0B0B0B] border-white/10"
                      >
                        <span className="text-sm text-white">
                          {BLOCK_TYPES.find((t) => t.id === connectedBlock.type)?.icon}{' '}
                          {connectedBlock.title}
                        </span>
                        <button
                          onClick={() => handleDisconnect(selectedBlockData.id, connId)}
                          className="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-500/10"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default RoadmapTab

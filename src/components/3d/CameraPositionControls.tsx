import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'
import { useState } from 'react'
import { useTheme } from '../../theme/ThemeContext'

interface CameraPosition {
  id: string
  name: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  fov: number
  timestamp: string
}

interface CameraPositionControlsProps {
  positions: CameraPosition[]
  onSavePosition: (name: string, position: any, rotation: any, fov: number) => void
  onLoadPosition: (position: CameraPosition) => void
  onDeletePosition: (id: string) => void
  currentCamera: any // Three.js camera
}

const CameraPositionControls: React.FC<CameraPositionControlsProps> = ({
  positions,
  onSavePosition,
  onLoadPosition,
  onDeletePosition,
  currentCamera,
}) => {
  const { colors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [newPositionName, setNewPositionName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    if (!newPositionName.trim() || !currentCamera) return

    setIsSaving(true)
    const position = currentCamera.position
    const rotation = currentCamera.rotation
    const fov = currentCamera.fov

    onSavePosition(
      newPositionName.trim(),
      { x: position.x, y: position.y, z: position.z },
      { x: rotation.x, y: rotation.y, z: rotation.z },
      fov
    )

    setNewPositionName('')
    setIsSaving(false)
  }

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105"
        style={{
          backgroundColor: colors.accent_primary,
          color: colors.bg_primary,
        }}
      >
        📷 Cameras ({positions.length})
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 w-80 rounded-xl p-4 border backdrop-blur-md shadow-xl z-50"
            style={{
              backgroundColor: 'rgba(0,0,0,0.9)',
              borderColor: colors.border_primary,
            }}
          >
            <h3
              className="text-sm font-semibold mb-3 uppercase tracking-wider"
              style={{ color: colors.text_secondary }}
            >
              Camera Positions
            </h3>

            {/* Save New Position */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Position name..."
                  value={newPositionName}
                  onChange={(e) => setNewPositionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  className="flex-1 px-3 py-2 rounded-lg text-sm border"
                  style={{
                    backgroundColor: colors.bg_secondary,
                    borderColor: colors.border_secondary,
                    color: colors.text_primary,
                  }}
                />
                <button
                  onClick={handleSave}
                  disabled={!newPositionName.trim() || isSaving}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: colors.accent_primary,
                    color: colors.bg_primary,
                  }}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Saved Positions List */}
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {positions.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: colors.text_tertiary }}>
                  No saved camera positions yet
                </p>
              ) : (
                positions.map((pos) => (
                  <motion.div
                    key={pos.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-opacity-70 transition-all group"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderColor: colors.border_tertiary,
                    }}
                    onClick={() => onLoadPosition(pos)}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: colors.text_primary }}>
                        {pos.name}
                      </p>
                      <p className="text-xs opacity-60" style={{ color: colors.text_tertiary }}>
                        {new Date(pos.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeletePosition(pos.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-red-500/20"
                      style={{ color: '#ef4444' }}
                    >
                      🗑️
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CameraPositionControls

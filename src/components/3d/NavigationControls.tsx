import { motion } from 'framer-motion'
import { useState } from 'react'
import { useTheme } from '@/theme/ThemeContext'

// 3D navigation icons
const OrbitIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
    />
  </svg>
)

const CameraIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
)

const LightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
)

const GridIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
)

const ResetIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
)

interface NavigationControlsProps {
  // Camera controls
  onCameraPreset: (
    preset: 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right' | 'isometric'
  ) => void
  // Lighting controls
  onLightingChange: (lighting: {
    ambientIntensity: number
    directionalIntensity: number
    directionalPosition: [number, number, number]
  }) => void
  // Display options
  onGridToggle: (enabled: boolean) => void
  onWireframeToggle: (enabled: boolean) => void
  onAutoRotateToggle: (enabled: boolean) => void
  // Reset
  onReset: () => void
  // Current state
  gridEnabled?: boolean
  wireframeEnabled?: boolean
  autoRotateEnabled?: boolean
  ambientIntensity?: number
  directionalIntensity?: number
}

export default function NavigationControls({
  onCameraPreset,
  onLightingChange,
  onGridToggle,
  onWireframeToggle,
  onAutoRotateToggle,
  onReset,
  gridEnabled = false,
  wireframeEnabled = false,
  autoRotateEnabled = false,
  ambientIntensity = 0.6,
  directionalIntensity = 0.4,
}: NavigationControlsProps) {
  const { colors, isDark } = useTheme()
  const [showControls, setShowControls] = useState(true)
  const [activeTab, setActiveTab] = useState<'camera' | 'lighting' | 'display'>('camera')

  const handleCameraPreset = (preset: NavigationControlsProps['onCameraPreset']) => {
    onCameraPreset(preset)
  }

  const handleLightingChange = (type: 'ambient' | 'directional', value: number) => {
    if (type === 'ambient') {
      onLightingChange({
        ambientIntensity: value,
        directionalIntensity,
        directionalPosition: [5, 5, 5],
      })
    } else {
      onLightingChange({
        ambientIntensity,
        directionalIntensity: value,
        directionalPosition: [5, 5, 5],
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Toggle Button */}
      <motion.button
        onClick={() => setShowControls(!showControls)}
        style={{
          background: colors.bg_secondary,
          border: `1px solid ${colors.border}`,
          color: colors.text_primary,
          borderRadius: '12px',
          padding: '12px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'all 0.2s',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <CameraIcon className="w-5 h-5" />
      </motion.button>

      {/* Control Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '60px',
              right: '0',
              width: '280px',
              background: colors.bg_secondary,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              backdropFilter: 'blur(12px)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px',
                borderBottom: `1px solid ${colors.border}`,
                background: colors.bg_tertiary,
              }}
            >
              <h3
                style={{
                  color: colors.text_primary,
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: 0,
                }}
              >
                3D Navigation Controls
              </h3>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              {[
                { id: 'camera', label: 'Camera', icon: CameraIcon },
                { id: 'lighting', label: 'Lighting', icon: LightIcon },
                { id: 'display', label: 'Display', icon: GridIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom:
                      activeTab === tab.id
                        ? `2px solid ${colors.accent_primary}`
                        : '2px solid transparent',
                    color: activeTab === tab.id ? colors.accent_primary : colors.text_secondary,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
              {/* Camera Tab */}
              {activeTab === 'camera' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h4
                      style={{
                        color: colors.text_primary,
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '12px',
                      }}
                    >
                      Camera Presets
                    </h4>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                      }}
                    >
                      {[
                        { preset: 'front' as const, label: 'Front' },
                        { preset: 'back' as const, label: 'Back' },
                        { preset: 'top' as const, label: 'Top' },
                        { preset: 'bottom' as const, label: 'Bottom' },
                        { preset: 'left' as const, label: 'Left' },
                        { preset: 'right' as const, label: 'Right' },
                        { preset: 'isometric' as const, label: 'Isometric' },
                      ].map(({ preset, label }) => (
                        <motion.button
                          key={preset}
                          onClick={() => handleCameraPreset(preset)}
                          style={{
                            padding: '8px',
                            background: colors.bg_tertiary,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            color: colors.text_secondary,
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          whileHover={{
                            background: colors.accent_primary,
                            color: 'white',
                            borderColor: colors.accent_primary,
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      style={{
                        color: colors.text_secondary,
                        fontSize: '11px',
                        margin: 0,
                        lineHeight: '1.4',
                      }}
                    >
                      💡 <strong>Tip:</strong> Use mouse to orbit (drag), scroll to zoom, and
                      right-click to pan.
                    </p>
                  </div>
                </div>
              )}

              {/* Lighting Tab */}
              {activeTab === 'lighting' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label
                      style={{
                        color: colors.text_primary,
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Ambient Light: {(ambientIntensity * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ambientIntensity * 100}
                      onChange={(e) =>
                        handleLightingChange('ambient', Number(e.target.value) / 100)
                      }
                      style={{
                        width: '100%',
                        cursor: 'pointer',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        color: colors.text_primary,
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Directional Light: {(directionalIntensity * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={directionalIntensity * 100}
                      onChange={(e) =>
                        handleLightingChange('directional', Number(e.target.value) / 100)
                      }
                      style={{
                        width: '100%',
                        cursor: 'pointer',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                    }}
                  >
                    {[
                      { label: 'Studio', ambient: 0.4, directional: 0.8 },
                      { label: 'Outdoor', ambient: 0.7, directional: 0.3 },
                      { label: 'Dramatic', ambient: 0.2, directional: 1.0 },
                      { label: 'Soft', ambient: 0.8, directional: 0.2 },
                    ].map(({ label, ambient, directional }) => (
                      <motion.button
                        key={label}
                        onClick={() =>
                          onLightingChange({
                            ambientIntensity: ambient,
                            directionalIntensity: directional,
                            directionalPosition: [5, 5, 5],
                          })
                        }
                        style={{
                          padding: '8px',
                          background: colors.bg_tertiary,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '8px',
                          color: colors.text_secondary,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                        whileHover={{
                          background: colors.accent_primary,
                          color: 'white',
                          borderColor: colors.accent_primary,
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Display Tab */}
              {activeTab === 'display' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    {
                      id: 'grid',
                      label: 'Show Grid',
                      enabled: gridEnabled,
                      onChange: onGridToggle,
                      icon: GridIcon,
                    },
                    {
                      id: 'wireframe',
                      label: 'Wireframe Mode',
                      enabled: wireframeEnabled,
                      onChange: onWireframeToggle,
                      icon: CameraIcon,
                    },
                    {
                      id: 'autoRotate',
                      label: 'Auto Rotate',
                      enabled: autoRotateEnabled,
                      onChange: onAutoRotateToggle,
                      icon: OrbitIcon,
                    },
                  ].map(({ id, label, enabled, onChange, icon: Icon }) => (
                    <motion.button
                      key={id}
                      onClick={() => onChange(!enabled)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: enabled ? colors.accent_primary : colors.bg_tertiary,
                        border: `1px solid ${enabled ? colors.accent_primary : colors.border}`,
                        borderRadius: '8px',
                        color: enabled ? 'white' : colors.text_secondary,
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span style={{ textAlign: 'left' }}>{label}</span>
                      <div
                        style={{
                          marginLeft: 'auto',
                          width: '16px',
                          height: '16px',
                          borderRadius: '8px',
                          background: enabled ? 'white' : 'transparent',
                          border: `2px solid ${enabled ? 'white' : colors.border}`,
                          position: 'relative',
                        }}
                      >
                        {enabled && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '3px',
                              left: '5px',
                              width: '4px',
                              height: '7px',
                              background: colors.accent_primary,
                              borderRadius: '1px',
                              transform: 'rotate(45deg)',
                            }}
                          />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: `1px solid ${colors.border}`,
                background: colors.bg_tertiary,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  color: colors.text_secondary,
                  fontSize: '12px',
                }}
              >
                Alkemy 3D
              </span>
              <motion.button
                onClick={onReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  color: colors.text_secondary,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                whileHover={{
                  background: colors.accent_primary,
                  color: 'white',
                  borderColor: colors.accent_primary,
                }}
                whileTap={{ scale: 0.95 }}
              >
                <ResetIcon className="w-3 h-3" />
                Reset View
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

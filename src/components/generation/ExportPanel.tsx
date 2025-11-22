import { motion } from 'framer-motion'
import type React from 'react'
import { useState } from 'react'
import Button from '@/components/Button'
import { useTheme } from '@/theme/ThemeContext'

interface ExportOption {
  format: string
  label: string
  description: string
  icon: React.ReactNode
}

interface ExportPanelProps {
  data: any
  dataType: 'character' | 'world' | 'both'
  onExport: (format: string) => void
  isExporting?: boolean
  className?: string
}

const ExportPanel: React.FC<ExportPanelProps> = ({
  data,
  dataType,
  onExport,
  isExporting = false,
  className = '',
}) => {
  const { colors } = useTheme()
  const [selectedFormat, setSelectedFormat] = useState<string>('json')

  const characterExportOptions: ExportOption[] = [
    {
      format: 'json',
      label: 'JSON',
      description: 'Character identity data for Alkemy integration',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M12 18v-6M9 15h6" />
        </svg>
      ),
    },
    {
      format: 'zip',
      label: 'ZIP Archive',
      description: 'All reference images + metadata JSON',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
    },
  ]

  const worldExportOptions: ExportOption[] = [
    {
      format: 'gltf',
      label: 'GLTF',
      description: 'Standard 3D format for most applications',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      ),
    },
    {
      format: 'usd',
      label: 'USD',
      description: 'Universal Scene Description for professional tools',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      format: 'splat',
      label: 'Gaussian Splat',
      description: 'Native splat format for specialized viewers',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
    },
  ]

  const exportOptions =
    dataType === 'character'
      ? characterExportOptions
      : dataType === 'world'
        ? worldExportOptions
        : [...characterExportOptions, ...worldExportOptions]

  const handleExport = () => {
    onExport(selectedFormat)
  }

  return (
    <div
      className={`p-6 rounded-xl ${className}`}
      style={{
        background: colors.surface_card,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: colors.border_color,
      }}
    >
      <h3 className="text-lg font-bold mb-4" style={{ color: colors.text_primary }}>
        Export Options
      </h3>

      <div className="space-y-3 mb-6">
        {exportOptions.map((option) => (
          <motion.button
            key={option.format}
            onClick={() => setSelectedFormat(option.format)}
            className="w-full p-4 rounded-lg text-left transition-all"
            style={{
              background:
                selectedFormat === option.format
                  ? 'rgba(16, 163, 127, 0.1)'
                  : colors.background_secondary,
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor:
                selectedFormat === option.format ? colors.accent_primary : colors.border_color,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 mt-1"
                style={{
                  color:
                    selectedFormat === option.format
                      ? colors.accent_primary
                      : colors.text_secondary,
                }}
              >
                {option.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold" style={{ color: colors.text_primary }}>
                    {option.label}
                  </h4>
                  {selectedFormat === option.format && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: colors.accent_primary }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </motion.div>
                  )}
                </div>
                <p className="text-sm" style={{ color: colors.text_tertiary }}>
                  {option.description}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <Button
        onClick={handleExport}
        variant="primary"
        disabled={isExporting || !data}
        className="w-full !py-3"
      >
        {isExporting ? (
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-t-transparent rounded-full border-white"
            />
            <span>Exporting...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span>Export as {selectedFormat.toUpperCase()}</span>
          </div>
        )}
      </Button>

      {!data && (
        <p className="text-sm text-center mt-3" style={{ color: colors.text_tertiary }}>
          Complete the workflow to enable export
        </p>
      )}
    </div>
  )
}

export default ExportPanel

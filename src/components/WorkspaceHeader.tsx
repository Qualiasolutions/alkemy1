import { motion } from 'framer-motion'
import type React from 'react'
import { useTheme } from '../theme/ThemeContext'
import Breadcrumb, { type BreadcrumbItem } from './Breadcrumb'

interface WorkspaceHeaderProps {
  breadcrumbs: BreadcrumbItem[]
  title?: string
  actions?: React.ReactNode
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ breadcrumbs, title, actions }) => {
  const { isDark } = useTheme()

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`sticky top-0 z-20 backdrop-blur-xl border-b ${
        isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'
      } px-6 py-4`}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <Breadcrumb items={breadcrumbs} />
          {title && (
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{title}</h2>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </motion.div>
  )
}

export default WorkspaceHeader

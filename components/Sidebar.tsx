import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TABS_CONFIG, TABS } from '../constants';
import { LogoIcon, ChevronDownIcon, ChevronsLeftIcon, ChevronsRightIcon, PlusIcon, DownloadIcon, UploadIcon } from './icons/Icons';
import Button from './Button';
import { useTheme } from '../theme/ThemeContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (isExpanded: boolean) => void;
  onNewProject: () => void;
  onDownloadProject: () => void;
  onLoadProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isSidebarExpanded, setIsSidebarExpanded, onNewProject, onDownloadProject, onLoadProject }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['Development', 'Production', 'Media']);
  const { colors, isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionName)
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  return (
    <motion.nav
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`relative group bg-[var(--color-background-primary)] border-r border-[var(--color-border-color)] sticky top-0 flex h-screen flex-col p-4 transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'w-64' : 'w-20'}`}
    >
      {/* Subtle accent glow effects */}
      <div className="absolute top-20 left-0 w-24 h-24 rounded-full blur-3xl pointer-events-none bg-emerald-500/8 opacity-50" />
      <div className="absolute bottom-40 right-0 w-20 h-20 rounded-full blur-3xl pointer-events-none bg-emerald-400/6 opacity-40" />
      <div className={`flex items-center gap-3 mb-8 transition-all duration-300 ${isSidebarExpanded ? 'px-2' : 'justify-center'}`}>
        <LogoIcon />
        <h1 className={`text-xl font-semibold whitespace-nowrap transition-opacity duration-200 text-[var(--color-text-primary)] ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Alkemy AI Studio</h1>
      </div>
      
      <ul className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        {isSidebarExpanded ? (
          // Expanded View with Sections
          <div className="space-y-2.5">
            {TABS_CONFIG.map((section) => {
              const isExpanded = expandedSections.includes(section.name);
              return (
                <li key={section.name} className="list-none">
                  <button
                    onClick={() => toggleSection(section.name)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-primary)]"
                  >
                    {section.name}
                    <motion.span
                      animate={{ rotate: isExpanded ? 0 : -90 }}
                      transition={{ duration: 0.24, ease: 'easeInOut' }}
                      className="w-4 h-4"
                    >
                      <ChevronDownIcon />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.24, ease: 'easeInOut' }}
                        className="space-y-0.5 mt-1 overflow-hidden"
                      >
                        {section.tabs.map((tab) => {
                          const isActive = activeTab === tab.id;

                          return (
                            <li key={tab.id} className="relative">
                              <motion.button
                                onClick={() => setActiveTab(tab.id)}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative w-full flex items-center gap-2.5 pl-4 pr-2 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                                  isActive
                                    ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 text-[var(--color-accent-primary)]'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover-background)] hover:text-[var(--color-text-primary)]'
                                }`}
                              >
                                {isActive && (
                                  <motion.span
                                    layoutId="sidebar-active-pill"
                                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 border border-emerald-500/30"
                                    transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                                  />
                                )}
                                <span className="w-5 h-5 flex-shrink-0 relative z-10">{tab.icon}</span>
                                <span className="whitespace-nowrap relative z-10">{tab.name}</span>
                              </motion.button>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </div>
        ) : (
          // Collapsed View: Icons only
          <ul className="space-y-2">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;

              return (
                <li key={tab.id} className="relative group/item">
                  <motion.button
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative w-full flex items-center justify-center p-3 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 text-[var(--color-accent-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover-background)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-collapsed-active"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 border border-emerald-500/30"
                        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                      />
                    )}
                    <span className="w-5 h-5 relative z-10">{tab.icon}</span>
                  </motion.button>

                  {/* Enhanced Tooltip */}
                  <div className="absolute left-full ml-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none transition-all duration-200 opacity-0 scale-95 group-hover/item:opacity-100 group-hover/item:scale-100 z-30 bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border-color)] shadow-theme-xl">
                    {tab.name}
                    <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 rotate-45 bg-[var(--color-surface-elevated)] border-l border-t border-[var(--color-border-color)]" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ul>
      
      <div className="mt-auto pt-4 border-t border-[var(--color-border-color)] space-y-2">
        <Button
            onClick={onNewProject}
            variant="secondary"
            className={`w-full ${isSidebarExpanded ? '' : '!px-0'}`}
        >
            <PlusIcon className="w-4 h-4 flex-shrink-0" />
            {isSidebarExpanded && <span className="whitespace-nowrap">New Project</span>}
        </Button>
        <Button
            onClick={onDownloadProject}
            variant="secondary"
            className={`w-full ${isSidebarExpanded ? '' : '!px-0'}`}
            title="Save Project As..."
        >
            <DownloadIcon className="w-4 h-4 flex-shrink-0" />
            {isSidebarExpanded && <span className="whitespace-nowrap">Save As...</span>}
        </Button>
        <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
            className={`w-full ${isSidebarExpanded ? '' : '!px-0'}`}
            title="Load Project"
        >
            <UploadIcon className="w-4 h-4 flex-shrink-0" />
            {isSidebarExpanded && <span className="whitespace-nowrap">Load Project</span>}
        </Button>
        <input
            ref={fileInputRef}
            type="file"
            accept=".alkemy.json,application/json"
            onChange={onLoadProject}
            className="hidden"
        />
      </div>

      {/* Beautiful Toggle Button */}
      <motion.button
        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
        aria-label={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        whileHover={{ scale: 1.15, rotate: 180 }}
        whileTap={{ scale: 0.85 }}
        className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 rounded-full p-2.5 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 z-20 bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 border border-emerald-500/30 text-emerald-400 hover:from-emerald-500/30 hover:to-emerald-400/20 hover:border-emerald-400/50 hover:text-emerald-300 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 backdrop-blur-sm"
      >
        {/* Animated glow ring */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md"
        />
        <span className="w-5 h-5 flex items-center justify-center relative z-10">
          {isSidebarExpanded ? <ChevronsLeftIcon /> : <ChevronsRightIcon />}
        </span>
      </motion.button>
    </motion.nav>
  );
};

export default Sidebar;

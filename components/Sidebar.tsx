import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TABS_CONFIG, TABS } from '../constants';
import { ChevronDownIcon, ChevronsLeftIcon, ChevronsRightIcon, PlusIcon } from './icons/Icons';
import Button from './Button';
import { ModernCard } from './ui/modern-card';
import { animationPresets } from './animations/motion-presets';
import { useTheme } from '../theme/ThemeContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (isExpanded: boolean) => void;
  onNewProject: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isSidebarExpanded, setIsSidebarExpanded, onNewProject }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['Development', 'Production', 'Media']);
  const { colors, isDark } = useTheme();

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionName)
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  return (
    <motion.nav
      {...animationPresets.sidebarSlide}
      className={`relative group glass border-r border-[var(--color-border-color)] sticky top-0 flex h-screen flex-col transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'w-64 p-4' : 'w-20 p-3'}`}
      style={{
        background: colors.glass_bg,
        backdropFilter: 'blur(10px)',
        borderRight: `1px solid ${colors.glass_border}`
      }}
    >
      {/* Subtle accent glow effects */}
      <div className="absolute top-20 left-0 w-24 h-24 rounded-full blur-3xl pointer-events-none bg-[var(--color-accent-secondary)]/8 opacity-50" />
      <div className="absolute bottom-40 right-0 w-20 h-20 rounded-full blur-3xl pointer-events-none bg-[var(--color-accent-secondary)]/6 opacity-40" />
      <div className={`flex items-center justify-center border-b border-[var(--color-border-color)] transition-all duration-300 ${isSidebarExpanded ? 'mb-6 pb-4 px-2' : 'mb-4 pb-0 border-b-0'}`}>
        <img
          src="/logo.jpeg"
          alt="Alkemy AI Studio"
          className={`object-contain ${isSidebarExpanded ? 'h-16 w-auto' : 'h-14 w-14'}`}
        />
      </div>

      <ul className={`flex-1 overflow-y-auto overflow-x-hidden relative z-10 ${isSidebarExpanded ? 'space-y-6' : 'space-y-3'}`}>
        {isSidebarExpanded ? (
          // Expanded View with Sections
          <>
            {TABS_CONFIG.map((section, sectionIndex) => {
              const isExpanded = expandedSections.includes(section.name);
              return (
                <li key={section.name} className="list-none">
                  {sectionIndex > 0 && <div className="h-px bg-[var(--color-border-color)] mb-6" />}
                  <button
                    onClick={() => toggleSection(section.name)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-all duration-200 text-[var(--color-accent-secondary)] hover:text-[var(--color-accent-secondary)] rounded-lg hover:bg-[var(--color-accent-secondary)]/5"
                  >
                    <span>{section.name}</span>
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
                        className="space-y-1 mt-2 overflow-hidden"
                      >
                        {section.tabs.map((tab) => {
                          const isActive = activeTab === tab.id;

                          return (
                            <li key={tab.id} className="relative">
                              <motion.button
                                onClick={() => setActiveTab(tab.id)}
                                {...animationPresets.buttonPress}
                                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover-lift ${
                                  isActive
                                    ? 'text-white shadow-lg'
                                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                }`}
                                style={{
                                  background: isActive ? colors.gradient_secondary : 'transparent',
                                }}
                              >
                                {isActive && (
                                  <motion.span
                                    layoutId="sidebar-active-pill"
                                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--color-accent-secondary)]/25 via-[var(--color-accent-secondary)]/15 to-[var(--color-accent-secondary)]/10 border-l-2 border-[var(--color-accent-secondary)]"
                                    transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                                  />
                                )}
                                <span className={`w-5 h-5 flex-shrink-0 relative z-10 ${isActive ? 'text-[var(--color-accent-secondary)]' : ''}`}>
                                  <img src={tab.icon} alt={tab.name} className="w-full h-full" />
                                </span>
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
          </>
        ) : (
          // Collapsed View: Icons only
          <>
            {TABS.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const sectionIndex = TABS_CONFIG.findIndex(section =>
                section.tabs.some(t => t.id === tab.id)
              );
              const prevSectionIndex = index > 0 ? TABS_CONFIG.findIndex(section =>
                section.tabs.some(t => t.id === TABS[index - 1].id)
              ) : -1;
              const showDivider = index > 0 && sectionIndex !== prevSectionIndex;

              return (
                <React.Fragment key={tab.id}>
                  {showDivider && <div className="h-px bg-[var(--color-border-color)] my-3" />}
                  <li className="relative group/item">
                    <motion.button
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.92 }}
                      className={`relative w-full flex items-center justify-center rounded-xl text-sm transition-all duration-200 px-2.5 py-2 ${
                        isActive
                          ? 'bg-gradient-to-br from-[var(--color-accent-secondary)]/25 to-[var(--color-accent-secondary)]/15 text-[var(--color-accent-secondary)] shadow-lg shadow-[var(--color-accent-secondary)]/20'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover-background)] hover:text-[var(--color-accent-secondary)]'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-collapsed-active"
                          className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--color-accent-secondary)]/25 to-[var(--color-accent-secondary)]/15 border-l-2 border-[var(--color-accent-secondary)]"
                          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                        />
                      )}
                      <span className="w-5 h-5 relative z-10">
                        <img src={tab.icon} alt={tab.name} className="w-full h-full" />
                      </span>
                    </motion.button>

                    {/* Enhanced Tooltip */}
                    <div className="absolute left-full ml-3 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap pointer-events-none transition-all duration-200 opacity-0 scale-95 group-hover/item:opacity-100 group-hover/item:scale-100 z-30 bg-gradient-to-r from-[var(--color-accent-secondary)]/95 to-[var(--color-accent-secondary)]/95 text-white border border-[var(--color-accent-secondary)]/20 shadow-xl shadow-[var(--color-accent-secondary)]/30 backdrop-blur-sm">
                      {tab.name}
                      <div className="absolute top-1/2 -left-1.5 transform -translate-y-1/2 w-3 h-3 rotate-45 bg-[var(--color-accent-secondary)] border-l border-t border-[var(--color-accent-secondary)]/20" />
                    </div>
                  </li>
                </React.Fragment>
              );
            })}
          </>
        )}
      </ul>
  
      <div className={`mt-auto border-t border-[var(--color-border-color)] ${isSidebarExpanded ? 'pt-6' : 'pt-4'}`}>
        <Button
            onClick={onNewProject}
            variant="secondary"
            size={isSidebarExpanded ? 'md' : 'sm'}
            className={`w-full ${isSidebarExpanded ? '' : '!px-0'}`}
        >
            <PlusIcon className="w-4 h-4 flex-shrink-0" />
            {isSidebarExpanded && <span className="whitespace-nowrap">New Project</span>}
        </Button>
      </div>

      {/* Beautiful Toggle Button */}
      <motion.button
        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
        aria-label={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        whileHover={{ scale: 1.15, rotate: 180 }}
        whileTap={{ scale: 0.85 }}
        className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 rounded-full p-2.5 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 z-20 bg-gradient-to-br from-[var(--color-accent-secondary)]/20 to-[var(--color-accent-secondary)]/10 border border-[var(--color-accent-secondary)]/30 text-[var(--color-accent-secondary)] hover:from-[var(--color-accent-secondary)]/30 hover:to-[var(--color-accent-secondary)]/20 hover:border-[var(--color-accent-secondary)]/50 hover:text-[var(--color-accent-secondary)] shadow-lg shadow-[var(--color-accent-secondary)]/20 hover:shadow-xl hover:shadow-[var(--color-accent-secondary)]/30 backdrop-blur-sm"
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
          className="absolute inset-0 rounded-full bg-[var(--color-accent-secondary)]/20 blur-md"
        />
        <span className="w-5 h-5 flex items-center justify-center relative z-10">
          {isSidebarExpanded ? <ChevronsLeftIcon /> : <ChevronsRightIcon />}
        </span>
      </motion.button>
    </motion.nav>
  );
};

export default Sidebar;

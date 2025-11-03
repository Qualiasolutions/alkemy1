import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TABS_CONFIG, TABS } from '../constants';
import { LogoIcon, ChevronDownIcon, ChevronsLeftIcon, ChevronsRightIcon, PlusIcon } from './icons/Icons';
import Button from './Button';
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

  const sidebarBg = isDark
    ? 'bg-gradient-to-br from-[#0B0B0B] via-[#0F0F0F] to-[#0B0B0B]'
    : 'bg-gradient-to-br from-[#FFFFFF] via-[#F8F8F8] to-[#FFFFFF]';

  const borderColor = isDark ? 'border-[#2A2A2A]' : 'border-[#D4D4D4]';

  return (
    <motion.nav
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`relative group ${sidebarBg} border-r ${borderColor} flex flex-col p-4 transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'w-64' : 'w-20'}`}
    >
      <div className={`flex items-center gap-3 mb-8 transition-all duration-300 ${isSidebarExpanded ? 'px-2' : 'justify-center'}`}>
        <LogoIcon />
        <h1 className={`text-xl font-semibold whitespace-nowrap transition-opacity duration-200 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Alkemy AI Studio</h1>
      </div>
      
      <ul className="flex-1 overflow-y-auto overflow-x-hidden">
        {isSidebarExpanded ? (
          // Expanded View with Sections
          <div className="space-y-4">
            {TABS_CONFIG.map((section) => {
              const isExpanded = expandedSections.includes(section.name);
              return (
                <li key={section.name} className="list-none">
                  <button
                    onClick={() => toggleSection(section.name)}
                    className={`w-full flex items-center justify-between px-2 py-1 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                      isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {section.name}
                    <motion.span
                      animate={{ rotate: isExpanded ? 0 : -90 }}
                      transition={{ duration: 0.24, ease: 'easeInOut' }}
                      className="w-5 h-5"
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
                          const activeBg = isDark
                            ? 'bg-gradient-to-r from-[#10A37F]/20 to-[#1AD8B1]/10'
                            : 'bg-gradient-to-r from-[#0FB98D]/20 to-[#0D8F74]/10';
                          const activeText = `text-[${colors.accent_primary}]`;
                          const inactiveText = isDark ? 'text-[#A0A0A0]' : 'text-[#505050]';
                          const hoverBg = isDark ? 'hover:bg-[#1C1C1C]' : 'hover:bg-[#EBEBEB]';
                          const hoverText = isDark ? 'hover:text-white' : 'hover:text-black';

                          return (
                            <li key={tab.id} className="relative">
                              <motion.button
                                onClick={() => setActiveTab(tab.id)}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative w-full flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                                  isActive ? `${activeBg} ${activeText}` : `${inactiveText} ${hoverBg} ${hoverText}`
                                }`}
                              >
                                {isActive && (
                                  <motion.span
                                    layoutId="sidebar-active-pill"
                                    className={`absolute inset-0 rounded-lg ${activeBg} border ${
                                      isDark ? 'border-[#10A37F]/30' : 'border-[#0FB98D]/30'
                                    }`}
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
              const activeBg = isDark
                ? 'bg-gradient-to-r from-[#10A37F]/20 to-[#1AD8B1]/10'
                : 'bg-gradient-to-r from-[#0FB98D]/20 to-[#0D8F74]/10';
              const activeText = `text-[${colors.accent_primary}]`;
              const inactiveText = isDark ? 'text-[#A0A0A0]' : 'text-[#505050]';
              const hoverBg = isDark ? 'hover:bg-[#1C1C1C]' : 'hover:bg-[#EBEBEB]';
              const hoverText = isDark ? 'hover:text-white' : 'hover:text-black';

              return (
                <li key={tab.id}>
                  <motion.button
                    onClick={() => setActiveTab(tab.id)}
                    title={tab.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full flex items-center justify-center p-3 rounded-lg text-sm transition-all duration-200 ${
                      isActive ? `${activeBg} ${activeText}` : `${inactiveText} ${hoverBg} ${hoverText}`
                    }`}
                  >
                    <span className="w-5 h-5">{tab.icon}</span>
                  </motion.button>
                </li>
              );
            })}
          </ul>
        )}
      </ul>
      
      <div className={`mt-auto pt-4 border-t ${borderColor}`}>
        <Button
            onClick={onNewProject}
            variant="secondary"
            className={`w-full ${isSidebarExpanded ? '' : '!px-0'}`}
        >
            <PlusIcon className="w-4 h-4 flex-shrink-0" />
            {isSidebarExpanded && <span className="whitespace-nowrap">New Project</span>}
        </Button>
      </div>

      <motion.button
        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
        aria-label={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 ${
          isDark ? 'bg-[#161616]' : 'bg-white'
        } border ${borderColor} rounded-full p-1.5 ${
          isDark ? 'text-[#A0A0A0] hover:text-white hover:bg-[#1C1C1C]' : 'text-[#505050] hover:text-black hover:bg-[#F5F5F5]'
        } transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 shadow-lg`}
      >
        <span className="w-4 h-4 block">
          {isSidebarExpanded ? <ChevronsLeftIcon /> : <ChevronsRightIcon />}
        </span>
      </motion.button>
    </motion.nav>
  );
};

export default Sidebar;
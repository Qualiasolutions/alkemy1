import React, { useState } from 'react';
import { TABS_CONFIG, TABS, THEME_COLORS } from '../constants';
import { LogoIcon, ChevronDownIcon, ChevronsLeftIcon, ChevronsRightIcon, PlusIcon } from './icons/Icons';
import Button from './Button';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (isExpanded: boolean) => void;
  onNewProject: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isSidebarExpanded, setIsSidebarExpanded, onNewProject }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['Development', 'Production', 'Media']);

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionName)
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  return (
    <nav className={`relative group bg-[${THEME_COLORS.background_primary}] border-r border-[${THEME_COLORS.border_color}] flex flex-col p-4 transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'w-64' : 'w-20'}`}>
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
                    className="w-full flex items-center justify-between px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {section.name}
                    <span className={`w-5 h-5 transition-transform duration-300 ${!isExpanded && '-rotate-90'}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                  {isExpanded && (
                    <ul className="space-y-1 mt-2">
                      {section.tabs.map((tab) => (
                        <li key={tab.id}>
                          <button
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                              activeTab === tab.id
                                ? `bg-[${THEME_COLORS.active_background}] text-[${THEME_COLORS.accent_primary}]`
                                : `text-[${THEME_COLORS.text_secondary}] hover:bg-[${THEME_COLORS.hover_background}] hover:text-[${THEME_COLORS.text_primary}]`
                            }`}
                          >
                            <span className="w-5 h-5 flex-shrink-0">{tab.icon}</span>
                            <span className="whitespace-nowrap">{tab.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </div>
        ) : (
          // Collapsed View: Icons only
          <ul className="space-y-2">
            {TABS.map(tab => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.name}
                  className={`w-full flex items-center justify-center p-3 rounded-lg text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? `bg-[${THEME_COLORS.active_background}] text-[${THEME_COLORS.accent_primary}]`
                      : `text-[${THEME_COLORS.text_secondary}] hover:bg-[${THEME_COLORS.hover_background}] hover:text-[${THEME_COLORS.text_primary}]`
                  }`}
                >
                  <span className="w-5 h-5">{tab.icon}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ul>
      
      <div className={`mt-auto pt-4 border-t border-[${THEME_COLORS.border_color}]`}>
        <Button
            onClick={onNewProject}
            variant="secondary"
            className={`w-full ${isSidebarExpanded ? '' : '!px-0'}`}
        >
            <PlusIcon className="w-4 h-4 flex-shrink-0" />
            {isSidebarExpanded && <span className="whitespace-nowrap">New Project</span>}
        </Button>
      </div>

      <button
        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
        aria-label={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        className={`absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 bg-[${THEME_COLORS.surface_card}] border border-[${THEME_COLORS.border_color}] rounded-full p-1.5 text-[${THEME_COLORS.text_secondary}] hover:text-[${THEME_COLORS.text_primary}] hover:bg-[${THEME_COLORS.hover_background}] transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 z-10`}
      >
        <span className="w-4 h-4 block">
          {isSidebarExpanded ? <ChevronsLeftIcon /> : <ChevronsRightIcon />}
        </span>
      </button>
    </nav>
  );
};

export default Sidebar;
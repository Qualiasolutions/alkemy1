
import React from 'react';
import { ScriptIcon, UsersIcon, MapPinIcon, ImageIcon, ShirtIcon, PresentationIcon, ClapperboardIcon, FilmIcon, ShuffleIcon, ScissorsIcon, SendIcon, SparklesIcon, CalendarIcon, BarChartIcon, PaletteIcon, BrainIcon } from './components/icons/Icons';

export const THEME_COLORS = {
  background_primary: "#0B0B0B",
  background_secondary: "#121212",
  surface_card: "#161616",
  accent_primary: "#10A37F",
  accent_secondary: "#0E8C6D",
  text_primary: "#FFFFFF",
  text_secondary: "#B5B5B5",
  border_color: "#242424",
  divider_color: "#1A1A1A",
  hover_background: "#1B1B1B",
  active_background: "#202020",
  success: "#10A37F",
  warning: "#F5A524",
  error: "#F04438",
};

export const TABS_CONFIG = [
  {
    name: 'Development',
    tabs: [
      { id: 'script', name: 'Script', icon: React.createElement(ScriptIcon) },
      { id: 'moodboard', name: 'Moodboard', icon: React.createElement(PaletteIcon) },
      { id: 'the_director', name: 'The Director', icon: React.createElement(BrainIcon) },
      { id: 'cast_locations', name: 'Cast & Locations', icon: React.createElement(UsersIcon) },
      { id: 'compositing', name: 'Compositing', icon: React.createElement(ClapperboardIcon) },
      { id: 'presentation', name: 'Presentation', icon: React.createElement(PresentationIcon) },
    ],
  },
  {
    name: 'Production',
    tabs: [
      { id: 'timeline', name: 'Timeline', icon: React.createElement(FilmIcon) },
      { id: 'wan_transfer', name: 'Wan Transfer', icon: React.createElement(ShuffleIcon) },
      { id: 'post_production', name: 'Post-Production', icon: React.createElement(ScissorsIcon) },
      { id: 'exports', name: 'Exports', icon: React.createElement(SendIcon) },
    ],
  },
  {
    name: 'Media',
    tabs: [
      { id: 'social_spots', name: 'Social Spots', icon: React.createElement(SparklesIcon) },
      { id: 'scheduler', name: 'Scheduler', icon: React.createElement(CalendarIcon) },
      { id: 'analytics', name: 'Analytics', icon: React.createElement(BarChartIcon) },
    ],
  },
];

// A flattened array for convenience in other parts of the app (e.g., setting the default tab in App.tsx)
export const TABS = TABS_CONFIG.flatMap(group => group.tabs);
